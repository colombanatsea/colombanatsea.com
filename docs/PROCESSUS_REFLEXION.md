# PROCESSUS DE RÉFLEXION — colombanatsea.com

**Date de création** : 4 mars 2026
**Dernière mise à jour** : 4 mars 2026

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

---

## 2. DÉCISIONS DE DESIGN

### Choix techniques confirmés par les prototypes
- **globe.gl** fonctionne bien pour le globe 3D mais les données intégrées (ZEE circulaires, câbles simplifiés) ne sont pas à la hauteur. → V2 avec vraies données GeoJSON
- **Three.js** via unpkg fonctionne (attention : le CDN cdnjs n'a pas toutes les versions)
- **Canvas 2D** suffisant pour la carte marine et la média-viz (pas besoin de WebGL)
- **Scroll-driven animation** fonctionne bien pour le storytelling (proto 3)

### Points d'attention pour la V2
1. **Données réelles** : Les prototypes utilisent des données simulées/simplifiées. La V2 devra intégrer :
   - Vraies frontières ZEE (GeoJSON via Marine Regions ou GFW)
   - Tracés réels des câbles sous-marins (TeleGeography API)
   - Densité de trafic maritime (GMTDS ou ArcGIS)
   - Publications réelles depuis la base Notion
2. **Mobile** : Aucun prototype n'a de fallback mobile. Prévoir des versions simplifiées 2D.
3. **Performance** : Le globe avec toutes les couches activées peut être lourd. Prévoir du lazy loading et des niveaux de détail adaptatifs.

---

## 3. PROCHAINES ÉTAPES

1. Tester les prototypes corrigés dans un navigateur
2. Itérer sur les retours
3. Commencer l'intégration de vraies données (GeoJSON ZEE, câbles, publications Notion)
4. Choisir la stack technique finale (consulter spec Palantiri)
5. Prototyper le design system basé sur le noeud
6. Développer la V1 du site

---

*Document vivant — mis à jour à chaque itération de développement.*
