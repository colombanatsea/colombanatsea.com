# Colomban at Sea — Specifications Techniques

## Stack
- **Framework** : Astro 5.x (SSG) — `site/`
- **3D** : Three.js (npm) + earcut (polygon triangulation)
- **Hébergement** : GitHub Pages (`colombanatsea.github.io/colombanatsea.com/`)
- **Base URL** : `/colombanatsea.com/`
- **i18n** : Astro built-in (`prefixDefaultLocale: true`, `redirectToDefaultLocale: false`), locales FR/EN
  - Traductions : `site/src/i18n/translations.ts` (UI strings) + `site/src/i18n/utils.ts`
  - Routes : `/fr/` (defaut), `/en/` — redirect racine `/` → `/fr/` (meta refresh + JS instant)
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
- Texture satellite earth-blue-marble.jpg (self-hosted dans `public/assets/textures/`)
- Bump map earth-topology.png (self-hosted, desktop uniquement)
- ZEE France : 18 polygones GeoJSON réels (earcut triangulation) — `src/data/eez.json`
- Câbles sous-marins : 708 features Telegeography — `src/data/cables.json` (229KB)
- Routes maritimes : 3 niveaux (major/middle/minor) — `src/data/shipping-lanes.json` (53KB)
- Légende interactive, toggle par layer, tooltip hover ZEE
- Zoom 1.3x–5x, auto-rotation 0.08, atmosphère shader
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

## Pages (routes : /fr/ et /en/)

### Homepage (`/fr/`, `/en/`)
- Hero plein écran : titre "Océanocratie" (FR) / "Oceanocraty" (EN), baseline "Une nation libre regarde la mer." (non-italic, Poppins 300)
- Globe en arrière-plan (desktop), fallback circle+stats en dessous du content (mobile), overlay léger, dezoom au scroll (rAF-throttled)
- Bouton "Explorer la carte" → mode plein écran avec légende + stats (Escape pour fermer) — masqué mobile
- Nav : texte blanc par défaut, bascule noir au scroll (`nav--scrolled`)
- Citation Tabarly : "La mer, c'est ce que les Français ont dans le dos quand ils regardent la plage" + écho Colomban
- Le MERitoire français : grille 8 cartes (ZEE, 37 frontières, 4 océans, 5 continents, communications, commerce, énergie EMR, culture) — concept TERRitoire vs MERitoire, lien vers globe ZEE-only
- "Tout passe par la mer" : diagnostic positif — exports 595 Md€, 98% télécoms, 45 GW EMR 2050, 25 000 molécules marines — layout 2 colonnes (texte + 4 facts)
- Manifeste Océanocratie/Oceanocraty : "Une nation libre regarde la mer" — 3 piliers (curiosité/humilité/fraternité), distinction thalassocratie vs océanocratie
- Triple évolution : "Deux transitions, une révolution" — techno (transition digitale post-web), écolo (décarbonation + EMR + 9 limites planétaires), socio (révolution socioculturelle + valeurs)
- Engagements : "3 axes d'engagement. Un cap unique" — Matrice 3D
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
- Kit media : 4 cartes téléchargement (bio .txt, chiffres-clés .txt, contact .vcf, photos HD mailto)

### Prises de parole (`/prises-de-parole`, `/speaking`)
- Conférences & interventions (tableau chronologique, liens externes vers euromaritime.fr, lemarin.ouest-france.fr, nabu.de, raceforwater.org)
- Podcasts (Maritime with a French Accent — lien Spotify épisode)
- Séries YouTube : Hissez Mot(s) ! (playlist), Marine Marchande 101 (playlist)

### Sources & données (`/sources`)
- Page de transparence référençant toutes les sources des chiffres utilisés sur le site
- Tableau des 37 États et territoires voisins maritimes de la France (30 souverains + 7 territoires)
- Tableaux : espace maritime (5 continents, 4 océans avec détail), présence par océan, présence par continent, économie maritime, télécoms sous-marines, EMR, recherche, données du globe 3D
- Lien dans le footer (colonne "Liens")
- Sources : SHOM, VLIZ, Douanes françaises, Cluster Maritime, PPE3, France Renouvelables, ITU, TeleGeography

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
- **Textures self-hosted** : earth-blue-marble.jpg (1.4MB) + earth-topology.png (370KB) dans `public/assets/textures/`

## SEO
- Canonical URLs : `<link rel="canonical">`
- Sitemap XML : `site/public/sitemap.xml` (20 URLs FR+EN, changefreq + priority, xhtml:link hreflang)
- Robots.txt : `site/public/robots.txt`
- JSON-LD Person : 8 affiliations avec URLs, knowsAbout étendu (11 termes), alumniOf ENSM, sameAs (LinkedIn, Instagram, YouTube, TikTok)
- Open Graph complet : og:url, og:site_name, og:image, twitter:card + twitter:image
- Meta descriptions sur toutes les pages
- **LLM optimization** : `public/llms.txt` — fichier structuré décrivant le site, les concepts clés, les engagements et les pages pour les LLM

## Sécurité
- **CSP** : `Content-Security-Policy` via meta http-equiv — `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `font-src https://fonts.gstatic.com`, `img-src 'self' data:`, `frame-src 'self'`
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
- **Pas de formulaire** : aucun champ de saisie utilisateur sur le site, donc pas de XSS via input, pas de CSRF, pas de SQL injection.
- **GitHub Pages** : HTTPS forcé, pas de serveur custom, pas de backend. La surface d'attaque est minimale (SSG pur).
- **unsafe-inline** : nécessaire pour les scripts inline Astro et les styles scoped. Acceptable car aucun user input n'est rendu.

## Traduction EN
- Le concept s'écrit "Oceanocraty" en anglais (pas "Océanocratie" ou "Oceanocratie")
- Les classes CSS restent `.oceanocratie__*` (noms internes)
- L'URL `oceanocratie.fr` reste inchangée (nom de domaine)

## Sites associés
- **oceanocratie.fr** : Landing page standalone immersive (`oceanocratie.fr/index.html`)
  - **3D Ocean** : Three.js shader ocean plein écran (vagues procédurales multi-couches, Fresnel, foam, shimmer, starfield, brouillard)
  - **Scroll-driven** : la caméra monte et s'incline au scroll, effet de balancement du navire
  - **Mobile** : fallback CSS avec vagues animées (pas de Three.js), layout responsive
  - **Waitlist** : formulaire email + localStorage (en attente de backend)
  - **Sections** : Hero + livre flottant → Stats → Citation Tabarly → 3 axes (glass card) → Auteur → Footer
  - **Three.js via importmap** : `unpkg.com/three@0.160.0` (pas de bundler, standalone)
- **aperitifsdelamer.com** : Lien dans le footer
- **vaiata-dynamics.com/fr/cyber/** : Protection cyber, lien footer

## Contact
- Email : hello@colombanatsea.com
- Tel : 06 42 12 99 82
- Site : colombanatsea.com
