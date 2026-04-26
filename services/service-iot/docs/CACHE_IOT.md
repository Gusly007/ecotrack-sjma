# Service IoT - Cache Redis

## Vue d'ensemble

Le service IoT utilise Redis pour cacher les données fréquemment accédées afin de réduire la charge sur PostgreSQL et améliorer les temps de réponse.

## Stratégie de Cache

### Pattern: Cache-Aside

```
1. Vérifier cache
2. Si HIT → retourner données cached
3. Si MISS → requêter DB, stocker en cache, retourner
```

### Invalidation

- **Temps (TTL)**: Expiration automatique
- **Event-driven**: Invalidation sur écriture (POST/PUT/PATCH/DELETE)

---

## Endpoints Cachés

| Endpoint | Méthode | TTL | Clé Redis |
|----------|---------|-----|-----------|
| `/iot/measurements/latest` | GET | 30s | `iot:measurements:latest` |
| `/iot/stats` | GET | 120s | `iot:stats:global` |
| `/iot/alerts/:id` (update) | PATCH | - | `iot:alerts:*` (invalidation) |
| `/iot/simulate` | POST | - | `iot:measurements:*`, `iot:stats:*` |

---

## Configuration

```javascript
const CACHE_TTL = {
  LATEST_MEASUREMENTS: 30,    // 30 secondes
  SENSORS_LIST: 300,         // 5 minutes
  LOW_BATTERY: 300,          // 5 minutes
  ACTIVE_ALERTS: 60,        // 1 minute
  CONTAINER_STATS: 120       // 2 minutes
};
```

---

## Variables d'environnement

```bash
REDIS_HOST=ecotrack-redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

---

## Implémentation

### CacheService (cacheService.js)

```javascript
class CacheService {
  async get(key)
  async set(key, value, ttlSeconds)
  async del(key)
  async invalidatePattern(pattern)
  async getOrSet(key, fetchFn, ttlSeconds)
}
```

### Utilisation dans le Contrôleur

```javascript
const cacheService = require('../../cacheService');

// Lire depuis cache
const { data, fromCache } = await cacheService.getOrSet(
  'iot:measurements:latest',
  () => measurementService.getLatestMeasurements(),
  30
);

// Invalider sur écriture
await cacheService.invalidatePattern('iot:measurements*');
```

---

## Métriques Cache

### Commandes curl

```bash
# Vérifier connexion Redis
docker exec ecotrack-redis redis-cli ping

# Voir les clés cached
docker exec ecotrack-redis redis-cli keys "iot:*"

# Voir TTL d'une clé
docker exec ecotrack-redis redis-cli ttl iot:measurements:latest

# Stats Redis
docker exec ecotrack-redis redis-cli info stats
```

---

## Logs

### Cache Hit
```
[INFO] Cache hit for key: iot:measurements:latest
```

### Cache Miss
```
[INFO] Cache miss for key: iot:measurements:latest, fetching from DB
```

### Invalidation
```
[INFO] Redis cache invalidated, pattern: iot:alerts:*, count: 3
```

---

## Performance

| Métrique | Avant | Après |
|----------|-------|-------|
| Latence /measurements/latest | ~200ms | ~5ms |
| Requêtes DB/min | 60 | 2 |
| Charge CPU DB | haute | basse |

---

## Troubleshooting

### Cache non utilisé

1. Vérifier que Redis est accessible:
   ```bash
   docker logs ecotrack-service-iot | grep "Redis"
   ```

2. Vérifier que le service est connecté:
   ```bash
   docker exec ecotrack-service-iot node -e "require('./cacheService').get('test')"
   ```

### Données obsolètes

- Vérifier TTL: `redis-cli ttl iot:measurements:latest`
- Forcer invalidation manuelle si nécessaire

### Redis indisponible

Le service continue de fonctionner sans cache (fallback désactivé pour ce service).
