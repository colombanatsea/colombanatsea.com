# Colomban at Sea, Specifications Techniques

## Stack
- **Framework** : Astro 5.x (SSG), `site/`
- **3D** : Three.js (npm) + earcut (polygon triangulation)
- **Hébergement** : GitHub Pages (custom domain `colombanatsea.com`)
- **Base URL** : `/`
- **i18n** : Astro built-in (`prefixDefaultLocale: true`, `redirectToDefaultLocale: false`), locales FR/EN
  - Traductions : `site/src/i18n/translations.ts` (UI strings) + `site/src/i18n/utils.ts`
  - Routes : `/fr/` (defaut), `/en/`, redirect racine `/` → `/fr/` (meta refresh + JS instant)
  - Pages FR : `site/src/pages/fr/` (9 pages)
  - Pages EN : `site/src/pages/en/` (9 pages : index, about, engagements, speaking, media, contact, legal-notice, privacy-policy, sources)
  - hreflang bidirectionnel sur toutes les pages + sitemap xhtml:link

## Charte Graphique (source : `colombanatsea/brands`)

### Palette
| Nom | Hex | CSS var |
|-----|-----|---------|
| Bleu | `#2A55B3` | `--bleu` |
| Rose | `#B32A55` | `--rose` |
| Vert | `#00BF63` | `--vert` |
| Noir | `#0F0F0F` | `--noir` |
| Noir Doux | `#1A1A2E` | `--noir-doux` |
| Blanc | `#FAFAFA` | `--blanc` |
| Gris 100 | `#F2F2F5` | `--gris-100` |
| Gris 200 | `#E4E4EA` | `--gris-200` |
| Gris 400 | `#9D9DAF` | `--gris-400` |
| Gris 600 | `#5C5C6E` | `--gris-500` |
| Gris 800 | `#2E2E3A` |, |

### Typographie
| Police | Graisses | Role |
|--------|----------|------|
| **Poppins** | 300, 400, 500, 600, 700 | Titres, nom de marque "Colomban" |
| **Inter** | 300, 400, 500, 600 | Corps de texte, descriptions |
| **JetBrains Mono** | 400, 500 | Monospace : "at sea", labels techniques, URLs |

### Logo, Noeud entrelacé
- SVG 3 layers : ruban bleu complet, ruban vert par-dessus au croisement bas, arc bleu redessiné par-dessus au croisement haut
- Accent diamant vert en haut à droite
- Favicon = noeud SVG (viewBox 0 0 200 200)
- Lockup horizontal : [noeud] | [divider 1.5px] | [Colomban (Poppins 700) + at sea (JetBrains Mono 0.55rem lowercase)]

### Éléments signature
- **Ligne gradient haut** : `linear-gradient(90deg, --bleu, --vert)`, 3px, `border-top` du body
- **Point coloré fin de titre** : `.` vert sur fond sombre, `.` bleu sur fond clair
- **3 fonds** : Noir Doux (#1A1A2E), Blanc (#FAFAFA), Bleu (#2A55B3)
- **Dividers** : `divider.svg` du repo `colombanatsea/logos`, 64px, 18% opacité

### Indicateurs de scroll
- Pattern reutilise : `.scroll-hint` + `.scroll-hint__line` avec animation `scroll-pulse`
- Utilise sur : homepage hero, mediaviz timeline
- Mobile : visible, meme style

## Composants 3D

### Globe (`Globe.astro`)
- Texture satellite earth-blue-marble.jpg (self-hosted dans `public/images/globe/`)
- Bump map earth-topology.png (self-hosted, desktop uniquement)
- ZEE France : 18 polygones GeoJSON réels (earcut triangulation), `src/data/eez.json`
- Câbles sous-marins : 708 features Telegeography, `src/data/cables.json` (229KB)
- Routes maritimes : 3 niveaux (major/middle/minor), `src/data/shipping-lanes.json` (53KB)
- Légende interactive, toggle par layer, tooltip hover ZEE
- Zoom 1.3x,5x, auto-rotation 0.08, atmosphère shader
- **Progressive loading** : early exit si hidden (mobile), qualite reduite tablettes (48 seg, pixelRatio 1, pas bump map, pas antialias), WebGL context loss handler
- **Mobile** : Fallback CSS circle + stats (ZEE 11.6M km², 708 câbles, 2ème ZEE mondiale). Sur la homepage, le globe fallback apparaît sous le hero content (position relative, hauteur auto avec padding). Cercle `flex-shrink: 0` pour éviter le squish.

### Matrice (`Matrice.astro`)
- Réseau 3D organique : sphères = engagements, lignes = connexions, particules voyageuses
- Labels positionnés à droite des sphères (calcul screen-space du rayon)
- Panneau détail s'ouvre automatiquement au hover (pas au clic)
- Axes de couleur : Technologique (#2A55B3), Environnementale (#00BF63), Socioculturelle (#B32A55)
- **Sphères lumineuses** : baseOpacity 0.55, emissiveIntensity 0.5, core opacity 0.9, ambient light 0.6, directional light 0.8
- **Lazy loading** : IntersectionObserver (below fold), early exit mobile, qualite reduite, context loss handler
- **UX** : Curseur `grab`/`grabbing`, hint animé "Cliquer-glisser pour explorer" qui disparaît à la première interaction
- **Mobile** : Fallback liste 3 axes (pas de Three.js), texte hero avec z-index pour éviter le chevauchement

## Visualisations iframe

### Carte marine parcours (`viz/carte.html`)
- Canvas 2D scroll-driven, scrollbar masquée
- **Background** : `#1A1A2E` (= `--noir-doux`, unifié avec le hero de a-propos)
- **Scroll piloté par le parent** : la page a-propos envoie `postMessage({ type: 'setProgress', progress })` à l'iframe. L'iframe écoute et utilise `externalProgress` au lieu de son propre scroll interne. Section parent = 800vh sticky.
- **Titre** : `top: 80px` pour passer sous la navbar du parent
- **Mobile** : phase-indicator compact (right 12px), compass réduit, tooltip 220px max, watermark masqué, labels réduits (8px au lieu de 10px), espacement labels réduit (11px au lieu de 14px) pour éviter les chevauchements

### Media-viz timeline (`viz/mediaviz.html`)
- Canvas 2D scroll-driven, scrollbar masquée, indicateur scroll animé
- Timeline : 01/05/2022, 09/03/2026, 34 articles presse avec titres réels
- Popup affiche outlet (ex: "Jeune Marine") au lieu du type, avec lien vers l'article
- Couleurs par sujet : rose (culture/traditions/métier), vert (transition/biosphère), bleu (tech/dev perso)

## Pages (routes : /fr/ et /en/)

### Homepage (`/fr/`, `/en/`)
- Hero plein écran : titre "Océanocratie" (FR) / "Oceanocracy" (EN), baseline "Une nation libre regarde la mer." (non-italic, Poppins 300)
- Globe en arrière-plan (desktop), fallback circle+stats en dessous du content (mobile), overlay léger, dezoom au scroll (rAF-throttled)
- Bouton "Explorer la carte" → mode plein écran avec légende + stats (Escape pour fermer), masqué mobile
- Nav : texte blanc par défaut, bascule noir au scroll (`nav--scrolled`)
- Citation Tabarly : "La mer, c'est ce que les Français ont dans le dos quand ils regardent la plage" + écho Colomban
- Le MERitoire français : grille 8 cartes (ZEE, 37 frontières, 4 océans, 5 continents, 595 Md€ exports, 50+ câbles, 45 GW éolien, ADN culture), concept TERRitoire vs MERitoire, lien vers globe ZEE-only
- "Tout passe par la mer" : diagnostic positif, 97% données mondiales câbles, 80% commerce maritime, EMR potentiel, 25 000 molécules marines, layout 2 colonnes (texte + 4 facts)
- Manifeste Océanocratie/Oceanocracy : "Une nation libre regarde la mer", 3 piliers (curiosité/humilité/fraternité), distinction thalassocratie vs océanocratie
- Triple évolution : "Deux transitions, une révolution", techno (transition digitale post-web), écolo (décarbonation + EMR + 9 limites planétaires), socio (révolution socioculturelle + valeurs)
- Engagements : "3 axes d'engagement. Un cap unique", Matrice 3D
- Sections : Hero → Tabarly → Divider → MERitoire → Divider → Tout passe par la mer → Divider → Manifeste → Divider → Triple évolution → Matrice → Logos → Témoignages → CTA Social → Océanocratie livre

### A propos (`/a-propos`, `/about`)
- Hero sombre sans scroll-hint (la carte a le sien)
- Carte marine : section 800vh avec iframe sticky 100vh, mask-image fade en haut (12%)
- Scroll parent contrôle l'animation de la carte via postMessage (rAF-throttled)
- Sections : Moment fondateur → Divider → Vision → Valeurs → Colomban → Bibliographie
- **Bibliographie** : 23 ouvrages (8 visibles, 15 en "Voir plus"), dont N'aie pas peur (Argenti, foi orthodoxe), Le Pouvoir du moment présent (Tolle)

### Engagements (`/engagements`)
- Hero sombre avec "Des engagements multiples avec un cap unique" + "triple transformation maritime"
- Matrice 3D en header (55vh, mask-image top/bottom fade), fallback mobile sans chevauchement
- Grille 3→2→1 colonnes (responsive) : GASPE, VAIATA Dynamics, Opsealog, Fondation ENSM, ENSM, FNMM, HYDROS Alumni, Propeller Club, Apéritifs de la Mer, Académie de Marine, COESPC
- Tuile "Et plus à venir..." (dashed, cachée mobile)
- **Liens externes** : gaspe.fr, vaiata-dynamics.com/fr/, opsealog.com, supmaritime.fr, meritemaritime-fnmm.com, hydros-alumni.org, propellerclub.us, aperitifsdelamer.com, academiedemarine.fr, coespc.org

### Contact (`/contact`)
- Sous-titre : "La meilleure façon de contacter Colomban : rejoignez-le sur les réseaux sociaux et envoyez-lui un message directement."
- Liens : LinkedIn (~16 000 abonnés), Instagram (@colombanatsea)
- **3e personne** : Tout le site parle de Colomban à la 3e personne du singulier (pas de "je", "me", "mon")

### Medias (`/medias`, `/media`)
- Media-viz constellation : Canvas 2D scroll-driven, 3 rangées (tech/enviro/socio), filtres
- Kit media : 3 cartes téléchargement (bio .txt, chiffres-clés .txt, photos HD mailto)

### Prises de parole (`/prises-de-parole`, `/speaking`)
- Conférences & interventions (tableau chronologique, liens externes vers euromaritime.fr, lemarin.ouest-france.fr, nabu.de, raceforwater.org)
- Podcasts (Maritime with a French Accent, lien Spotify épisode)
- Séries YouTube : Hissez Mot(s) ! (playlist), Marine Marchande 101 (playlist)

### Sources & données (`/sources`)
- Page de transparence référençant toutes les sources des chiffres utilisés sur le site
- Tableau des 37 États et territoires voisins maritimes de la France (30 souverains + 7 territoires)
- Tableaux : espace maritime (5 continents, 4 océans avec détail), présence par océan, présence par continent, économie maritime, télécoms sous-marines, câbles sous-marins (25 câbles avec points d'atterrissage), EMR, recherche, données du globe 3D
- Lien dans le footer (colonne "Liens")
- Sources : SHOM, VLIZ, Douanes françaises, Cluster Maritime, PPE3, France Renouvelables, ITU, TeleGeography

### Carte de carrière maritime (`/carte-carriere`, `/career-map`)
- Page enveloppe (`fr/carte-carriere.astro`, `en/career-map.astro`) : nav (navLight), iframe plein écran sous la navbar pointant `public/voyages/index.html?lang=fr|en`.
- **App autonome client-side** sous `public/voyages/` (outil interactif public, 100% navigateur, aucun backend, aucune donnée ne quitte le poste). Mini-app D3/SVG : reconstitue et imprime une carrière maritime depuis un relevé (6 thèmes, 5 projections, 7 langues, export SVG/PNG/print).
- **Portage des fonctions backend** (l'app de dev `voyages-app/` a un Flask) vers le navigateur : `lib/resolve.js` (résolution de ports, port de `ports.py`), `lib/enrich.js` (legs + temps de mer, port de `server.py enrich`), `lib/router.js` (searoute-js + repli grand-cercle), `lib/ingest.js` (parse relevé PDF/Excel/CSV/JSON, port de `parse_releve.py`).
- **Vendor self-hosté** (`public/voyages/vendor/`, CSP `script-src 'self'`) : d3, topojson-client, d3-geo-projection (eager) ; searoute.bundle.js, pdf.js, SheetJS (lazy, chargés au 1er routage/dépôt). Voir `vendor/PROVENANCE.md`.
- **PDF parsé dans le thread principal** (pas de Web Worker, `isEvalSupported:false`) : robuste à une CSP `worker-src 'none'` / sans `'unsafe-eval'`. pdf.js détecte `globalThis.pdfjsWorker.WorkerMessageHandler`.
- **Démarrage sur l'exemple** (par défaut, à chaque nouvelle visite) : `voyage-colomban.json` (relevé de Colomban pré-enrichi, legs + temps de mer bakés) est chargé d'emblée, sans routeur. searoute ne se charge qu'à la 1re édition. Le bouton « Charger l'exemple » le recharge à la demande ; « Réinitialiser » revient au vierge (l'exemple revient au prochain chargement). **Défauts de l'affiche** : titre = clé i18n `default_title` (« Mes embarquements » / « My sea service », repli localisé si le titre est vide, le nom du marin reste un repli secondaire dans `render.js`) ; style = `nautical` (Carte marine) + projection `natural` (Natural Earth), soit le 2e preset.
- **Persistance = session de navigation** (`sessionStorage`, pas `localStorage`) : un rafraîchissement conserve le travail en cours, mais une nouvelle visite repart de l'exemple (page-vitrine publique). Au boot, l'ancienne clé `localStorage` `voyages-app:voyage` est purgée (migration ; évite qu'un relevé importé jadis fige l'affichage). Avant 2026-06-25, la persistance `localStorage` figeait la 1re saisie comme défaut.
- **Bandeau « relevé sans escales »** (`#stagenote`, `updateStageNote`) : affiché quand des navires sont importés sans aucune escale (0 route traçable), masqué sinon. Piège CSS résolu 2026-06-25 : `.stage-note{display:flex}` écrasait l'attribut `hidden` (UA `[hidden]{display:none}` moins spécifique qu'un sélecteur de classe) → le bandeau ne disparaissait jamais (ni au chargement de l'exemple, ni via le bouton ×). Fix = règle `.stage-note[hidden]{display:none}` + nettoyage du DOM (`innerHTML=""`) au masquage.
- **Mini-tutoriel 1re visite** (`lib/tutorial.js`, 4 étapes, skippable, `localStorage`), réouvrable via le bouton aide (?).
- Données : `data/ports.json` (3962), `data/aliases.json`, `data/ports_supplement.json`, `data/land-50m.json`.
- Lien dans le footer (colonne "Navigation"). `noindex` sur l'app iframe, page indexée + sitemap + hreflang.
- Source canonique publiée = `public/voyages/`. `voyages-app/` (hors repo) reste l'app de dev/référence ; tests dans `voyages-app/test/` (`parity.mjs` vs backend Python, `e2e_carte.mjs` Playwright, `bake_colomban.cjs`).

### Page 404
- `public/404.html` (GitHub Pages custom 404)
- Thème maritime : rose des vents SVG, particules flottantes
- Titre "Terre inconnue" + liens bilingues (retour au port FR/EN)
- Coordonnées Brest (48°23'N, 004°29'W)

## Performance
- **Scroll handlers** : tous throttlés via `requestAnimationFrame` (hero dezoom, carte progress)
- **3D mobile** : Globe et Matrice ne chargent pas Three.js sur mobile (early exit si `offsetWidth === 0`)
- **Fonts** : Google Fonts non-bloquantes (`media="print" onload="this.media='all'"` + `display=swap`)
- **Lazy loading** : Matrice via IntersectionObserver, Globe preloaded (hero)
- **Bundles** : Three.js ~78KB gzip (Globe), OrbitControls ~121KB gzip, Matrice ~4KB gzip
- **Textures self-hosted** : earth-blue-marble.jpg (335KB) + earth-topology.png (293KB) dans `public/images/globe/`

## SEO
- Canonical URLs : `<link rel="canonical">`
- Sitemap XML : `site/public/sitemap.xml` (20 URLs FR+EN, changefreq + priority, xhtml:link hreflang)
- Robots.txt : `site/public/robots.txt`
- JSON-LD Person : 8 affiliations avec URLs, knowsAbout étendu (11 termes), alumniOf ENSM, sameAs (LinkedIn, Instagram, YouTube, TikTok)
- Open Graph complet : og:url, og:site_name, og:image, twitter:card + twitter:image
- Meta descriptions sur toutes les pages
- **LLM optimization** : `public/llms.txt`, fichier structuré décrivant le site, les concepts clés, les engagements et les pages pour les LLM

## Sécurité
- **CSP** : `Content-Security-Policy` via meta http-equiv, `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `font-src https://fonts.gstatic.com`, `img-src 'self' data:`, `frame-src 'self'`, `object-src 'none'`
- **Permissions-Policy** : `geolocation=(), microphone=(), camera=(), payment=(), usb=()`
- `X-Content-Type-Options: nosniff` (meta)
- `referrer: strict-origin-when-cross-origin` (meta)
- `rel="noopener noreferrer"` sur tous les liens externes
- **postMessage** : carte.html valide `e.origin !== window.location.origin` avant d'accepter les messages
- Fonts non-bloquantes (`media="print" onload`)
- **innerHTML** : utilisé uniquement avec des données statiques hardcodées (waypoints carte), jamais avec du user input
- **Textures self-hosted** : plus de dépendance CDN externe (unpkg.com supprimé)
- **Footer** : lien "Protégé par VAIATA Cyber" (vaiata-dynamics.com/fr/cyber/)

### Vecteurs potentiels à surveiller
- **Google Fonts** : chargé en async non-bloquant. Si Google Fonts tombe, les polices système prennent le relais (`display=swap`). Pas de SRI possible sur les fonts dynamiques.
- **Pas de formulaire côté colombanatsea.com** : aucun champ de saisie utilisateur, donc pas de XSS via input, pas de CSRF, pas de SQL injection.
- **oceanocratie.fr, waitlist** : formulaire email stocké en localStorage uniquement (pas de backend). L'input est traité par `FormData` sans `innerHTML`, pas de XSS. CSP bloque `frame-src 'none'` et `object-src 'none'` (anti-clickjacking, anti-plugin).
- **GitHub Pages** : HTTPS forcé, pas de serveur custom, pas de backend. La surface d'attaque est minimale (SSG pur).
- **unsafe-inline** : nécessaire pour les scripts inline Astro/standalone et les styles scoped. Acceptable car aucun user input n'est rendu dans le DOM.

## Traduction EN
- Le concept s'écrit "Oceanocracy" en anglais (pas "Océanocratie" ou "Oceanocratie")
- Les classes CSS restent `.oceanocratie__*` (noms internes)
- L'URL `oceanocratie.fr` reste inchangée (nom de domaine)

## Sites associés
- **oceanocratie.fr** : Landing page standalone immersive (`oceanocratie.fr/index.html`)
  - **3D Ocean** : Raymarched ocean plein écran (fragment shader pur WebGL, basé sur "Seascape" de TDM/Shadertoy)
    - Heightmap tracing (binary search), pas de mesh, ocean infini
    - `sea_octave()` custom : crêtes tranchantes, creux réalistes (ni sinus ni Perlin)
    - 5 octaves avec rotation matricielle anti-aliasing (`octave_m = mat2(1.6, 1.2, -1.2, 1.6)`)
    - Vagues unidirectionnelles, vitesse réduite (`SEA_SPEED 0.35`)
    - Fresnel cubique, SSS (subsurface scattering), double spéculaire (moon path + halo)
    - Mousse procédurale sur les crêtes, grain film, tone mapping ACES, vignette
  - **Ciel nocturne** : étoiles procédurales en coordonnées sphériques (3 couches, scintillement animé), lune avec disque + triple halo atmosphérique
  - **Gouttelettes** : Canvas 2D overlay, gouttes qui tombent du haut de l'écran jusqu'en bas avec traînées humides, max 8 simultanées, spawn stochastique (spawn zone 0-30% haut écran)
  - **Spray** : particules CSS-only (30 particules, animation keyframe)
  - **Mobile** : fallback CSS avec vagues animées (pas de WebGL, pas de droplets, pas de spray), layout responsive
  - **Waitlist** : formulaire email avec support Google Sheets (via Apps Script) + fallback localStorage
  - **Sections** : Hero + livre flottant → Stats (97%, 80%, EMR) → Tout passe par la mer (595 Md€, 50+, 45 GW) → Citation Tabarly → 3 transformations → 3 axes → Carte archipel France → Témoignages → Auteur → Footer
  - **OG** : titre "Oceanocratie, Colomban", og-image.png (raster 1200x630)
  - **Sécurité** : CSP strict (default-src 'self', connect-src 'self' + Google Script, frame-src 'none', object-src 'none'), Permissions-Policy (geolocation, microphone, camera, payment, usb, magnetometer, gyroscope, accelerometer disabled), X-Content-Type-Options nosniff, referrer strict-origin-when-cross-origin, rel="noopener noreferrer" sur tous les liens externes
  - **SEO** : robots.txt, sitemap.xml, meta description, OG complet, Twitter card
  - **Performance** : DPR cap 1.5 (shader) / 2 (droplets), 3 octaves géométrie / 5 fragment, aucune dépendance externe (pas de Three.js), fonts Google non-bloquantes
  - **Zero dépendance** : HTML standalone, aucun CDN, aucun framework, WebGL natif + Canvas 2D
- **aperitifsdelamer.com** : Lien dans le footer
- **vaiata-dynamics.com/fr/cyber/** : Protection cyber, lien footer

## Performance, Globe Lazy-Load (branche `perf/globe-lazy-load`)

### Problème
Le globe Three.js bloquait le thread principal au chargement : textures lourdes (628 KB),
init WebGL synchrone → PageSpeed timeout, LCP dégradé.

### Modifications
1. **Globe.astro, CSS** : placeholder `::before` radial-gradient `#080b14`, canvas `opacity:0`
   avec transition 0.8s, classe `.globe-ready` pour fade-in.
2. **Globe.astro, Script** : tout le bloc `else {}` wrappé dans `async initGlobe()`,
   déclenché via **interaction gate** (scroll/click/mousemove/touchstart/keydown) avec
   fallback 8s. Lighthouse ne voit jamais le ~1 MB de Three.js + GeoJSON.
   `.globe-ready` ajouté après chargement des 2 textures (ou timeout 6s).
3. **Textures → WebP** : `earth-blue-marble.webp` (158 KB, −53%), `earth-topology.webp` (35 KB, −88%).
4. **Testimonial** : `luna-menendez.jpg` redimensionné 800×800 → 160×160 (7.5 KB, −92%).

### Économie totale : ~526 KB

## Contact
- Email : hello@colombanatsea.com
- Tel : 06 42 12 99 82
- Site : colombanatsea.com
