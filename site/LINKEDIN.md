# Flux LinkedIn auto-heberge

Le bloc « Sur LinkedIn » de la page d'accueil (FR + EN) est rendu par
`src/components/LinkedInFeed.astro` a partir de `src/data/linkedin.json`.
Aucun widget tiers, aucun script externe, images servies depuis notre domaine.
Meme principe que le carrousel Rayonnement d'armateurscotiers.fr, en statique.

## Ajouter une publication

1. Poser l'image du post dans `site/public/linkedin/` (ex.
   `2026-06-decarbonation.jpg`). Format conseille : 1200x800, < 300 Ko (webp/jpg).
   L'image est facultative : sans image, une carte de marque bleue s'affiche.

2. Ajouter une entree en tete de `src/data/linkedin.json` :

```json
{
  "id": "li-2026-06-decarbonation",
  "url": "https://www.linkedin.com/posts/colombanatsea_...",
  "image": "/linkedin/2026-06-decarbonation.jpg",
  "alt": "Description courte de l'image",
  "excerpt": "Les 2 a 3 premieres phrases du post, sans lien ni hashtag.",
  "postedAt": "2026-06-20",
  "order": 0,
  "published": true
}
```

3. `npm run build` (dans `site/`), verifier le rendu, commit + push. Le deploiement
   GitHub Pages se declenche automatiquement.

## Champs

| Champ | Role |
|---|---|
| `id` | identifiant unique (slug) |
| `url` | lien vers le post LinkedIn (ouvre dans un nouvel onglet) |
| `image` | chemin depuis la racine (`/linkedin/...`) ou URL absolue ; `null` = carte de marque |
| `alt` | texte alternatif de l'image (accessibilite) |
| `excerpt` | extrait affiche (4 lignes max, tronque proprement) |
| `postedAt` | date `AAAA-MM-JJ` ou `AAAA-MM` (tri + affichage) |
| `order` | tri croissant prioritaire (0 = premier) ; a date egale, le plus recent d'abord |
| `published` | `false` pour masquer sans supprimer |

Le composant affiche les 6 premiers posts publies (parametrable :
`<LinkedInFeed lang="fr" limit={9} />`).

## Note

Les 3 entrees livrees sont des exemples (une avec image reelle
`/medias/marine-oceans-291-preview.jpg`, deux en carte de marque). Les remplacer
par les vrais posts. Pas de scraping LinkedIn : selection editoriale, comme sur
armateurscotiers.fr.
