---
date: 2026-09-04
auteur: Narvi
sujet: décommissionnement de la surface publique /chantiers/
type: note de chantier
mandat: Colombanatsea
---

# La page /chantiers/ est retirée, la donnée reste servie

Décision de Colomban, 04/09/2026 : « https://colombanatsea.com/chantiers/ doit être
décommissionné puisque tout est passé dans l'environnement en base. » L'environnement en
question est VAIATA Intelligence, espace `intelligence-registre-armateurs-cotiers` et
espace interne `vaiata-intelligence` du dépôt `design-vaiata`.

## Ce qui a été retiré

• `index.html`, la carte des chantiers ;
• `transparence.html`, la page de sourcing ;
• `assets/`, dont la copie de Leaflet, qui ne servait que ces deux pages ;
• les cinq fonds `*.geojson`, qui ne servaient que la carte de `index.html`.

Après retrait, `https://colombanatsea.com/chantiers/` ne rend plus de page.

## Ce qui reste, et pourquoi

`data/chantiers.json`, 15,5 Mo, **reste servi**. VAIATA Intelligence le lit en direct :
`spaces/vaiata-intelligence/app.js`, constante `REGISTRE`. L'espace charge d'abord son
index dérivé de 2,9 Mo, puis le registre entier au premier détail demandé. Retirer ce
fichier casserait les fiches des deux espaces Intelligence. Le registre n'est donc pas
décommissionné : c'est sa page qui l'est.

`data/transparence.json` et `data/transparence-serie.json` restent aussi. La série est un
historique du taux de sourcing, alimenté à chaque moisson depuis le 20/08/2026 ; elle
pèse 2 Ko et rien ne se gagne à l'effacer.

## Le point qui reste ouvert

Le registre est hébergé par un site vitrine et consommé par une plateforme produit. Tant
que les deux vivent, la dépendance tient par une URL publique et rien d'autre : ni test,
ni alerte du côté de `colombanatsea.com` ne dirait qu'un déplacement de ce fichier a mis
Intelligence à l'arrêt. Le déplacer vers `design-vaiata`, ou vers un domaine de données
propre, est un arbitrage à rendre avant la prochaine réorganisation de `site/public/`.

## Périmètre vérifié le 04/09/2026

`git grep -ni "chantiers"` sur tout le dépôt suivi, dossier `site/public/chantiers` et
`site/dist` exclus : **zéro** lien entrant. Les seules occurrences du mot sont trois
libellés du simulateur de transition, sans rapport avec la page.
