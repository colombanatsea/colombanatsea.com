# Colomban at Sea — Specifications Techniques

## Stack
- **Framework** : Astro 5.x (SSG) — `site/`
- **3D** : Three.js (npm) + earcut (polygon triangulation)
- **Hébergement** : GitHub Pages (`colombanatsea.github.io/colombanatsea.com/`)
- **Base URL** : `/colombanatsea.com/`
- **i18n** : Astro built-in (`prefixDefaultLocale: true`), locales FR/EN
  - Traductions : `site/src/i18n/translations.ts` (UI strings) + `site/src/i18n/utils.ts`
  - Routes : `/fr/` (defaut), `/en/` — redirect racine `/` → `/fr/`
  - Pages FR : `site/src/pages/fr/` (8 pages)
  - Pages EN : `site/src/pages/en/` (7 pages)
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
| Gris 800 | `#2E2E3A` | — |

### Typographie
| Police | Graisses | Role |
|--------|----------|------|
| **Poppins** | 300, 400, 500, 600, 700 | Titres, nom de marque "Colomban" |
| **Inter** | 300, 400, 500, 600 | Corps de texte, descriptions |
| **JetBrains Mono** | 400, 500 | Monospace : "at sea", labels techniques, URLs |

### Logo — Noeud entrelacé
- SVG 3 layers : ruban bleu complet, ruban vert par-dessus au croisement bas, arc bleu redessiné par-dessus au croisement haut
- Accent diamant vert en haut à droite
- Favicon = noeud SVG (viewBox 0 0 200 200)
- Lockup horizontal : [noeud] | [divider 1.5px] | [Colomban (Poppins 700) + at sea (JetBrains Mono 0.55rem lowercase)]

### Éléments signature
- **Ligne gradient haut** : `linear-gradient(90deg, --bleu, --vert)` — 3px, `border-top` du body
- **Point coloré fin de titre** : `.` vert sur fond sombre, `.` bleu sur fond clair
- **3 fonds** : Noir Doux (#1A1A2E), Blanc (#FAFAFA), Bleu (#2A55B3)

### Indicateurs de scroll
- Pattern reutilise : `.scroll-hint` + `.scroll-hint__line` avec animation `scroll-pulse`
- Utilise sur : homepage hero, a-propos hero, mediaviz timeline
- Mobile : visible, meme style

## Composants 3D

### Globe (`Globe.astro`)
- Texture satellite earth-blue-marble.jpg (unpkg CDN, fallback sombre)
- ZEE France : 18 polygones GeoJSON réels (earcut triangulation) — `src/data/eez.json`
- Câbles sous-marins : 708 features Telegeography — `src/data/cables.json` (229KB)
- Routes maritimes : 3 niveaux (major/middle/minor) — `src/data/shipping-lanes.json` (53KB)
- Légende interactive, toggle par layer, tooltip hover ZEE
- Zoom 1.3x–5x, auto-rotation 0.08, atmosphère shader
- **Progressive loading** : early exit si hidden (mobile), qualite reduite tablettes (48 seg, pixelRatio 1, pas bump map, pas antialias), WebGL context loss handler

### Matrice (`Matrice.astro`)
- Réseau 3D organique : sphères = engagements, lignes = connexions, particules voyageuses
- Labels positionnés à droite des sphères (calcul screen-space du rayon)
- Panneau détail s'ouvre automatiquement au hover (pas au clic)
- Axes de couleur : Technologique (#2A55B3), Environnementale (#00BF63), Socioculturelle (#B32A55)
- **Lazy loading** : IntersectionObserver (below fold), early exit mobile, qualite reduite, context loss handler

## Pages

### Visualisations iframe
- **Carte marine parcours** : `viz/carte.html` — Canvas 2D scroll-driven, scrollbar masquee
- **Media-viz timeline** : `viz/mediaviz.html` — Canvas 2D scroll-driven, scrollbar masquee, indicateur scroll anime

## Pages (routes : /fr/ et /en/)

### Homepage (`/fr/`, `/en/`)
- Hero plein écran : globe en arrière-plan, overlay léger (55%/15%/35%), dezoom au scroll
- Bouton "Explorer la carte" → mode plein écran avec légende + stats (Escape pour fermer)
- Nav : texte blanc par défaut, bascule noir au scroll (`nav--scrolled`)
- Sections : Stats → Triple Transition → Archipel France → Matrice → Logos → Témoignages → CTA Social → Océanocratie

### Engagements (`/engagements`)
- Hero sombre + Matrice 3D en header (50vh)
- Grille 3 colonnes : GASPE, VAIATA, Opsealog, Fondation ENSM, ENSM, FNMM, HYDROS Alumni, Propeller Club, Apéritifs de la Mer, Académie de Marine, COESPC
- Tuile "Et plus à venir..." (dashed, cachée mobile)

### Contact (`/contact`)
- Sous-titre : "La meilleure façon de me contacter : rejoignez-moi sur les réseaux sociaux et envoyez-moi un message directement."
- Liens : LinkedIn (~16 000 abonnés), Instagram (@colombanatsea)

### Medias (`/medias`)
- Carte marine parcours : Canvas 2D scroll-driven, waypoints chronologiques
- Media-viz constellation : Canvas 2D scroll-driven, 3 rangees (tech/enviro/socio), filtres
- Kit media : 4 cartes telechargement (bio .txt, chiffres-cles .txt, contact .vcf, photos HD mailto)

### Prises de parole (`/prises-de-parole`)
- Conferences & interventions (tableau chronologique, liens externes)
- Podcasts
- Series YouTube (Hissez Mots, Marine Marchande 101)

## SEO
- Canonical URLs : `<link rel="canonical">`
- Sitemap XML : `site/public/sitemap.xml` (8 pages, changefreq + priority)
- Robots.txt : `site/public/robots.txt`
- JSON-LD Person : affiliations (GASPE, VAIATA, Fondation ENSM), knowsAbout, alternateName
- Open Graph complet : og:url, og:site_name, og:image, twitter:card + twitter:image
- Meta descriptions sur toutes les pages

## Securite
- `X-Content-Type-Options: nosniff` (meta)
- `referrer: strict-origin-when-cross-origin` (meta)
- `rel="noopener noreferrer"` sur tous les liens externes
- Fonts non-bloquantes (`media="print" onload`)

## Sites associes
- **oceanocratie.fr** : Landing page standalone (`oceanocratie.fr/index.html`), waitlist email localStorage
- **aperitifsdelamer.com** : Lien dans le footer

## Contact
- Email : hello@colombanatsea.com
- Tel : 06 42 12 99 82
- Site : colombanatsea.com
