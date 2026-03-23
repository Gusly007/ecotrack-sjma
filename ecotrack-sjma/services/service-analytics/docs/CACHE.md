# Service Analytics - Cache Redis

## Vue d'ensemble

Le service Analytics utilise Redis pour cacher les données analytiques: dashboards, KPIs, agrégations et données heatmap.

**cacheService.js existant**: `src/services/cacheService.js` (avec fallback NodeCache)

---

## Stratégie de Cache

### Pattern: Cache-Aside avec fallback

```
1. Vérifier Redis
2. Si HIT → retourner données cached
3. Si MISS → requêter DB, stocker en cache, retourner
4. Si Redis indisponible → fallback NodeCache (in-memory)
```

---

## Endpoints Cachés

| Ressource | Controller | TTL | Clé Redis |
|-----------|------------|-----|-----------|
| Dashboard global | dashboardController | 3 min | `dashboard:{period}` |
| KPIs agrégés | dashboardController | 3 min | `dashboard:kpis:{period}` |
| Heatmap | dashboardController | 15 min | `analytics:heatmap` |
| Stats conteneurs | dashboardController | 5 min | `analytics:containers:stats` |
| Performance agents | performanceController | 5 min | `performance:agents:{period}` |
| Performance environnementale | performanceController | 5 min | `performance:env:{period}` |
| Agrégations | aggregationController | 5 min | `aggregations:{type}:{period}` |

---

## Configuration

```javascript
const CACHE_TTL = {
  DASHBOARD: 180,         // 3 minutes
  KPIs: 180,            // 3 minutes
  HEATMAP: 900,         // 15 minutes
  CONTAINERS_STATS: 300, // 5 minutes
  PERFORMANCE: 300,     // 5 minutes
  AGGREGATIONS: 300     // 5 minutes
};
```

### Clés Redis

```
dashboard:week                # Dashboard hebdomadaire
dashboard:month              # Dashboard mensuel
dashboard:kpis:week           # KPIs hebdomadaire
analytics:heatmap            # Données heatmap
analytics:containers:stats  # Stats conteneurs
performance:agents:week      # Performance agents
performance:env:week        # Performance environnementale
aggregations:zone:week       # Agrégations par zone
```

---

## Implémentation

### 1. DashboardController

```javascript
// GET /api/analytics/dashboard
static async getDashboard(req, res) {
  const { period = 'week' } = req.query;
  const cacheKey = `dashboard:${period}`;

  const { data, fromCache } = await cacheService.getOrSet(
    cacheKey,
    async () => {
      const [dashboardData, performanceData] = await Promise.all([
        DashboardService.getDashboardData(period),
        PerformanceService.getCompleteDashboard(period)
      ]);
      return { ...dashboardData, agents: performanceData.agents, ... };
    },
    180 // TTL: 3 minutes
  );

  res.json({ data, fromCache });
}

// GET /api/analytics/heatmap
static async getHeatmap(req, res) {
  const { data, fromCache } = await cacheService.getOrSet(
    'analytics:heatmap',
    () => DashboardService.getHeatmapData(),
    900 // TTL: 15 minutes
  );

  res.json({ data, fromCache });
}
```

### 2. PerformanceController

```javascript
// GET /api/analytics/performance/agents
async getAgentPerformance(req, res) {
  const { period = 'week' } = req.query;
  const cacheKey = `performance:agents:${period}`;

  const { data, fromCache } = await cacheService.getOrSet(
    cacheKey,
    () => PerformanceService.getAgentPerformance(period),
    300
  );

  res.json({ data, fromCache });
}
```

### 3. AggregationController

```javascript
// GET /api/analytics/aggregations/:type
async getAggregations(req, res) {
  const { type } = req.params;
  const { period = 'week' } = req.query;
  const cacheKey = `aggregations:${type}:${period}`;

  const { data, fromCache } = await cacheService.getOrSet(
    cacheKey,
    () => AggregationService.getAggregations(type, period),
    300
  );

  res.json({ data, fromCache });
}

// POST /api/analytics/aggregations (invalidation)
async createAggregation(req, res) {
  const result = await AggregationService.createAggregation(req.body);
  // Invalider le cache après création
  await cacheService.invalidatePattern('aggregations:*');
  res.json(result);
}
```

---

## Fallback NodeCache

Si Redis est indisponible, le service utilise NodeCache comme fallback:

```javascript
// Dans cacheService.js
const NodeCache = require('node-cache');
this.fallbackCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false
});
```

---

## Commandes Debug

```bash
# Voir clés cache
docker exec ecotrack-redis redis-cli keys "dashboard:*"
docker exec ecotrack-redis redis-cli keys "analytics:*"
docker exec ecotrack-redis redis-cli keys "performance:*"

# TTL d'une clé
docker exec ecotrack-redis redis-cli ttl dashboard:week

# Stats cache
docker exec ecotrack-redis redis-cli info stats

# Vider cache analytics
docker exec ecotrack-redis redis-cli KEYS "dashboard:*" | xargs docker exec ecotrack-redis redis-cli DEL
docker exec ecotrack-redis redis-cli KEYS "analytics:*" | xargs docker exec ecotrack-redis redis-cli DEL
```

---

## Performance

| Métrique | Avant | Après |
|----------|-------|-------|
| GET /dashboard | ~500ms | ~20ms |
| GET /heatmap | ~800ms | ~50ms |
| GET /performance/agents | ~300ms | ~15ms |
| Cache hit ratio | 0% | ~75% |

---

## Logs

```
[INFO] Redis connected - host: redis, port: 6379
[INFO] Cache hit for key: dashboard:week
[INFO] Cache miss for key: analytics:heatmap, fetching from DB
[INFO] Redis cache invalidated, pattern: aggregations:*, count: 5
[WARN] Redis connection failed, using in-memory fallback
```

---

## Métriques Prometheus

```javascript
// Métriques cache (à implémenter)
const cacheHitCounter = new Counter({
  name: 'cache_hits_total',
  help: 'Nombre de cache hits',
  labelNames: ['service', 'key_pattern'],
  registers: [register]
});

const cacheMissCounter = new Counter({
  name: 'cache_misses_total',
  help: 'Nombre de cache misses',
  labelNames: ['service', 'key_pattern'],
  registers: [register]
});
```
