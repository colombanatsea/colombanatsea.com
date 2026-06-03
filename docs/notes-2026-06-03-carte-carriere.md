# Notes de session, 2026-06-03, Carte de carrière maritime

## Contexte et objectif
Publier sur colombanatsea.com le projet de cartes de voyage (app `voyages-app` locale) :
reconstitution et impression d'une carrière maritime depuis un relevé de navigation.
Décisions cadrées avec Colomban en amont : outil interactif public (le visiteur dépose
son relevé), nouvelle route dédiée (le globe ZEE reste à `/carte`).

## Hypothèses et contraintes
- colombanatsea.com = Astro 5 + GitHub Pages, **statique pur, aucun backend**, posture de
  sécurité assumée (CSP au edge Cloudflare, `script-src 'self'`, pas de formulaire).
- `voyages-app` a un backend Flask : `/api/route` (résolution ports + searoute) et
  `/api/ingest` (parsing PDF/Excel). Incompatible tel quel avec GitHub Pages.
- Patron existant du site : viz autonomes en iframe (`public/viz/*.html`).

## Options évaluées et arbitrages
- **Backend déployé (Cloudflare Workers / hôte Python)** : permettrait searoute Python plus
  précis, mais casse la posture « zéro backend », ajoute infra/CORS/uptime. Rejeté.
- **Vitrine statique (carte de Colomban seule, non interactive)** : trivial, mais Colomban
  veut un outil public. Rejeté.
- **Portage client-side intégral** (retenu) : porter les deux fonctions backend en JS,
  tout tourne dans le navigateur, reste sur GitHub Pages, aucune donnée ne quitte le poste
  (meilleure confidentialité qu'un backend). Risque unique : le routage.
- **Routage** : `searoute-js` (même lignée Eurostat que la lib Python) bundlé en IIFE
  (485 Ko, 81 Ko gzip), lazy-loadé. Repli grand-cercle autonome si indisponible. Validé
  (formes réalistes Suez/Atlantique/Cap ; distances un peu hautes, acceptable pour un poster).

## Décisions prises et rationale
- Mini-app autonome sous `site/public/voyages/`, embarquée en iframe plein écran par
  `fr/carte-carriere.astro` + `en/career-map.astro`. Source canonique publiée = ce dossier ;
  `voyages-app/` reste l'app de dev/référence (hors repo).
- Portage : `lib/resolve.js` (ports.py), `lib/enrich.js` (server.py enrich), `lib/router.js`
  (searoute-js + repli), `lib/ingest.js` (parse_releve.py + pdf.js/SheetJS).
- Vendor self-hosté (CSP), libs lourdes lazy-loadées. Polices poster Fraunces/Space Grotesk/
  Space Mono + UI Poppins/Inter via Google Fonts (autorisé par la CSP).
- **Démarrage vierge** (demande Colomban) ; carte de Colomban via « Charger l'exemple »
  (`voyage-colomban.json` pré-enrichi, sans charger le routeur).
- **Mini-tutoriel** 1re visite (4 étapes, skippable, localStorage, réouvrable via bouton aide).
- **PDF parsé en thread principal** (pas de Web Worker, `isEvalSupported:false`) pour être
  robuste à `worker-src 'none'` et l'absence d'`unsafe-eval`.
- **Correction donnée** : escale « St Paul » du Marion Dufresne = Île Saint-Paul (TAAF, TFSPL),
  pas St Paul d'Alaska que le fuzzy avait retenu. Appliquée à la carte publiée seulement.
- Lien footer (colonne Navigation), pas de 7e item de nav (unification > multiplication).

## Vérifications
- **Parité** (`voyages-app/test/parity.mjs`) : enrich JS vs enrich Python identiques sur
  résolution, coords, méthode, score, temps de mer, totaux (4 navires, 38 escales).
- **E2E Playwright** (`e2e_carte.mjs`) : tuto, démarrage vierge, exemple sans searoute,
  lazy-load searoute à l'édition, ingestion CSV, EN, zéro erreur console.
- **E2E PDF sous CSP stricte** (`e2e_pdf_csp.mjs`, `worker-src 'none'`, sans `unsafe-eval`) :
  import réussi, zéro violation.
- **Build** Astro OK, `public/voyages` copié, aucune dépendance CDN externe dans `dist`.

## Points ouverts / risques / next steps
- Fidélité de routage searoute-js < searoute Python (assumé, poster).
- Mobile non travaillé (app pensée desktop/poster), limite connue de l'AUDIT.
- Anti-collision d'étiquettes perfectible sur zones denses (hors périmètre).
- Régénération de `voyage-colomban.json` : `node voyages-app/test/bake_colomban.cjs`
  (searoute-js optionnel, repli grand-cercle sinon).
