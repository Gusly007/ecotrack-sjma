# Phase 5 - Cache, Middleware & WebSocket

## Objectifs
- Améliorer les performances avec caching
- Sécuriser les endpoints avec validation et rate limiting
- Permettre les mises à jour temps réel avec WebSocket

## Installation

```bash
npm install express-rate-limit socket.io node-cache joi
```

## Cache Service

Le cache utilise `node-cache` en mémoire avecTTL configurable.

### Configuration

```javascript
// TTL par défaut: 300 secondes (5 min)
// checkperiod: 60 secondes
```

### Utilisation dans les Controllers

```javascript
const cacheService = require('./services/cacheService');

static async getEndpoint(req, res) {
  const cacheKey = 'unique:key';
  
  const data = await cacheService.getOrSet(
    cacheKey,
    () => Service.getData(),  // Fonction qui récupère les données
    180  // TTL en secondes
  );
  
  res.json({ success: true, data });
}
```

### TTL recommandés par endpoint

| Endpoint | TTL | Raison |
|----------|-----|--------|
| `/dashboard` | 180s (3 min) | Données KPIs changent souvent |
| `/realtime` | 30s | Temps réel |
| `/heatmap` | 600s (10 min) | Rarement changé |
| `/aggregations` | 300s (5 min) | Agrégations coûteuses |
| `/performance/dashboard` | 180s (3 min) | KPIs |
| `/ml/predict` | 0 (no cache) | Résultat unique |

### Invalidation

```javascript
// Invalider par pattern
cacheService.invalidate('dashboard:*');

// Vider tout le cache
cacheService.clear();
```

### Warm-up (optionnel)

Au démarrage du service pour précharger les données fréquentes:

```javascript
async warmUp() {
  await cacheService.getOrSet('dashboard:week', 
    () => DashboardService.getDashboardData('week'), 180);
}
```

## Middleware

### Rate Limiting

```javascript
const { generalLimiter, reportLimiter, mlLimiter } = require('./middleware/rateLimitMiddleware');

// Appliquer sur les routes
router.get('/endpoint', generalLimiter, controller.method);
router.post('/reports', reportLimiter, controller.method);
router.post('/ml/predict', mlLimiter, controller.method);
```

**Limiteurs disponibles:**
| Limiter | Fenêtre | Requêtes max |
|---------|---------|---------------|
| generalLimiter | 15 min | 100 |
| reportLimiter | 1 heure | 10 |
| mlLimiter | 15 min | 50 |

### Validation Joi

```javascript
const ValidationMiddleware = require('./middleware/validationMiddleware');

// Validation des query params
router.get('/dashboard', ValidationMiddleware.validateDashboardQuery(), controller);

// Validation du body
router.post('/predict', ValidationMiddleware.validatePrediction(), controller);

// Validation date range
router.get('/data', ValidationMiddleware.validateDateRange(), controller);
```

**Schemas disponibles:**
- `validateDashboardQuery()` - period: day|week|month|quarter|year
- `validateDateRange()` - startDate, endDate (ISO)
- `validateReportRequest()` - format, reportType, email
- `validatePrediction()` - containerId, daysAhead, includeWeather

## Cache Service

```javascript
const cacheService = require('./services/cacheService');

// Get or set avec TTL
const data = await cacheService.getOrSet('key', fetchFn, ttl);

// Invalider par pattern
cacheService.invalidate('dashboard:*');

// Stats
cacheService.getStats();
```

**Configuration:**
- TTL par défaut: 300 secondes (5 min)
- checkperiod: 60 secondes

## WebSocket Service

```javascript
const WebSocketService = require('./services/websocketService');

// Initialiser avec le serveur HTTP
const wsService = new WebSocketService(httpServer);

// Émettre des mises à jour
wsService.emitDashboardUpdate(data);
wsService.emitAlert(alert);
wsService.emitContainerUpdate(containerId, data);

// Diffusion globale
wsService.broadcast('event', data);
```

**Événements disponibles:**
| Événement | Description |
|-----------|-------------|
| `dashboard:update` | Mise à jour du dashboard |
| `alert:new` | Nouvelle alerte |
| `container:update` | Mise à jour conteneur |

**Souscriptions client:**
```javascript
socket.emit('subscribe:dashboard');
socket.emit('subscribe:alerts');
socket.emit('subscribe:container', containerId);
```

## Docker

**Services ajoutés:**
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

## Tests

```bash
npm test
```

## API Documentation

Swagger disponible sur: `/api-docs`
