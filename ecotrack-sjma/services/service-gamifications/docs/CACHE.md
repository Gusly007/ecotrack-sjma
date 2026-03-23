# Service Gamifications - Cache Redis

## Vue d'ensemble

Le service Gamifications utilise Redis pour cacher les données de gamification: classements, badges, défis et points utilisateurs.

**cacheService.js existant**: `src/services/cacheService.js`

---

## Stratégie de Cache

### Pattern: Cache-Aside

```
Lecture: Vérifier cache → HIT retourner | MISS requêter DB → stocker → retourner
Écriture: Mettre à jour DB → Invalider cache
```

---

## Endpoints à Cacher

| Ressource | TTL | Clé Redis | Priorité |
|-----------|-----|-----------|----------|
| Classement global | 5 min | `gamification:leaderboard` | Haute |
| Points utilisateur | 10 min | `gamification:user:{id}:points` | Haute |
| Liste badges | 1h | `gamification:badges` | Basse |
| Défis actifs | 5 min | `gamification:defis:active` | Moyenne |
| Stats utilisateur | 5 min | `gamification:user:{id}:stats` | Moyenne |

---

## Configuration

```javascript
const CACHE_TTL = {
  LEADERBOARD: 300,      // 5 minutes
  USER_POINTS: 600,     // 10 minutes
  BADGES_LIST: 3600,     // 1 heure
  ACTIVE_DEFIS: 300,     // 5 minutes
  USER_STATS: 300       // 5 minutes
};
```

### Clés Redis

```
gamification:leaderboard              # Classement global
gamification:user:{id}:points        # Points utilisateur
gamification:user:{id}:stats         # Stats utilisateur
gamification:badges                  # Liste badges
gamification:badges:user:{id}        # Badges utilisateur
gamification:defis:active           # Défis actifs
gamification:defis:{id}              # Détails défi
```

---

## Implémentation

### 1. Utilisation dans le Controller

```javascript
import cacheService from '../services/cacheService.js';

// Classement global
const { data, fromCache } = await cacheService.getOrSet(
  'gamification:leaderboard',
  () => classementService.getGlobalRanking(),
  300 // 5 min TTL
);

// Points utilisateur
const { data, fromCache } = await cacheService.getOrSet(
  `gamification:user:${userId}:points`,
  () => pointsService.getUserPoints(userId),
  600 // 10 min TTL
);
```

### 2. Invalidation sur écriture

```javascript
// Après gain/perte de points
await cacheService.invalidatePattern(`gamification:user:${userId}:*`);

// Après obtention badge
await cacheService.invalidatePattern('gamification:badges:*');
await cacheService.invalidatePattern(`gamification:user:${userId}:*`);

// Après modification défi
await cacheService.invalidatePattern('gamification:defis:*');
```

---

## Services à modifier

### ClassementController

```javascript
// GET /classement
async getClassement(req, res) {
  const { data, fromCache } = await cacheService.getOrSet(
    'gamification:leaderboard',
    () => this.classementService.getGlobalRanking(),
    300
  );
  res.json({ data, fromCache });
}
```

### PointsService

```javascript
// getUserPoints(id)
async getUserPoints(userId) {
  const result = await cacheService.getOrSet(
    `gamification:user:${userId}:points`,
    () => this.repository.getUserPoints(userId),
    600
  );
  return result;
}

// addPoints(userId, amount)
async addPoints(userId, amount) {
  const points = await this.repository.addPoints(userId, amount);
  await cacheService.invalidatePattern(`gamification:user:${userId}:*`);
  await cacheService.invalidatePattern('gamification:leaderboard');
  return points;
}
```

### BadgesController

```javascript
// GET /badges
async getBadges(req, res) {
  const { data, fromCache } = await cacheService.getOrSet(
    'gamification:badges',
    () => this.badgeService.getAllBadges(),
    3600
  );
  res.json({ data, fromCache });
}
```

---

## Commandes Debug

```bash
# Voir clés cache
docker exec ecotrack-redis redis-cli keys "gamification:*"

# TTL d'une clé
docker exec ecotrack-redis redis-cli ttl gamification:leaderboard

# Stats cache
docker exec ecotrack-redis redis-cli info stats

# Vider cache gamification
docker exec ecotrack-redis redis-cli KEYS "gamification:*" | xargs docker exec ecotrack-redis redis-cli DEL
```

---

## Performance

| Métrique | Avant | Après (estimé) |
|----------|-------|-----------------|
| GET /classement | ~150ms | ~10ms |
| GET /badges | ~100ms | ~5ms |
| GET /user/:id/points | ~50ms | ~5ms |
| Cache hit ratio | 0% | ~70% |

---

## Logs

```
[INFO] Redis connected - host: redis, port: 6379
[INFO] Cache hit for key: gamification:leaderboard
[INFO] Cache miss for key: gamification:user:123:points, fetching from DB
[INFO] Redis cache invalidated, pattern: gamification:user:123:*, count: 2
```
