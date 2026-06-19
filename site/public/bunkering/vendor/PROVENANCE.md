# Vendor — provenance et reconstruction

Toutes les libs sont self-hostées (same-origin) pour respecter la CSP du site
(`script-src 'self'`) et la posture « zéro dépendance CDN externe ». Aucune n'est
chargée depuis un CDN. Polices via Google Fonts (autorisé par la CSP du site).

| Fichier | Paquet npm | Version | Chargement |
|---|---|---|---|
| `d3.min.js` | d3 | 7.x | eager (rendu) |
| `topojson-client.min.js` | topojson-client | 3.x | eager (conversion land) |
| `d3-geo-projection.min.js` | d3-geo-projection | 4.x | eager (projection Spilhaus) |
| `searoute.bundle.js` | searoute-js | 0.1.0 | lazy (1er routage) |
| `xlsx.full.min.js` | xlsx (SheetJS) | 0.20.3 | lazy (ingest Excel) |
| `pdf.min.js` + `pdf.worker.min.js` | pdfjs-dist | 3.11.174 | lazy (ingest PDF) |

`d3-geo-projection.min.js` et `topojson-client.min.js` proviennent de `voyages-app/node_modules`.
Les autres ont été récupérés via npm.

## Reconstruire le bundle searoute

searoute-js est du CommonJS (turf + geojson-path-finder + un réseau maritime
`marnet_densified.json`). Bundle navigateur IIFE (expose `window.searoute`) :

```
npm install searoute-js@0.1.0 esbuild
echo "import searoute from 'searoute-js'; window.searoute = searoute;" > entry.js
esbuild entry.js --bundle --format=iife --minify --outfile=searoute.bundle.js
```

Résultat : ~485 Ko minifié, ~81 Ko gzip. searoute-js produit des routes maritimes
« réalistes pour la visualisation » (pas du routage de navigation), ce qui correspond
à l'usage poster. Repli grand-cercle dans `lib/router.js` si la lib échoue.

## Données

`data/ports.json` (3962 ports), `data/land-50m.json` : repris de voyages-app.
`data/aliases.json`, `data/ports_supplement.json` : repris du skill maritime-voyage-mapper.
