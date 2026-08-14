# Base chantiers et équipementiers, méthodologie OSINT

> Fiche de référence pour toute personne ou agent qui enrichit
> `site/public/chantiers/data/chantiers.json`, publiée sur colombanatsea.com/chantiers.
> Établie le 14/08/2026, à la suite de la passe de vérification du catalogue de
> fournisseurs du GICAN pour le GT décarbonation de la flotte côtière (DGAMPA).

## 1. Ce que la base est, et ce qu'elle n'est pas

C'est une **documentation de référence** et une aide au choix d'un chantier par navire
similaire. Ce n'est ni un annuaire commercial, ni une liste d'adhérents, ni un
palmarès. Elle sert de source opposable dans des travaux institutionnels : au
14/08/2026 elle a servi à corriger le catalogue de fournisseurs d'une fédération
industrielle devant l'administration. Une erreur dans la base devient donc une erreur
dans un livrable d'État.

**Règle cardinale : tout doit être sourcé et vérifiable par un lien.** Aucune fiche,
aucun navire, aucune capacité ne s'ajoute sans au moins une URL consultable. Une
information que l'on croit vraie mais que l'on ne sait pas sourcer ne rentre pas.

## 2. Les trois blocs et leurs règles

| Bloc | Nature | Règle |
|---|---|---|
| `chantiers[]` | Entité de premier rang | Un chantier existe même sans navire documenté. Porte `navires_references[]`. |
| `equipementiers[]` | Entité de premier rang | Existe même sans référence de navire publique. Une maison déjà fichée comme chantier n'est pas dupliquée, elle porte `rattachement_chantier`. |
| Architectes, opérateurs, dessertes | **Dérivés**, jamais saisis | Calculés par `app.js` à partir des champs `architecte`, `operateur`, `desserte` des navires. Pour faire apparaître un architecte, on ajoute un navire, pas une fiche. |

Conséquence pratique, souvent mal comprise : **pour documenter un bureau d'études, on
enrichit les navires qu'il a conçus.** Ship-ST, Stirling Design International ou
NepTech apparaissent parce que des navires portent leur nom en `architecte`. Créer
une fiche équipementier pour un architecte crée un doublon.

Un même acteur peut légitimement figurer dans deux blocs quand il exerce deux métiers
distincts. Alternatives Énergies est architecte (via ses navires) **et** équipementier
(intégration énergie-propulsion). Dans ce cas, le champ `note` de la fiche
équipementier explique pourquoi.

## 3. Niveaux de confiance

Le champ `confiance` est obligatoire et engage.

- **`haute`** : source primaire (site de la société, registre légal, communiqué) **et**
  au moins une référence de navire nommée, ou une donnée légale vérifiée au registre.
- **`moyenne`** : source primaire sur le métier, sans référence de navire vérifiable.
- **`faible`** : source secondaire seule, information à confirmer.

Ce qui n'est pas confirmé ne se met pas en `moyenne` par défaut. On l'écrit dans
`note` : « aucune référence identifiée au JJ/MM/AAAA ».

## 4. Le champ `note`, là où se joue l'honnêteté de la base

`produit` décrit. `note` **restreint**. C'est le champ qui empêche un lecteur pressé de
mésinterpréter une fiche. Il porte :

- le périmètre réel des références (course au large et non navire à passagers) ;
- l'absence de référence navire malgré un positionnement affiché ;
- les conclusions d'études publiques défavorables au levier ;
- la nationalité réelle quand elle contredit le classement usuel ;
- le changement d'entité juridique.

Exemple à imiter, la fiche Enogia porte en `note` la conclusion de l'étude VNF selon
laquelle l'ORC en rétrofit n'est pas pertinent. Sans cette note, la fiche laisserait
croire que le levier est mûr.

## 5. Hiérarchie des sources

1. **Registres légaux** : `annuaire-entreprises.data.gouv.fr`, `pappers.fr`. Seuls
   valables pour l'état d'une société, une procédure collective, un SIREN.
2. **Site officiel de la société**, pages références et réalisations.
3. **Presse spécialisée** : Mer et Marine, Journal de la Marine Marchande,
   Bateau Électrique, Boat Industry, presse régionale économique.
4. **Institutionnels** : GICAN, pôles de compétitivité, ADEME, régions, VNF.

Wikipédia est acceptable en source d'appoint sur un navire, jamais sur l'état d'une
société.

## 6. Pièges rencontrés, à ne pas refaire

- **Ne jamais conclure à une disparition sur la foi d'un moteur de recherche.** Sur
  « Merré Nort-sur-Erdre », plusieurs jugements de liquidation 2025-2026 remontent :
  ils concernent d'autres sociétés de la commune. Merré est en activité, sans
  procédure collective, et construit pour la Marine nationale. Vérifier au registre,
  SIREN en main, avant d'écrire qu'un chantier a disparu.
- **Distinguer la société de l'entité juridique.** Le nom « Martinez » reste valable,
  l'entité non : redressement judiciaire ouvert en avril 2024, activité reprise par la
  SAS Chantier Naval Martinez. Une référence contractuelle doit viser la bonne entité.
- **Distinguer les trois métiers.** Architecte, chantier, intégrateur. NepTech conçoit,
  Efinor Allais ou le Chantier de l'Arsenal construisent, Alternatives Énergies intègre.
  Les confondre dans une même colonne est la première cause d'erreur des catalogues
  de filière.
- **Vérifier ce qui est livré, pas ce qui est annoncé.** « H2 ready » n'est pas
  « hydrogène ». Un navire conçu pour accueillir une pile n'a pas de pile.
- **Vérifier la nationalité.** MobyFly est suisse, ODC Marine est française mais
  construit à Dalian en Chine. Ni l'une ni l'autre n'étaye une capacité française.
- **Traquer les doublons de renommage.** Ayro est devenue OceanWings, les deux noms
  circulent et gonflent artificiellement le décompte d'une filière. SolidSail n'est pas
  une société, c'est le gréement des Chantiers de l'Atlantique.

## 7. Ajouter un levier d'équipementier

Le champ `levier` est libre côté données mais **la carte, elle, ne connaît que les
leviers déclarés dans `app.js`**. Ajouter un levier sans toucher au code produit un
point gris absent de la légende, c'est-à-dire une interface qui ment.

Deux endroits à modifier ensemble dans `site/public/chantiers/assets/app.js` :

1. `LEVIER_COULEUR`, la couleur du point sur la carte ;
2. l'objet `lib` dans `mapChrome()`, le libellé affiché dans la légende.

Leviers déclarés au 14/08/2026 : `batteries`, `moteurs-electriques`,
`piles-a-combustible`, `velique`, `foils`, `integration-energie`, `moteurs-hydrogene`,
`solaire`, `revetements`, `recuperation-chaleur`, `routage-exploitation`.

## 8. Traçabilité des passes

Toute passe d'enrichissement inscrit une entrée dans `meta.passes[]` : date, objet,
déclencheur, lien vers cette méthodologie, résultats principaux. Les fiches créées ou
modifiées lors d'une passe portent un champ `_maj_osint` daté qui dit pourquoi elles
ont bougé. On doit pouvoir répondre, six mois plus tard, à la question « d'où sort
cette fiche ».

## 9. Publication

Le déploiement est automatique : GitHub Actions construit `./site` et publie sur
GitHub Pages à chaque push sur `main`. **On édite `site/public/`, jamais `site/dist/`**,
qui est un artefact de build.

Poussé ne veut pas dire en ligne. Après le push, vérifier que le workflow est vert,
puis ouvrir la page publiée et contrôler que la donnée ajoutée s'affiche réellement,
carte et annuaire. Un JSON valide en local ne prouve rien sur la surface publique.

## 10. Écriture des scripts d'enrichissement

Lire le fichier **en entier** avant toute écriture, et n'écrire qu'en dernière
opération. Ouvrir un JSON en mode `w` avant de l'avoir lu le vide. Les scripts doivent
être idempotents : relancés deux fois, ils ne doivent rien dupliquer. Contrôler le
delta après coup (`git diff --stat` et comptes avant / après) plutôt que faire
confiance au script.
