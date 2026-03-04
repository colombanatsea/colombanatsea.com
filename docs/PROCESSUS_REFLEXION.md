# PROCESSUS DE RÉFLEXION — colombanatsea.com

**Date de création** : 4 mars 2026
**Dernière mise à jour** : 4 mars 2026 (itération 3)

---

## 1. HISTORIQUE DES ITÉRATIONS

### Itération 0 — Initialisation (4 mars 2026)
- Création du cahier des charges v1 (783 lignes)
- Développement de 4 prototypes interactifs autonomes (HTML/JS/CSS)
- Mise en place du dépôt Git

### Itération 1 — Retours utilisateur & corrections (4 mars 2026)

**Retours reçus de Colomban :**

#### Proto 1 — Globe 3D
| Problème | Sévérité | Correction |
|----------|----------|------------|
| Les câbles sous-marins coupent la terre (arcs trop hauts) | Majeur | Réduit `arcAltitudeAutoScale` de 0.1 à 0.02, altitude fixée à 0.005 pour coller à la surface |
| Les ZEE sont des cercles parfaits, pas réalistes | Majeur | Remplacé `generateCirclePolygon` par `generateRealisticEEZ` avec bruit procédural (3 fréquences sinusoïdales) pour des contours irréguliers |
| Routes maritimes / densité de trafic invisibles | Moyen | Activé la couche shipping par défaut (`layerState.shipping = true`) |
| Qualité des données insuffisante | Note | Pour la V2 : intégrer les vraies données GeoJSON des ZEE (Marine Regions / GFW API), les tracés réels des câbles (TeleGeography), et la densité de trafic (GMTDS heatmap) |

#### Proto 2 — Matrice 3D
| Problème | Sévérité | Correction |
|----------|----------|------------|
| Rien ne bouge, aucune interaction | Bloquant | Le CDN Three.js était cassé (`cdnjs.cloudflare.com/ajax/libs/three.js/r160/` n'existe pas). Remplacé par `unpkg.com/three@0.160.0/build/three.min.js` |

#### Proto 3 — Carte marine parcours
| Problème | Sévérité | Correction |
|----------|----------|------------|
| Carte du monde non affichée, on ne sait pas où on est | Majeur | Augmenté l'opacité des côtes (0.12 → 0.35), du remplissage terrestre (0.02 → 0.06), de la grille (0.04 → 0.06). Ajouté 17 noms de lieux géographiques (pays, océans, villes clés) pour le contexte |
| Les labels se superposent quand on revient au même endroit | Moyen | Ajouté détection de doublons : si un waypoint futur visible est au même endroit, le label du plus ancien est masqué. Exception pour les moments fondateurs/décisifs qui sont toujours affichés |

#### Proto 4 — Média-viz constellation
| Problème | Sévérité | Correction |
|----------|----------|------------|
| Filtre "Conférence" ne fonctionne pas | Moyen | Ajouté 8 conférences réelles (Euromaritime, Propeller Club, Race for Water, Digital Ship, Rennes, etc.) + 3 articles presse supplémentaires dans les templates de génération pour avoir un échantillon représentatif |
| Pas d'interaction pour naviguer la timeline | Majeur | Ajouté interaction clic-glisser sur la timeline pour filtrer par plage d'années. Double-clic pour réinitialiser. Zone sélectionnée en surbrillance bleue |
| Trop d'espace occupé | Moyen | Réduit taille des stats (28px → 22px), espacement condensé, timeline rendue cliquable (z-index 100) |

#### Spec — Mise à jour
| Changement | Section |
|------------|---------|
| Enrichi le moment fondateur 2013 Marseille : "première confrontation aux données maritimes : gap technologique + impact environnemental" | Section 2.1 (tableau Phase 2) et Section 2.4 (storytelling) |

### Itération 2 — Refonte majeure des 4 prototypes (4 mars 2026)

**Retours reçus de Colomban :**

#### Proto 1 — Globe 3D
| Problème | Sévérité | Correction |
|----------|----------|------------|
| Les câbles sous-marins coupent la terre, rendu très moche | Bloquant | Réécriture complète du système de câbles : utilisation de `pathsData` qui suit la surface du globe au lieu d'arcs. Tracés réalistes avec waypoints intermédiaires contournant les continents (détroits de Gibraltar, Suez, Malacca, cap de Bonne-Espérance) |
| Les ZEE sont centrées sur les territoires mais ne suivent pas les contours réels | Bloquant | Remplacement des cercles procéduraux par des polygones approximant les vraies frontières ZEE. Coordonnées recherchées pour chaque territoire (Polynésie = vaste zone irrégulière, métropole = suit la côte, etc.) |
| Routes maritimes / densité de trafic invisibles | Majeur | Routes maritimes entièrement refaites avec waypoints réalistes passant par les détroits stratégiques. Strokes plus épais, couleurs plus vives. Ajout d'une couche de densité de trafic |
| Version Océanocratie pas par défaut | Mineur | Version B ("Océanocratie — Une nation libre regarde la mer") définie comme version par défaut |

#### Proto 2 — Matrice 3D
| Problème | Sévérité | Correction |
|----------|----------|------------|
| Rien ne bouge, aucune interaction possible | Bloquant | Réécriture complète : animations de respiration amplifiées, particules coulant le long des connexions, plans qui ondulent, intro animée. Hover = highlight connexions + ripple. Clic = zoom caméra vers sphère. Navigation clavier (flèches). Double-clic = reset vue. Support tactile mobile. Sphère Océanocratie au centre avec glow doré spécial |
| Version Océanocratie pas par défaut | Mineur | Version B définie comme message par défaut |

#### Proto 3 — Carte marine parcours
| Problème | Sévérité | Correction |
|----------|----------|------------|
| Carte du monde non affichée, on ne sait pas où on est | Bloquant | Réécriture du fond de carte avec continent complets (Europe, Afrique, Asie, Amériques, Australie), 50+ points par continent, remplissage terrestre visible, labels pays/océans clairs, grille avec coordonnées |
| Labels se superposent, manque de clarté | Majeur | Système de gestion intelligente des labels : suppression progressive quand le tracé revient au même endroit. Détection de collision. Seul le label le plus récent est affiché par position |
| Manque le moment fondateur Opsealog 2013 Marseille dans la spec | Mineur | Ajouté dans la spec : "Première confrontation aux données maritimes : gap technologique abyssal + impact environnemental massif. C'est à Marseille en 2013 que naît la conviction fondatrice." Waypoint #6 enrichi avec détail complet |

#### Proto 4 — Média-viz constellation
| Problème | Sévérité | Correction |
|----------|----------|------------|
| Filtre "Conférence" ne fonctionne pas | Majeur | Correction du système de filtrage. Utilisation des vraies conférences de la spec (Euromaritime, Académie de Marine, Propeller Club, Race for Water, Digital Ship, Rennes, Mérite Maritime, etc.) |
| Pas d'interaction claire pour la timeline | Majeur | Ajout bouton Play/Pause pour avancer année par année avec animation. Boutons prev/next année. Scrubber draggable avec handle visible. Années cliquables |
| Trop d'espace, pas assez condensé | Moyen | Layout entièrement condensé : publications plus petites, marges réduites, stats compactes, filtres space-efficient. Couleurs utilisées comme identifiants principaux |

#### Spec — Mises à jour
| Changement | Section |
|------------|---------|
| Enrichi le moment fondateur 2013 : ajout de la phrase "C'est à Marseille en 2013 que naît la conviction fondatrice : technologie et environnement sont indissociables" | Section 2.1 Phase 2, waypoint Jul 2013-Jan 2014 |
| Confirmé Océanocratie comme scénario par défaut des prototypes | Section 1.4 |

### Itération 3 — Raffinements visuels et données réelles (4 mars 2026)

**Retours reçus de Colomban :**

#### Proto 1 — Globe 3D
| Problème | Sévérité | Correction |
|----------|----------|------------|
| Le surlignage bleu ZEE remplit tout le globe au lieu des seuls polygones | Bloquant | Correction du rendu polygonsData : les polygones ZEE ne colorent plus que les zones françaises, remplissage très subtil |
| Les routes maritimes sont moches (arcs) | Majeur | Remplacement total par une heatmap dynamique de densité de navires (style AIS). Trafic commercial en orange/rouge, navires de pêche en cyan/teal. Points pondérés par intensité le long des vraies routes maritimes et zones de pêche (Mer du Nord, Grand Banks, côte ouest-africaine, Asie du Sud-Est) |

#### Proto 2 — Matrice 3D
| Problème | Sévérité | Correction |
|----------|----------|------------|
| Titre superposé inutile sur la visualisation | Moyen | Suppression du titre overlay. La visualisation 3D occupe tout le viewport. Le titre sera le header de la page web finale |
| Les 3 axes ne sont pas clairs | Majeur | Labels d'axes plus visibles, couleurs plus saturées, lignes directrices, légende discrète en coin |

#### Proto 3 — Carte marine parcours
| Problème | Sévérité | Correction |
|----------|----------|------------|
| La carte est complètement explosée (contours manuels faux) | Bloquant | Remplacement des contours manuels par les vraies données Natural Earth 110m (GeoJSON open source). Littoraux réels et reconnaissables |

#### Proto 4 — Média-viz constellation
| Problème | Sévérité | Correction |
|----------|----------|------------|
| Le player Play/Pause n'est pas naturel | Majeur | Remplacement par navigation au scroll (comme Proto 3). Page longue, timeline avance avec le défilement |
| Les 3 axes occupent trop d'espace vertical | Majeur | 3 rangées horizontales au même niveau (TECH en haut, ENVIRO au milieu, SOCIO en bas). Axe X = temps, axe Y = catégories |
| Les publications médias ne sont pas assez mises en avant | Moyen | Hiérarchie visuelle : articles médias (Jeune Marine, Marine & Océans) = gros points lumineux avec glow. Conférences = points normaux. LinkedIn = petits points discrets |

---

## 2. DÉCISIONS DE DESIGN

### Choix techniques confirmés par les prototypes
- **globe.gl** fonctionne bien pour le globe 3D mais les données intégrées (ZEE circulaires, câbles simplifiés) ne sont pas à la hauteur. → V2 avec vraies données GeoJSON
- **Three.js** via unpkg fonctionne (attention : le CDN cdnjs n'a pas toutes les versions)
- **Canvas 2D** suffisant pour la carte marine et la média-viz (pas besoin de WebGL)
- **Scroll-driven animation** fonctionne bien pour le storytelling (proto 3)

### Points d'attention pour la V2/V3
1. **Données réelles** : L'itération 3 intègre les données Natural Earth pour les côtes (proto 3) et une heatmap de densité style AIS (proto 1). Reste à intégrer :
   - Vraies frontières ZEE (GeoJSON via Marine Regions ou GFW API)
   - Tracés exacts des câbles sous-marins (TeleGeography API / submarinecablemap.com)
   - Données AIS réelles de densité de trafic (GMTDS / MarineTraffic API)
   - Publications réelles depuis la base Notion (remplacer les données générées)
2. **Mobile** : Aucun prototype n'a de fallback mobile. Prévoir des versions simplifiées 2D.
3. **Performance** : Le globe avec heatmap peut être lourd. Prévoir du lazy loading et des niveaux de détail adaptatifs.
4. **Scroll-driven storytelling** : Confirmé comme le pattern d'interaction principal (proto 3 et proto 4).
5. **Scénario par défaut** : Océanocratie confirmé comme le scénario principal sur tous les prototypes.

---

## 3. PROCHAINES ÉTAPES

1. Tester les prototypes v3 (itération 3) dans un navigateur
2. Itérer sur les retours de Colomban
3. Intégrer les vraies données restantes :
   - Globe : GeoJSON ZEE réelles (Marine Regions), données AIS réelles (MarineTraffic)
   - Média-viz : connexion à la base Notion des publications réelles
4. Développer les fallbacks mobile (2D simplifiés)
5. Choisir la stack technique finale (consulter spec Palantiri)
6. Prototyper le design system basé sur le noeud
7. Développer la V1 du site

---

*Document vivant — mis à jour à chaque itération de développement.*
