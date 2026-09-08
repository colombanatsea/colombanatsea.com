# CHANTIER, publications colombanatsea.com alimentées par Palantíri

> Backlog. Établi le 22/07/2026 (Narvi, mandat Colomban). Statut global : **NON
> démarré**, en attente de la connexion colombanatsea.com ↔ Palantíri.
> Rien n'est déployé. Ce document est la feuille de route, pas une implémentation.

## 1. Objectif

Alimenter en continu, et automatiquement, les publications de Colomban sur
colombanatsea.com depuis **Palantíri** (table `positions`), qui est la source de
vérité, elle-même synchronisée depuis la base Notion « Publications ».

Deux surfaces du site consomment ces données :

1. **Bloc « Sur LinkedIn »** (page d'accueil FR + EN) : cartes des dernières
   publications, avec image et lien vers le post LinkedIn.
2. **Constellation « Timeline Médias »** (`/fr/medias`, `/en/media`) : chaque
   publication devient une étoile datée, filtrable par axe et par canal.

Principe posé par Colomban : le **lien** vers LinkedIn vient de son profil public
(l'URL du post) ; le **contenu** vient de ses positions (aujourd'hui = ses
publications Notion, demain = la table `positions` de Palantíri). Objectif :
récupérer « les publications du jour » en permanence, sans intervention manuelle.

## 2. État des lieux (22/07/2026)

| Élément | État |
|---|---|
| Palantíri `positions` (table) | Existe. Champs : `title, content, canaux, statut, date, scheduledAt, sujet, thematique, typePub, reach, url, publishedUrls {linkedin:…}, postIds, notionId, createdAt, updatedAt`. Sync Notion via `notionId`. |
| Notion « Publications » | Source amont. DB `6ad3d1bd…`, data source `collection://a3f6c9e4…`. Texte + image (attachment S3 signé) + `userDefined:URL` (lien LinkedIn) + `Reach` + `Canal` + `Statut`. |
| Bloc LinkedIn du site | Composant `site/src/components/LinkedInFeed.astro` + données `site/src/data/linkedin.json`, **écrits en local, non commités, non poussés** (voir §7). Rendu validé (build vert, aperçu artifact). Aujourd'hui alimenté par un JSON statique curé. |
| Constellation Médias | `site/public/viz/mediaviz.html`, tableau JS **codé en dur** (~ligne 408+), items `{title, axis:'techno'|'enviro'|'socio', channel:'linkedin'|'instagram'|'youtube'|'presse'|'conference', type, date:new Date(...), reach, url, starMedia, outlet?}`. Déjà multi-canal. Beaucoup d'`url:null` et `reach` approximés. |
| Elfsight | Widget tiers actuellement en prod. Son retrait est préparé en local (non poussé). |

## 3. Architecture cible

```
Notion « Publications »
        │  (sync existante, notionId)
        ▼
Palantíri  positions  ──────────────► SOURCE DE VÉRITÉ
   (app.monnier.family, API Bearer)
        │
        │  fetch périodique (GitHub Action cron)
        ▼
scripts/sync-publications.mjs  (dans le repo colombanatsea.com)
        │        │
        │        └── télécharge les images (Notion S3 signé, 5 min) → public/linkedin/
        ▼
  génère 2 artefacts de données :
   1. site/src/data/linkedin.json          → bloc « Sur LinkedIn »
   2. site/public/viz/mediaviz-data.json   → constellation Timeline Médias
        │
        ▼
  build Astro + déploiement GitHub Pages (auto)
```

- **Cadence** : GitHub Action programmée (ex. quotidienne, ou sur webhook). Elle
  interroge Palantíri pour les positions `statut = Posted` publiées récemment,
  régénère les deux JSON, télécharge les images manquantes, commit + build.
- **Source unique** : le site ne parle qu'à Palantíri. Notion reste en amont de
  Palantíri, le site ne tape jamais Notion directement en prod (le fetch Notion
  éventuel reste un détail d'implémentation de la sync Palantíri↔Notion).

## 4. Mapping des données

### 4.1 Palantíri `positions` → `linkedin.json` (bloc LinkedIn)

| Cible `linkedin.json` | Source `positions` |
|---|---|
| `id` | `id` (ou slug dérivé de `notionId`) |
| `url` | `publishedUrls.linkedin` (repli `url`) |
| `excerpt` | `content` tronqué (hook, 2-3 phrases) |
| `image` | image téléchargée → `/linkedin/<id>.jpg` (voir §6) |
| `alt` | dérivé du `title` |
| `postedAt` | `date` |
| `order` | tri par `date` desc (ou `reach` desc) |
| `published` | `statut == 'Posted'` ET canal contient `LinkedIn` |

Filtre : `canaux` contient exactement `"LinkedIn"` (profil perso), pas
`LinkedIn Vaiata`/`GASPE`/`HYDROS`/`COESPC`. Ne retenir que les posts **à image**
pour les cartes (les vidéos → carte de repli de marque, voir §6).

### 4.2 Palantíri `positions` → `mediaviz-data.json` (constellation)

| Cible item constellation | Source `positions` |
|---|---|
| `title` | `title` |
| `date` | `date` → `new Date(Y,M,D)` |
| `channel` | dérivé de `canaux` : `LinkedIn`→`linkedin`, `Instagram`→`instagram`, `YouTube`→`youtube`, `Marine & Océans`/`Jeune Marine`/`Le Monde`/`Les Échos`/`Conflits`→`presse` |
| `axis` | mappé depuis `thematique`/`sujet` (voir table ci-dessous) |
| `type` | `typePub` |
| `reach` | `reach` |
| `url` | `publishedUrls.linkedin` (repli `url`, sinon `null`) |
| `starMedia` | `reach` au-dessus d'un seuil, ou presse |
| `outlet` | si canal presse |

Mapping axe (à figer, brouillon) :

| `thematique` / `sujet` | `axis` |
|---|---|
| Environnement (marin), Climat, Pollution, Biosphère Lithosphère, Transition Impact | `enviro` |
| Maritime (industrie), Technologie | `techno` |
| Personnel / entrepreneuriat, Métier, Culture Traditions Histoire, Développement personel, Point de vue, Mixité | `socio` |
| Santé, Géopolitique, Actes illicites, Juridique | à trancher |

## 5. Backlog (lots ordonnés)

### Lot 0 — Décisions préalables (Colomban)
- [ ] Cadence de rafraîchissement (quotidien 6h ? à chaque publication via webhook Palantíri ?).
- [ ] Curation du bloc LinkedIn : automatique (N derniers à image) ou liste validée ?
- [ ] Périmètre constellation : uniquement LinkedIn perso, ou tous canaux (Insta, YouTube, presse) ?
- [ ] Sort du widget Elfsight et des changements locaux non poussés (§7).

### Lot 1 — Connexion Palantíri (P0)
- [ ] Endpoint de lecture des positions publiées (réutiliser `/api/palantiri/query` en lecture seule, ou un endpoint dédié `positions/public`). **Route joyau = Bearer requis** (durcissement 16/07).
- [ ] Clé API en **secret GitHub Actions** (`PALANTIRI_API_KEY`), jamais dans le repo.
- [ ] `scripts/sync-publications.mjs` : query positions `statut=Posted` + `canaux LIKE LinkedIn`, normalise, écrit les deux JSON. Idempotent, log clair.
- [ ] Gestion d'échec : si Palantíri injoignable, garder les JSON précédents (jamais de constellation vide).

### Lot 2 — Bloc LinkedIn dynamique (P1)
- [ ] `LinkedInFeed.astro` lit `linkedin.json` généré (déjà le cas, seul le producteur change).
- [ ] Pipeline image (§6) : télécharger le visuel Notion signé → `public/linkedin/<id>.jpg`, repli carte de marque si vidéo/sans image.
- [ ] Retrait Elfsight + resserrage CSP Cloudflare (déjà spécifié, coordonné avec le déploiement).

### Lot 3 — Constellation alimentée (P1)
- [ ] Découpler les données de `mediaviz.html` : remplacer le tableau codé en dur par un `fetch('mediaviz-data.json')` au chargement de l'iframe.
- [ ] Générer `mediaviz-data.json` depuis `positions` (tous canaux retenus), avec `reach` et `url` réels, mapping axe figé.
- [ ] Conserver les items historiques presse/conférence non présents dans `positions` (merge, pas d'écrasement) OU les basculer dans `positions`.
- [ ] Mettre à jour le compteur « articles presse » / stats de l'en-tête.

### Lot 4 — Automatisation (P2)
- [ ] GitHub Action cron : run `sync-publications.mjs`, commit des JSON + images modifiés, déclenche le build Pages.
- [ ] Garde-fou : diff borné (pas de suppression massive), alerte si 0 position remontée.
- [ ] Optionnel : webhook Palantíri → `repository_dispatch` pour rafraîchir à la publication plutôt qu'en cron.

## 6. Images, point technique

- Les visuels sont des **attachments Notion** exposés par le connecteur en **URL
  S3 signée** (`prod-files-secure.s3…?X-Amz-Expires=300`), valables **5 minutes**.
  Vérifié le 22/07 : téléchargement réussi (`public/linkedin/amarre.jpg`, 720×960).
- Donc le script doit **fetch la page puis télécharger l'image dans la foulée**
  (fenêtre 5 min). Il stocke en local sous `public/linkedin/<id>.jpg`, jamais de
  hotlink S3 (les URL expirent).
- **Vidéos** (beaucoup des tops posts : Sea level rise, pillage chinois, Snap
  Back) : pas d'image fixe. Deux options, à trancher : image de couverture
  extraite, ou **carte de repli de marque** (déjà gérée par `LinkedInFeed.astro`).
- La constellation n'a **pas** besoin d'images (les items sont des étoiles) :
  le pipeline image ne concerne que le bloc LinkedIn.
- Alternative long terme : Palantíri héberge lui-même les médias des positions
  (champ média servi par l'API), le site ne touche plus jamais Notion.

## 7. État des changements locaux non poussés (à arbitrer, Lot 0)

Une première approche (bloc LinkedIn alimenté par un JSON **statique curé**) a été
préparée en local **avant** ce pivot vers Palantíri. Non commitée, non poussée,
sans effet sur la prod. Fichiers concernés :

- `site/src/components/LinkedInFeed.astro` (composant de rendu, **réutilisable
  tel quel** quelle que soit la source de données).
- `site/src/data/linkedin.json` (3 exemples).
- `site/src/pages/{fr,en}/index.astro` (remplacement du div Elfsight).
- `site/src/layouts/BaseLayout.astro` (retrait du script Elfsight).
- `site/src/i18n/translations.ts` (clé `linkedin.cta`).
- `site/LINKEDIN.md`, `site/public/linkedin/amarre.jpg`.

Décision attendue : **garder** ces fichiers comme couche de rendu du chantier
(recommandé, seul le producteur de `linkedin.json` change), ou **revert** pour un
arbre propre en attendant la connexion Palantíri. Le retrait d'Elfsight ne sera de
toute façon poussé qu'au moment du go-live du bloc dynamique.

## 8. Risques et points ouverts

- **Secret Palantíri en CI** : la clé donne accès à toute l'API. Envisager un
  endpoint/clé en lecture seule dédié aux positions publiques, plutôt que la clé
  maîtresse dans GitHub Actions.
- **Données déjà publiques** : ne pousser sur le site que des positions `Posted`
  (jamais `Draft`/`Idée`). Filtre strict côté script + côté endpoint.
- **Cohérence axe** : le mapping thematique→axe doit être figé et testé, sinon la
  constellation se déséquilibre.
- **Vidéos sans image** pour le bloc LinkedIn (voir §6).
- **Historique constellation** : ne pas perdre les items presse/conférence
  existants absents de `positions`.
- **CSP images** : `img-src 'self'` suffit (images auto-hébergées). Ne pas
  réintroduire de domaine LinkedIn/S3 dans la CSP.

## 9. Prochaines étapes

1. Colomban tranche le Lot 0.
2. Décider l'endpoint de lecture des positions + gestion du secret (Lot 1).
3. Écrire `sync-publications.mjs` + pipeline image.
4. Découpler les données de `mediaviz.html` (Lot 3) et générer les deux JSON.
5. Automatiser (Lot 4).

> Voir aussi : `site/LINKEDIN.md` (format de données du bloc LinkedIn),
> `CLAUDE.md` du repo (§ Medias, § MediaViz), spec sécurité Palantíri
> `palantiri/docs/SECURITY.md` (routes joyau, Bearer).
