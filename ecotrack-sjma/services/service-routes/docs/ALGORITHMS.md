#  Algorithmes d'optimisation - Service Routes

Le service implémente deux algorithmes d'optimisation de tournées + la formule de distance Haversine. Tout est dans `src/services/optimization-service.js` (fonctions pures, zéro dépendance externe).

---

## Distance Haversine

Calcule la distance en km entre deux points GPS sur une sphère.

```javascript
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

**Propriétés** :
- Symétrique : `d(A, B) === d(B, A)`
- Retourne 0 pour deux points identiques
- Précision ±0.3% (suffisant pour usage urbain)

---

## Nearest Neighbor (O(n²))

Algorithme glouton : commence par le conteneur avec le plus haut niveau de remplissage, puis sélectionne toujours le voisin le plus proche non visité.

```
Entrée  : conteneurs triés par fill_level DESC
Sortie  : route ordonnée

1. current = premier conteneur (remplissage le plus élevé)
2. Tant que unvisited non vide :
   a. Trouver le conteneur le plus proche de current
   b. L'ajouter à la route
   c. Le retirer de unvisited
   d. current = conteneur ajouté
```

**Complexité** : O(n²)
**Qualité** : sous-optimale (solution greedy, peut créer des détours)
**Vitesse** : quasi-instantanée même pour 500 conteneurs
**Usage** : urgences, fallback si 2-opt trop lent

---

## 2-opt (amélioration itérative)

Appliqué **après** Nearest Neighbor. Améliore la route en inversant des segments pour éliminer les croisements.

```
Entrée  : route initiale (issue de NN)
Sortie  : route améliorée

Tant que amélioration > 0.001 km ET itérations < 1000 :
  Pour chaque paire (i, j) avec j > i+1 :
    newRoute = route[0..i] + reverse(route[i+1..j]) + route[j+1..]
    Si distance(newRoute) < distance(route) - 0.001 :
      route = newRoute
      improved = true  → recommencer
```

**Complexité** : O(n² × iterations), max 1000 itérations
**Gain typique** : -15% à -45% vs l'ordre original
**Vitesse** : ~2s pour 50 conteneurs (JavaScript)
**Usage** : planification normale (**recommandé par défaut**)

---

## optimizeRoute()

Fonction principale appelée par `TourneeService.optimizeTournee()`.

```javascript
function optimizeRoute(containers, algorithme = '2opt')
// → {
//     route: [...],             // Conteneurs dans l'ordre optimal
//     distance_km: 10.01,       // Distance totale optimisée
//     distance_originale_km: 17.44,  // Distance ordre original
//     distance_nn_km: 12.5,     // Distance après Nearest Neighbor
//     gain_pct: 42.62,          // Gain vs ordre original (%)
//     algorithme_utilise: '2opt',
//     nb_conteneurs: 8
//   }
```

**Flux** :
```
containers (triés fill_level DESC)
    │
    ▼
nearestNeighborAlgorithm()   → nnRoute + nnDistance
    │
    ├── (algorithme = 'nearest_neighbor') → retourner nnRoute
    │
    └── (algorithme = '2opt')
            │
            ▼
        twoOptAlgorithm(nnRoute) → finalRoute + finalDistance
            │
            ▼
        Calculer gain vs ordre original
```

---

## estimateDuration()

Estime la durée d'une tournée en minutes.

```javascript
function estimateDuration(distanceKm, nbConteneurs) {
  const vitesseMoyenne = 20; // km/h en circulation urbaine
  const tempsTrajet  = (distanceKm / vitesseMoyenne) * 60;  // minutes
  const tempsCollecte = nbConteneurs * 5;                    // 5 min/conteneur
  return Math.ceil(tempsTrajet + tempsCollecte);
}
```

**Exemple** : 23.4 km, 48 conteneurs → `ceil(70.2 + 240) = 311 min ≈ 5h 11min`

---

## Calcul des heures d'étapes

Après optimisation, les heures estimées sont calculées en arithmétique entière (pas de `Date`) pour éviter les erreurs `Invalid Date` :

```javascript
const minutesParEtape = result.nb_conteneurs > 0
  ? Math.ceil(dureePrevue / result.nb_conteneurs)
  : 15;

const baseMinutes = 7 * 60 + 30; // Départ 07:30

etapes = route.map((conteneur, idx) => {
  const totalMinutes = baseMinutes + idx * minutesParEtape;
  const hh = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return { sequence: idx + 1, id_conteneur: conteneur.id_conteneur, heure_estimee: `${hh}:${mm}` };
});
```

**Exemple** : 8 conteneurs, durée 70 min → 9 min/étape
- Étape 1 : 07:30
- Étape 2 : 07:39
- Étape 3 : 07:48
- ...

---

## Comparaison des algorithmes

| Critère | Nearest Neighbor | 2-opt |
|---|---|---|
| Complexité | O(n²) | O(n² × iter) |
| Qualité solution | Sous-optimale | Optimale |
| Vitesse (50 conteneurs) | ~0.1s | ~2s |
| Gain moyen vs original | ~20% | ~35% |
| Recommandé pour | Urgences | Usage normal |

### Exemple réel (8 conteneurs, zone 1)

```
Ordre original    : 17.44 km
Nearest Neighbor  : 12.50 km  (-28%)
2-opt             : 10.01 km  (-42.62% vs original)
```

---

## Tests unitaires des algorithmes

Fichier : `test/unit/services/optimization-service.test.js` (21 tests)

```bash
npm test -- optimization-service
```

Cas testés :
- `haversineDistance` : points identiques, symétrie, Paris→Londres
- `totalDistance` : route vide, route 1 point, somme correcte
- `nearestNeighborAlgorithm` : vide, 1 conteneur, tous visités, pas de doublon
- `twoOptAlgorithm` : ≤ 3 conteneurs, distance ≤ initiale, pas de doublon
- `optimizeRoute` : vide, nearest_neighbor, 2opt, métadonnées, gain ≥ 0
- `estimateDuration` : 0km/0cont, calcul exact, arrondi ceil
