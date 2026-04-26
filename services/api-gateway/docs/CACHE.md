# API Gateway - Cache Redis

## Vue d'ensemble

L'API Gateway utilise Redis pour cacher les données au niveau du point d'entrée unique. Cela permet de réduire la charge sur les services backend et améliorer les temps de réponse.

**cacheService.js**: `src/services/cacheService.js`

---

## Stratégie de Cache

### Pattern: Cache-Aside

```
Lecture: Vérifier cache → HIT retourner | MISS requêter service → stocker → retourner
Écriture: Mettre à jour service → Invalider cache
```

---

## Données à Cacher

| Ressource | TTL | Clé Redis |
|-----------|-----|-----------|
| Liste zones | 30 min | `apigw:zones` |
| Métadonnées conteneurs | 5 min | `apigw:containers:meta` |
| Profil utilisateur (/me) | 5 min | `apigw:user:{id}:profile` |
| Statuts conteneurs | 2 min | `apigw:containers:status` |
| KPIs agrégés | 1 min | `apigw:kpi:dashboard` |

---

## Configuration

```javascript
const CACHE_TTL = {
  DEFAULT: 300,        // 5 minutes
  ZONES: 1800,         // 30 minutes
  CONTAINERS_META: 300, // 5 minutes
  CONTAINERS_STATUS: 120, // 2 minutes
  KPI: 60             // 1 minute
};
```

### Clés Redis

```
apigw:zones                  # Liste zones
apigw:containers:meta        # Métadonnées conteneurs
apigw:containers:status     # Statuts conteneurs
apigw:user:{id}:profile     # Profil utilisateur
apigw:kpi:dashboard         # KPIs globaux
```

---

## Implémentation

### 1. Middleware de Cache

```javascript
import cacheService from './services/cacheService.js';

const PUBLIC_GET_PATHS = ['/zones', '/containers/meta', '/health'];
const CACHE_TTL_MAP = {
  '/zones': 1800,
  '/containers/meta': 300,
  '/containers/status': 120,
  '/kpi': 60
};

app.use(async (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/auth')) return next();
  if (!PUBLIC_GET_PATHS.some(p => req.path.startsWith(p))) return next();

  const cacheKey = `apigw:${req.path}:${JSON.stringify(req.query)}`;
  const cached = await cacheService.get(cacheKey);
  
  if (cached) {
    return res.set('X-Cache', 'HIT').json(cached);
  }
  
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode === 200) {
      const ttl = CACHE_TTL_MAP[req.path] || CACHE_TTL.DEFAULT;
      cacheService.set(cacheKey, data, ttl);
    }
    return originalJson(data);
  };
  
  next();
});
```

### 2. Invalidation sur Write

```javascript
// Après création/update conteneur
await cacheService.invalidatePattern('apigw:containers:*');

// Après mise à jour utilisateur
await cacheService.invalidatePattern(`apigw:user:${userId}:*`);

// Après modification zone
await cacheService.invalidatePattern('apigw:zones*');
```

---

## Commandes Debug

```bash
# Voir clés cache
docker exec ecotrack-redis redis-cli keys "apigw:*"

# TTL d'une clé
docker exec ecotrack-redis redis-cli ttl apigw:zones

# Stats cache
docker exec ecotrack-redis redis-cli info stats

# Vider cache
docker exec ecotrack-redis redis-cli KEYS "apigw:*" | xargs docker exec ecotrack-redis redis-cli DEL
```

---

## Différence avec Cache par Service

| Aspect | Cache par Service | Cache API Gateway |
|--------|-------------------|------------------|
| Portée | Données du service | Cross-service |
| Latence | Plus proche des données | Plus proche du client |
| Invalidation | Facile | Complexe |
| Use case | Données applicatives | Données de référence |

---

## Logs

```
[INFO] Redis connected - host: redis, port: 6379
[INFO] Cache hit for key: apigw:zones
[INFO] Cache miss for key: apigw:containers:meta, fetching from backend
[INFO] Redis cache invalidated, pattern: apigw:containers:*, count: 5
```
