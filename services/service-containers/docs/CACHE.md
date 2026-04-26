# Service Containers - Cache Redis

## Vue d'ensemble

Le service Containers utilise Redis pour cacher les données des conteneurs et zones.

## Stratégie de Cache

### Pattern: Cache-Aside

```
Lecture: Vérifier cache → HIT retourner | MISS requêter DB → stocker → retourner
Écriture: Mettre à jour DB → Invalider cache
```

---

## Endpoints Cachés

| Ressource | Service | TTL | Clé Redis |
|-----------|---------|-----|-----------|
| Liste conteneurs | containerService | 2min | `containers:list:{page}` |
| Détails conteneur | containerService | 5min | `container:{id}` |
| Conteneurs par zone | containerService | 5min | `containers:zone:{zoneId}` |
| GeoJSON tous conteneurs | containerService | 5min | `containers:geo:all` |
| Zones | containerService | 30min | `zones:all` |

---

## Configuration

```javascript
// TTL par défaut
const CACHE_TTL = {
  CONTAINER_LIST: 120,    // 2 minutes
  CONTAINER_DETAIL: 300, // 5 minutes
  CONTAINER_GEO: 300,    // 5 minutes
  ZONES: 1800            // 30 minutes
};
```

### Clés Redis

```
containers:list:{page}:{limit}    # Liste paginée
container:{id}                   # Détails conteneur
containers:zone:{zoneId}          # Conteneurs par zone
containers:geo:all                # GeoJSON global
zones:all                        # Toutes les zones
```

---

## Utilisation

### Lecture avec cache

```javascript
const cacheService = require('../services/cacheService');

const result = await cacheService.getOrSet(
  `container:${id}`,
  () => containerRepository.findById(id),
  300 // TTL 5 minutes
);

if (result.fromCache) {
  console.log('Données cached');
}
```

### Invalidation sur écriture

```javascript
// Après création conteneur
await cacheService.invalidatePattern('containers:list:*');

// Après mise à jour
await cacheService.del(`container:${id}`);
await cacheService.invalidatePattern('containers:list:*');

// Après suppression
await cacheService.del(`container:${id}`);
await cacheService.invalidatePattern('containers:*');
```

---

## Services utilisant le cache

### ContainerService

```javascript
// Liste conteneurs (2 min cache)
async getContainers(page, limit, filters) {
  return cacheService.getOrSet(
    `containers:list:${page}:${limit}`,
    () => containerRepository.findAll(page, limit, filters),
    120
  );
}

// Détails conteneur (5 min cache)
async getContainerById(id) {
  return cacheService.getOrSet(
    `container:${id}`,
    () => containerRepository.findById(id),
    300
  );
}

// Conteneurs par zone (5 min cache)
async getContainersByZone(zoneId) {
  return cacheService.getOrSet(
    `containers:zone:${zoneId}`,
    () => containerRepository.findByZone(zoneId),
    300
  );
}

// GeoJSON tous conteneurs (5 min cache)
async getAllContainersGeoJSON() {
  return cacheService.getOrSet(
    'containers:geo:all',
    () => containerRepository.findAllGeoJSON(),
    300
  );
}

// Création → invalidation
async createContainer(data) {
  const container = await containerRepository.create(data);
  await cacheService.invalidatePattern('containers:list:*');
  return container;
}
```

---

## Commandes Debug

```bash
# Voir clés cache
docker exec ecotrack-redis redis-cli keys "containers:*"

# TTL d'une clé
docker exec ecotrack-redis redis-cli ttl container:1

# Stats cache
docker exec ecotrack-redis redis-cli info stats

# Vider cache conteneurs
docker exec ecotrack-redis redis-cli KEYS "containers:*" | xargs docker exec ecotrack-redis redis-cli DEL
```

---

## Performance

| Métrique | Avant | Après |
|----------|-------|-------|
| GET /containers | ~150ms | ~10ms |
| GET /containers/:id | ~50ms | ~3ms |
| GET /containers/geo | ~200ms | ~15ms |
| Cache hit ratio | 0% | ~80% |

---

## Logs

```
[INFO] Redis connected - host: redis, port: 6379
[INFO] Cache hit for key: container:123
[INFO] Cache miss for key: container:456, fetching from DB
[INFO] Redis cache invalidated, pattern: containers:list:*, count: 5
```
