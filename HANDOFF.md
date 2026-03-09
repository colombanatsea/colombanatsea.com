# HANDOFF — Session 5 mars 2026

## Actions realisees cette session

### 1. Kit media telechargeable (CDC #2)
- Refactorise la section kit media dans `site/src/pages/fr/medias.astro` : 4 cartes avec icones SVG
  - Bio complete (.txt) — fichier existant
  - Chiffres cles (.txt) — **nouveau** `site/public/kit-media/chiffres-cles.txt`
  - Fiche contact (.vcf) — **nouveau** `site/public/kit-media/colomban.vcf`
  - Photos HD (lien mailto)

### 2. Landing page oceanocratie.fr (CDC #6)
- **Nouveau** `oceanocratie.fr/index.html` — page standalone HTML
  - Hero avec visuel livre, sous-titre, formulaire waitlist email
  - Section 3 axes (technologique, environnementale, socioculturelle)
  - Section auteur avec lien retour colombanatsea.com
  - Capture email localStorage (placeholder en attendant backend)
  - Detection doublons, responsive, non-blocking fonts
  - Meta SEO, security headers, canonical, noreferrer
- Copie dans `/home/user/oceanocratie.fr/` (repo separe a initialiser)

### 3. Audit et optimisations (performance, SEO, cyber, mobile)

#### SEO
- Ajout `<link rel="canonical">` dans BaseLayout
- Ajout `<link rel="sitemap">` dans BaseLayout
- Enrichissement JSON-LD Person (alternateName, jobTitle, affiliations, knowsAbout)
- Ajout `og:url`, `og:site_name`, `twitter:image`
- **Nouveau** `site/public/sitemap.xml` avec changefreq + priority + hreflang xhtml
- **Nouveau** `site/public/robots.txt` avec lien sitemap
- OG image mise a jour : reference og-image.jpg (raster) au lieu de .svg

#### Securite
- Ajout `<meta http-equiv="X-Content-Type-Options" content="nosniff">`
- Ajout `<meta name="referrer" content="strict-origin-when-cross-origin">`
- Remplacement `rel="noopener"` par `rel="noopener noreferrer"` sur TOUS les liens externes

#### Performance
- Fonts non-bloquantes : `media="print" onload="this.media='all'"` + `<noscript>` fallback

#### Mobile
- Fix couleur liens nav mobile sur pages interieures (restaient blancs → maintenant gris/noir)
- Fermeture automatique du menu mobile au clic sur un lien

### 4. Optimisation 3D progressive (CDC #5)
- **Globe.astro** : Early exit si container hidden (mobile), qualite reduite tablettes (48 segments, pixelRatio 1, pas de bump map, pas d'antialias), context loss handler
- **Matrice.astro** : IntersectionObserver lazy loading (below fold), early exit mobile, qualite reduite, context loss handler
- CSS `display: none` sans `!important` pour permettre override JS futur

### 5. Version bilingue FR/EN (CDC #1)
- **Astro i18n** configure dans `astro.config.mjs` : `prefixDefaultLocale: true`, locales `['fr', 'en']`
- **Systeme de traductions** : `site/src/i18n/translations.ts` (UI strings) + `site/src/i18n/utils.ts` (helpers)
- **Structure routes** : `/fr/` (defaut) + `/en/` avec hreflang bidirectionnel
- **BaseLayout** : hreflang tags, lang switcher dans la nav (bouton FR/EN)
- **8 pages FR** deplacees vers `site/src/pages/fr/`
- **7 pages EN** creees dans `site/src/pages/en/` :
  - index, about, engagements, speaking, media, contact, legal-notice, privacy-policy
- **Redirect racine** `/` → `/fr/`
- **Sitemap** mis a jour avec xhtml:link hreflang pour toutes les pages FR+EN
- **Nav + footer** : liens localises via `getLocalizedPath()`
- Build : 16 pages totales (1 redirect + 8 FR + 7 EN)

## Etat d'avancement CDC post-session

| # | Element | Statut |
|---|---------|--------|
| 1 | Version anglaise (EN) | **FAIT** — structure i18n + 7 pages EN |
| 2 | Kit media telechargeable | **FAIT** |
| 3 | Bandeau teaser Oceanocratie | Existait deja (homepage) |
| 4 | SEO complet | **FAIT** (schema, sitemap, meta, hreflang) |
| 5 | Fallbacks mobile / 3D optimise | **FAIT** — progressive loading |
| 6 | Landing page oceanocratie.fr | **FAIT** |
| 7 | Series YouTube integrees | Existait deja (prises-de-parole) |
| 8 | Bibliographie | Existait deja (a-propos) |
| 9 | Donnees reelles media-viz | **A FAIRE** — Besoin export Notion |
| 10 | Citations rotatives footer | Existait deja |
| 11 | Analytics privacy-friendly | **A FAIRE** — Decision Plausible vs Umami |
| 12 | Politique de confidentialite | Existait deja |
| 13 | Lien aperitifsdelamer.com | Existait deja (footer) |
| 14 | Design system noeud complet | **A FAIRE** — Concepts a proposer |

## Fichiers modifies
- `site/astro.config.mjs` — i18n config
- `site/src/layouts/BaseLayout.astro` — SEO, securite, fonts, mobile nav, i18n, hreflang, lang switcher
- `site/src/components/Globe.astro` — progressive loading, quality settings, context loss
- `site/src/components/Matrice.astro` — lazy loading IO, progressive loading, context loss
- `site/public/sitemap.xml` — hreflang xhtml, FR+EN URLs

## Fichiers crees
- `site/src/i18n/translations.ts` — UI strings FR/EN
- `site/src/i18n/utils.ts` — i18n helpers
- `site/src/pages/fr/` — 8 pages FR (deplacees depuis racine)
- `site/src/pages/en/` — 7 pages EN
- `site/src/pages/index.astro` — redirect vers /fr/
- `site/public/robots.txt`
- `site/public/kit-media/chiffres-cles.txt`
- `site/public/kit-media/colomban.vcf`
- `oceanocratie.fr/index.html`

### 6. Ajustements visuels UX

#### Scrollbars cachees
- `viz/carte.html` et `viz/mediaviz.html` : ajout `scrollbar-width: none` + `::-webkit-scrollbar { display: none }` — scrollbar invisible mais scroll fonctionnel

#### A propos — Transition hero/carte
- Suppression du bloc "Le parcours / D'un sillage..." redondant
- Hero sombre coule directement dans la carte marine (pas de rupture)
- Ajout indicateur de scroll anime (meme pattern que la homepage)
- `.carte-section` background match `#0a0e1a` (fond de carte.html)
- Mobile : hauteur carte reduite a 70vh

#### Engagements — Matrice
- Hauteur augmentee a 55vh, margin-top reduit
- Masque CSS gradient (fade top/bottom) pour transition uniforme hero/matrice/contenu

#### Medias — Timeline
- Ajout indicateur de scroll anime en bas de la visualisation mediaviz
- SVG chevron + texte "Scrollez dans la visualisation" avec animation bounce/fade

---

# HANDOFF — Session 8 mars 2026

## Actions realisees cette session

### 1. Refonte complete ocean 3D oceanocratie.fr
- **Remplacement Three.js par raymarching WebGL pur** — zero dependance externe
  - Technique basee sur "Seascape" de TDM (Shadertoy, 840K+ vues)
  - Heightmap tracing (binary search), ocean infini sans mesh
  - `sea_octave()` custom : cretes tranchantes realistes
  - 5 octaves avec rotation matricielle, Fresnel, SSS, double speculaire
  - Tone mapping ACES, vignette, grain film

### 2. Ajustements visuels demandes
- **Vagues unidirectionnelles** : les deux composantes d'onde vont dans le meme sens (+x, +z) au lieu de directions opposees
- **Vitesse reduite** : `SEA_SPEED` de 0.8 a 0.35 pour un mouvement plus lent et cinematique
- **Etoiles visibles et scintillantes** : coordonnees spheriques stables (3 couches : brillantes, moyennes avec twinkle, faibles avec shimmer), positions fixes dans le ciel
- **Lune amelioree** : disque plus lumineux, triple halo atmospherique (tight + medium + wide)

### 3. Gouttelettes d'eau sur l'ecran
- Canvas 2D overlay avec gouttes proceduelles (max 6 simultanees)
- Effet de refraction (gradient radial, highlight blanc, anneau surface)
- Physique : gravite, wobble sinusoidal, trainee
- Spawn stochastique (toutes les 120-320 frames)
- Desactive sur mobile (performance)

### 4. Securite renforcee oceanocratie.fr
- **CSP** : `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `font-src https://fonts.gstatic.com`, `img-src 'self' data:`, `connect-src 'self'`, `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`
- **Permissions-Policy** : geolocation, microphone, camera, payment, usb, magnetometer, gyroscope, accelerometer disabled
- **X-Content-Type-Options** : nosniff
- **Referrer** : strict-origin-when-cross-origin

### 5. Performance et compatibilite mobile
- DPR cap 1.5 (shader WebGL) / 2 (droplets canvas)
- 3 octaves geometrie / 5 fragment (shader LOD)
- Mobile : fallback CSS (pas de WebGL, pas de droplets, pas de spray)
- Aucun CDN, aucun framework — HTML standalone ~1400 lignes

### 6. Documentation
- CLAUDE.md mis a jour : specs oceanocratie.fr (raymarching, droplets, securite, perf)
- HANDOFF.md mis a jour avec cette session

## Fichiers modifies
- `oceanocratie.fr/index.html` — refonte complete ocean + droplets + securite

## Action requise
- **Sauvegarder la photo OG** en tant que `site/public/og-image.jpg` (1200x630px recommande, ou crop de la photo portrait fournie)
- **Initialiser le repo** `oceanocratie.fr` sur GitHub et y pousser le `index.html`

---

# HANDOFF — Session 9 mars 2026

## Actions realisees cette session

### 1. Echange KPI entre sections (colombanatsea.com + oceanocratie.fr)
- **Section "MERitoire"** (archipel cards) : 97%/80%/EMR remplaces par 595 Md€/50+/45 GW (chiffres France)
- **Section "Tout passe par la mer"** (seamer facts) : 595 Md€/50+/45 GW remplaces par 97%/80%/EMR (chiffres mondiaux)
- Meme echange sur les pages EN correspondantes
- Meme echange sur oceanocratie.fr (stats ↔ sea-pillars)

### 2. Matrice 3D
- **Suppression** de la section "Matrice 3D" avec cube CSS sur oceanocratie.fr (section et styles CSS)
- **Mise a jour** des 3 noeuds "Aventure entrepreneuriale" dans Matrice.astro : description changee de "secteur maritime" a "secteurs du maritime, de la sante et de l'achat ethique"

### 3. Carte du sillage au rayonnement — hover
- Fix du hover sur les waypoints : le tooltip apparait des qu'un point est visible, et non plus seulement quand le trait l'atteint
- `vis` calcule avec `Math.floor(...) + 1` au lieu de `Math.floor(...)` seul

### 4. Open Graph / Preview social
- **colombanatsea.com** : titre "Colomban — Oceanocratie", description detaillant la vision maritime
- **oceanocratie.fr** : titre "Oceanocratie — Colomban", description "La France collectionne les atouts maritimes mais tourne le dos a la mer..."
- **Conversion OG image** : oceanocratie.fr og-image.svg converti en og-image.png (meilleure compatibilite reseaux sociaux)
- Mise a jour og:image, twitter:image et JSON-LD pour pointer vers og-image.png

### 5. Gouttelettes oceanocratie.fr
- Les gouttes tombent desormais jusqu'en bas de l'ecran et disparaissent au-dela
- Suppression de l'arret aleatoire par tension de surface (plus de `stopped` state)
- Zone de spawn repositionnee en haut de l'ecran (0-30% au lieu de 0-50%)

### 6. Page engagements EN — refonte complete
- Structure HTML alignee sur la version FR (meme layout hero + Matrice + grille cartes)
- Ajout des axes (Technological, Environmental, Sociocultural) avec tags colores
- Ajout liens externes sur les noms d'engagement
- Card "And more to come..." avec meme structure que la version FR

### 7. Verifications
- **Doubles points** : aucun double point trouve dans les titres des deux sites
- **Traductions EN** : verifiees et corrigees (engagements page refaite)
- **SEO** : meta descriptions, JSON-LD, sitemap, robots.txt, canonical URLs, hreflang — tout OK
- **Sources** : pages sources bien formatees et completes sur les deux sites
- **Coherence des chiffres** : 97%, 80%, 595 Md€, 50+, 45 GW, 11M km², 37 frontières — coherents entre les deux sites

## Fichiers modifies
- `colombanatsea.com/site/src/pages/fr/index.astro` — swap KPI, OG meta
- `colombanatsea.com/site/src/pages/en/index.astro` — swap KPI, OG meta
- `colombanatsea.com/site/src/pages/en/engagements.astro` — refonte complete
- `colombanatsea.com/site/src/components/Matrice.astro` — desc Aventure entrepreneuriale
- `colombanatsea.com/site/src/components/CarteTimeline.astro` — fix hover waypoints
- `oceanocratie.fr/index.html` — swap KPI, suppression Matrice 3D, OG meta, droplets fix
- `oceanocratie.fr/og-image.png` — conversion depuis SVG

## Fichiers crees
- `oceanocratie.fr/og-image.png` — OG image raster pour compatibilite reseaux sociaux
