# Service Routes - Cache Redis

## Vue d'ensemble

Le service Routes utilise Redis pour cacher les données des tournées et optimiser les performances.

## Stratégie de Cache

### Pattern: Cache-Aside

```
1. Vérifier cache
2. Si HIT → retourner données cached
3. Si MISS → requêter DB, stocker en cache, retourner
```

### Invalidation

- Sur création/mise à jour/suppression de tournée
- Invalidation par pattern

---

## Endpoints Cachés

| Endpoint | Service | TTL | Clé Redis |
|----------|---------|-----|-----------|
| Liste tournées | tourneeService | 5min | `tournee:list:*` |
| Détails tournée | tourneeService | 2min | `tournee:{id}` |
| Optimisation | tourneeService | 5min | `tournee:optimize:{id}` |

---

## Configuration

```javascript
// TTL par défaut
const DEFAULT_TTL = 300; // 5 minutes
```

### Clés Redis

```
tournee:list:{zone}:{statut}    # Liste tournées par zone/statut
tournee:{id}                     # Détails tournée
tournee:optimize:{id}           # Optimisation calculée
tournee:agent:{id}              # Tournées par agent
```

---

## Utilisation

### Lecture avec cache

```javascript
const cacheService = require('./services/cacheService');

const result = await cacheService.getOrSet(
  `tournee:${id}`,
  () => tourneeRepository.findById(id),
  120 // TTL 2 minutes
);

if (result.fromCache) {
  console.log('Données cached');
}
```

### Invalidation sur écriture

```javascript
// Après mise à jour d'une tournée
await cacheService.del(`tournee:${id}`);
await cacheService.invalidatePattern('tournee:*');
```

---

## Services utilisant le cache

### TourneeService

```javascript
// Liste tournées (5 min cache)
getTournées(filters, page, limit)

// Détails tournée (2 min cache)
async getTourneeById(id) {
  return cacheService.getOrSet(
    `tournee:${id}`,
    () => tourneeRepository.findById(id),
    120
  );
}

// Mise à jour (invalidation)
async updateTournee(id, data) {
  // ... update DB
  await cacheService.del(`tournee:${id}`);
  await cacheService.invalidatePattern('tournee:*');
}
```

---

## Commandes Debug

```bash
# Voir clés cache
docker exec ecotrack-redis redis-cli keys "tournee:*"

# TTL d'une clé
docker exec ecotrack-redis redis-cli ttl tournee:1

# Stats Redis
docker exec ecotrack-redis redis-cli info stats | grep -E "keyspace_hits|keyspace_misses"

# Vider cache spécifique
docker exec ecotrack-redis redis-cli DEL tournee:1

# Vider tout le cache tournées
docker exec ecotrack-redis redis-cli KEYS "tournee:*" | xargs docker exec ecotrack-redis redis-cli DEL
```

---

## Performance

| Métrique | Avant | Après |
|----------|-------|-------|
| GET /tournees | ~150ms | ~10ms |
| GET /tournees/:id | ~80ms | ~5ms |
| Requêtes DB/min | 30 | 5 |

---

## Logs

```
[INFO] Redis connected - host: redis, port: 6379
[INFO] Cache hit for key: tournee:123
[INFO] Cache miss for key: tournee:456, fetching from DB
[INFO] Redis cache invalidated, pattern: tournee:*, count: 15
```
