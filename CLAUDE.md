# Colomban at Sea — Specifications Techniques

## Stack
- **Framework** : Astro 5.x (SSG) — `site/`
- **3D** : Three.js (npm) + earcut (polygon triangulation)
- **Hébergement** : GitHub Pages (`colombanatsea.github.io/colombanatsea.com/`)
- **Base URL** : `/colombanatsea.com/`
- **i18n** : Astro built-in (`prefixDefaultLocale: true`, `redirectToDefaultLocale: false`), locales FR/EN
  - Traductions : `site/src/i18n/translations.ts` (UI strings) + `site/src/i18n/utils.ts`
  - Routes : `/fr/` (defaut), `/en/` — redirect racine `/` → `/fr/` (meta refresh + JS instant)
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
- **Dividers** : `divider.svg` du repo `colombanatsea/logos`, 64px, 18% opacité

### Indicateurs de scroll
- Pattern reutilise : `.scroll-hint` + `.scroll-hint__line` avec animation `scroll-pulse`
- Utilise sur : homepage hero, mediaviz timeline
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
- **Mobile** : Globe entièrement masqué dans le hero (`display: none`), remplacé par gradient radial subtle. Bouton "Explorer la carte" masqué. Fallback CSS circle + stats si affiché hors hero.

### Matrice (`Matrice.astro`)
- Réseau 3D organique : sphères = engagements, lignes = connexions, particules voyageuses
- Labels positionnés à droite des sphères (calcul screen-space du rayon)
- Panneau détail s'ouvre automatiquement au hover (pas au clic)
- Axes de couleur : Technologique (#2A55B3), Environnementale (#00BF63), Socioculturelle (#B32A55)
- **Lazy loading** : IntersectionObserver (below fold), early exit mobile, qualite reduite, context loss handler
- **UX** : Curseur `grab`/`grabbing`, hint animé "Cliquer-glisser pour explorer" qui disparaît à la première interaction
- **Mobile** : Fallback liste 3 axes (pas de Three.js)

## Visualisations iframe

### Carte marine parcours (`viz/carte.html`)
- Canvas 2D scroll-driven, scrollbar masquée
- **Background** : `#1A1A2E` (= `--noir-doux`, unifié avec le hero de a-propos)
- **Scroll piloté par le parent** : la page a-propos envoie `postMessage({ type: 'setProgress', progress })` à l'iframe. L'iframe écoute et utilise `externalProgress` au lieu de son propre scroll interne. Section parent = 800vh sticky.
- **Titre** : `top: 80px` pour passer sous la navbar du parent
- **Mobile** : phase-indicator compact (right 12px), compass réduit, tooltip 220px max, watermark masqué

### Media-viz timeline (`viz/mediaviz.html`)
- Canvas 2D scroll-driven, scrollbar masquée, indicateur scroll animé

## Pages (routes : /fr/ et /en/)

### Homepage (`/fr/`, `/en/`)
- Hero plein écran : titre "Océanocratie", baseline "Une nation libre regarde la mer." (non-italic, Poppins 300)
- Globe en arrière-plan (desktop), gradient radial (mobile), overlay léger, dezoom au scroll (rAF-throttled)
- Bouton "Explorer la carte" → mode plein écran avec légende + stats (Escape pour fermer) — masqué mobile
- Nav : texte blanc par défaut, bascule noir au scroll (`nav--scrolled`)
- Stats : chiffres maritimes (ZEE, câbles, frontières, émissions GES) — pas de stats personnelles
- Triple transition : "Deux transitions, une révolution" — tech (4G vs papier), enviro (9 limites planétaires), socio (appropriation par les marins)
- Le MERitoire français : grille 6 cartes (ZEE, frontières, communications, commerce, énergie EMR, culture) — concept TERRitoire vs MERitoire
- Sections : Stats → Divider → Triple Transition → Divider → MERitoire → Matrice → Logos → Témoignages → CTA Social → Océanocratie

### A propos (`/a-propos`)
- Hero sombre sans scroll-hint (la carte a le sien)
- Carte marine : section 800vh avec iframe sticky 100vh, mask-image fade en haut (12%)
- Scroll parent contrôle l'animation de la carte via postMessage (rAF-throttled)
- Sections : Moment fondateur → Divider → Vision → Valeurs → Colomban → Bibliographie

### Engagements (`/engagements`)
- Hero sombre + Matrice 3D en header (55vh, mask-image top/bottom fade)
- Grille 3→2→1 colonnes (responsive) : GASPE, VAIATA, Opsealog, Fondation ENSM, ENSM, FNMM, HYDROS Alumni, Propeller Club, Apéritifs de la Mer, Académie de Marine, COESPC
- Tuile "Et plus à venir..." (dashed, cachée mobile)

### Contact (`/contact`)
- Sous-titre : "La meilleure façon de me contacter : rejoignez-moi sur les réseaux sociaux et envoyez-moi un message directement."
- Liens : LinkedIn (~16 000 abonnés), Instagram (@colombanatsea)

### Medias (`/medias`)
- Media-viz constellation : Canvas 2D scroll-driven, 3 rangées (tech/enviro/socio), filtres
- Kit media : 4 cartes téléchargement (bio .txt, chiffres-clés .txt, contact .vcf, photos HD mailto)

### Prises de parole (`/prises-de-parole`)
- Conférences & interventions (tableau chronologique, liens externes)
- Podcasts
- Séries YouTube (Hissez Mots, Marine Marchande 101)

## Performance
- **Scroll handlers** : tous throttlés via `requestAnimationFrame` (hero dezoom, carte progress)
- **3D mobile** : Globe et Matrice ne chargent pas Three.js sur mobile (early exit si `offsetWidth === 0`)
- **Fonts** : Google Fonts non-bloquantes (`media="print" onload="this.media='all'"` + `display=swap`)
- **Lazy loading** : Matrice via IntersectionObserver, Globe preloaded (hero)
- **Bundles** : Three.js ~78KB gzip (Globe), OrbitControls ~121KB gzip, Matrice ~4KB gzip

## SEO
- Canonical URLs : `<link rel="canonical">`
- Sitemap XML : `site/public/sitemap.xml` (8 pages, changefreq + priority)
- Robots.txt : `site/public/robots.txt`
- JSON-LD Person : affiliations (GASPE, VAIATA, Fondation ENSM), knowsAbout, alternateName
- Open Graph complet : og:url, og:site_name, og:image, twitter:card + twitter:image
- Meta descriptions sur toutes les pages

## Sécurité
- **CSP** : `Content-Security-Policy` via meta http-equiv — `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `frame-src 'self'`, fonts Google, images unpkg
- `X-Content-Type-Options: nosniff` (meta)
- `referrer: strict-origin-when-cross-origin` (meta)
- `rel="noopener noreferrer"` sur tous les liens externes
- **postMessage** : carte.html valide `e.origin !== window.location.origin` avant d'accepter les messages
- Fonts non-bloquantes (`media="print" onload`)
- **innerHTML** : utilisé uniquement avec des données statiques hardcodées (waypoints carte), jamais avec du user input

### Vecteurs potentiels à surveiller
- **Dépendance CDN** : `unpkg.com` pour la texture Globe (earth-blue-marble.jpg). Si unpkg tombe ou est compromis, le globe montre un fond sombre (fallback gracieux). Envisager de self-host la texture à terme.
- **Google Fonts** : chargé en async non-bloquant. Si Google Fonts tombe, les polices système prennent le relais (`display=swap`). Pas de SRI possible sur les fonts dynamiques.
- **Pas de formulaire** : aucun champ de saisie utilisateur sur le site, donc pas de XSS via input, pas de CSRF, pas de SQL injection.
- **GitHub Pages** : HTTPS forcé, pas de serveur custom, pas de backend. La surface d'attaque est minimale (SSG pur).

## Sites associés
- **oceanocratie.fr** : Landing page standalone (`oceanocratie.fr/index.html`), waitlist email localStorage
- **aperitifsdelamer.com** : Lien dans le footer

## Contact
- Email : hello@colombanatsea.com
- Tel : 06 42 12 99 82
- Site : colombanatsea.com
