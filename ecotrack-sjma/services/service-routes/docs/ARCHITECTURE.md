#  Architecture - Service Routes

## Vue d'ensemble

Le Service Routes suit une architecture **Controller → Service → Repository** avec injection de dépendances. Tout est CommonJS (`require/module.exports`).

```
Requête HTTP
     │
     ▼
[Express Router]
     │
     ▼
[Controller]          ← lit req, appelle service, renvoie ApiResponse
     │
     ▼
[Service]             ← logique métier, validation Joi, lève ApiError
     │
     ▼
[Repository]          ← requêtes SQL paramétrées, transactions
     │
     ▼
[PostgreSQL Pool]     ← connexion partagée (max 10 connexions)
```

---

## Injection de dépendances (`di.js`)

Le fichier `src/di.js` câble toutes les dépendances au démarrage :

```javascript
// Pool → Repositories
const tourneeRepo  = new TourneeRepository(pool);
const collecteRepo = new CollecteRepository(pool);
const vehiculeRepo = new VehiculeRepository(pool);
const statsRepo    = new StatsRepository(pool);

// Repositories → Services
const tourneeService  = new TourneeService(tourneeRepo, collecteRepo);
const collecteService = new CollecteService(collecteRepo, tourneeRepo);
const vehiculeService = new VehiculeService(vehiculeRepo);
const statsService    = new StatsService(statsRepo);

// Services → Controllers
const tourneeCtrl  = new TourneeController(tourneeService, db);
const collecteCtrl = new CollecteController(collecteService);
const vehiculeCtrl = new VehiculeController(vehiculeService);
const statsCtrl    = new StatsController(statsService, db);
```

Toutes les méthodes des controllers sont **bindées** dans le constructeur :

```javascript
class TourneeController {
  constructor(tourneeService, db) {
    this.service = tourneeService;
    this.db = db;
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    // ...
  }
}
```

---

## Couches

### Controllers

- Reçoivent `(req, res, next)`
- Extraient les données de `req.body`, `req.params`, `req.query`, `req.headers`
- Appellent le service
- Répondent avec `ApiResponse.success()` ou `ApiResponse.paginated()`
- Délèguent les erreurs à `next(err)`

**Identification agent** : les controllers `TourneeController` et `CollecteController` lisent `req.headers['x-user-id']` injecté par l'API Gateway.

### Services

- Contiennent toute la logique métier
- Valident les données via `validateSchema(joiSchema, data)`
- Lèvent des `ApiError` (400, 404, 409, 500)
- Orchestrent les appels aux repositories
- N'ont aucune connaissance d'Express (pas de req/res)

### Repositories

- Exécutent les requêtes SQL paramétrées (`$1, $2...`)
- Utilisent des **transactions** pour les opérations atomiques
- Retournent des objets JS purs

### Optimization Service

Service **pur** (aucune dépendance externe, pas de DB) :

```javascript
// Fonctions exportées
haversineDistance(lat1, lon1, lat2, lon2) → km
totalDistance(route)                      → km
nearestNeighborAlgorithm(containers)      → route[]
twoOptAlgorithm(route)                    → route[]
optimizeRoute(containers, algorithme)     → { route, distance_km, gain_pct, ... }
estimateDuration(distanceKm, nbConteneurs)→ minutes
```

---

## Schéma des tables utilisées

| Table | Utilisée par | Rôle |
|---|---|---|
| `tournee` | TourneeRepository | Tournées de collecte |
| `etape_tournee` | TourneeRepository, CollecteRepository | Étapes ordonnées |
| `collecte` | CollecteRepository | Collectes enregistrées |
| `signalement` | CollecteRepository | Anomalies signalées |
| `type_signalement` | CollecteRepository | Types d'anomalie (lookup) |
| `vehicule` | VehiculeRepository | Parc de véhicules |
| `zone` | TourneeRepository | Zones géographiques |
| `utilisateur` | TourneeRepository | Agents assignés |
| `historique_statut` | TourneeRepository | Audit changements statut |
| `conteneur` | TourneeService (optimizeTournee) | Conteneurs avec GPS |
| `capteur`, `mesure` | TourneeService (optimizeTournee) | Niveaux de remplissage |

---

## Gestion des erreurs

### ApiError

```javascript
class ApiError extends Error {
  constructor(statusCode, message, details = null)

  // Factories
  static badRequest(message, details)  // 400
  static notFound(message)             // 404
  static conflict(message)             // 409
  static internal(message)             // 500
}
```

### Error Handler (middleware)

```javascript
// Codes PostgreSQL gérés automatiquement
'23505' → 409 Conflict  (violation contrainte UNIQUE)
'23503' → 409 Conflict  (violation clé étrangère)
'23514' → 400 Bad Request (violation contrainte CHECK)
// Autres → 500 Internal Server Error
```

### ApiResponse

```javascript
ApiResponse.success(data, message, statusCode)          // { success: true, data, message, statusCode, timestamp }
ApiResponse.error(statusCode, message, details)         // { success: false, message, statusCode, details }
ApiResponse.paginated(data, page, limit, total)         // { success: true, data, pagination: { page, limit, total, pages, hasMore } }
```

---

## Transactions

### recordCollecte (CollecteRepository)

```
BEGIN
  INSERT INTO collecte (id_tournee, id_conteneur, quantite_kg, date_heure_collecte)
  UPDATE etape_tournee SET collectee = TRUE WHERE id_tournee = ? AND id_conteneur = ?
COMMIT
```

### updateStatut (TourneeRepository)

```
BEGIN
  UPDATE tournee SET statut = ? WHERE id_tournee = ?
  INSERT INTO historique_statut (id_tournee, ancien_statut, nouveau_statut, date_changement)
COMMIT
```

### addEtapes (TourneeRepository)

```
BEGIN
  INSERT INTO etape_tournee (id_tournee, sequence, id_conteneur, heure_estimee) × N
COMMIT
```

---

## Flux d'optimisation (`POST /optimize`)

```
1. Validation Joi (id_zone, date_tournee, id_agent, seuil_remplissage, algorithme)
2. Query DB → conteneurs ACTIFS de la zone avec position GPS NOT NULL + fill_level
3. Filtrage → fill_level >= seuil_remplissage
4. optimizeRoute(containers, algorithme)
   ├── nearestNeighborAlgorithm(containers)  → nnRoute
   └── (si 2opt) twoOptAlgorithm(nnRoute)   → finalRoute
5. estimateDuration(distance_km, nb_conteneurs)  → duree_prevue_min
6. tourneeRepo.create({ date_tournee, statut:'PLANIFIEE', distance_prevue_km, duree_prevue_min, ... })
7. Calcul heure estimée par étape : baseMinutes=7h30 + idx × minutesParEtape
8. tourneeRepo.addEtapes(id_tournee, etapes[])  → transaction
9. Retourner { tournee, optimisation: { gain_pct, ... }, etapes }
```

---

## Infrastructure

### Logger (Pino)

```javascript
// Production : JSON structuré
{ "level": "info", "time": 1234567890, "service": "service-routes", "msg": "..." }

// Développement : coloré (pino-pretty)
[INFO] Request completed GET /api/routes/tournees 200 45ms
```

### Prometheus (prom-client)

Métriques exposées sur `GET /metrics` :
- `http_requests_total` — compteur par méthode + route + statut
- `http_request_duration_seconds` — histogramme des latences

### Healthcheck Docker

```javascript
// healthcheck.cjs
http.get('http://localhost:3012/health', (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});
```

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "node", "healthcheck.cjs"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 15s
```
