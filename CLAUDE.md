# Colomban at Sea — Specifications Techniques

## Stack
- **Framework** : Astro 5.x (SSG) — `site/`
- **3D** : Three.js (npm) + earcut (polygon triangulation)
- **Hébergement** : GitHub Pages (`colombanatsea.github.io/colombanatsea.com/`)
- **Base URL** : `/colombanatsea.com/`

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

## Composants 3D

### Globe (`Globe.astro`)
- Texture satellite earth-blue-marble.jpg (unpkg CDN, fallback sombre)
- ZEE France : 18 polygones GeoJSON réels (earcut triangulation) — `src/data/eez.json`
- Câbles sous-marins : 708 features Telegeography — `src/data/cables.json` (229KB)
- Routes maritimes : 3 niveaux (major/middle/minor) — `src/data/shipping-lanes.json` (53KB)
- Légende interactive, toggle par layer, tooltip hover ZEE
- Zoom 1.3x–5x, auto-rotation 0.08, atmosphère shader

### Matrice (`Matrice.astro`)
- Réseau 3D organique : sphères = engagements, lignes = connexions, particules voyageuses
- Labels positionnés à droite des sphères (calcul screen-space du rayon)
- Panneau détail s'ouvre automatiquement au hover (pas au clic)
- Axes de couleur : Technologique (#2A55B3), Environnementale (#00BF63), Socioculturelle (#B32A55)

## Pages

### Homepage (`/`)
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

## Contact
- Email : hello@colombanatsea.com
- Tel : 06 42 12 99 82
- Site : colombanatsea.com
