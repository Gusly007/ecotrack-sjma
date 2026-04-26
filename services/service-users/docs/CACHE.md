# Service Users - Cache Redis

## Vue d'ensemble

Le service Users utilise Redis pour cacher les profils utilisateurs, rôles et permissions.

## Stratégie de Cache

### Pattern: Cache-Aside avec Write-Through

```
Lecture: Vérifier cache → HIT retourner | MISS requêter DB → stocker → retourner
Écriture: Mettre à jour DB → Invalider cache
```

---

## Endpoints Cachés

| Ressource | Service | TTL | Clé Redis |
|-----------|---------|-----|-----------|
| Profil utilisateur | userService | 5min | `user:{id}:profile` |
| Liste utilisateurs | userService | 2min | `user:list:{page}` |
| Rôles | roleService | 30min | `roles:all` |
| Permissions par rôle | roleService | 30min | `permissions:{role}` |
| Session utilisateur | userService | 24h | `session:{token}` |

---

## Configuration

```javascript
// TTL par défaut
const DEFAULT_TTL = 300; // 5 minutes

// TTL spécifiques
const SESSION_TTL = 86400; // 24 heures
const ROLES_TTL = 1800; // 30 minutes
```

### Clés Redis

```
user:{id}:profile          # Profil utilisateur
user:{id}:session         # Session
user:{id}:roles           # Rôles utilisateur
user:list:{page}          # Liste paginée
roles:all                 # Tous les rôles
permissions:{roleId}      # Permissions par rôle
zone:list                 # Liste zones
```

---

## Utilisation

### Lecture avec cache

```javascript
import cacheService from './services/cacheService.js';

// Profil utilisateur
const result = await cacheService.getOrSet(
  `user:${id}:profile`,
  () => userRepository.findById(id),
  300 // TTL 5 minutes
);
```

### Invalidation sur écriture

```javascript
// Après mise à jour utilisateur
await cacheService.invalidatePattern(`user:${userId}:*`);

// Après modification rôle
await cacheService.invalidatePattern('roles:*');
await cacheService.invalidatePattern(`user:*:roles*`);
```

---

## Services utilisant le cache

### UserService

```javascript
// Profil utilisateur
async getUserById(id) {
  return cacheService.getOrSet(
    `user:${id}:profile`,
    () => this.repository.findById(id),
    300
  );
}

// Liste utilisateurs
async getUsers(page = 1, limit = 50) {
  return cacheService.getOrSet(
    `user:list:${page}:${limit}`,
    () => this.repository.findAll(page, limit),
    120
  );
}

// Mise à jour → invalidation
async updateUser(id, data) {
  const user = await this.repository.update(id, data);
  await cacheService.invalidatePattern(`user:${id}:*`);
  return user;
}
```

### RoleService

```javascript
// Tous les rôles (cache long)
async getAllRoles() {
  return cacheService.getOrSet(
    'roles:all',
    () => this.repository.findAll(),
    1800 // 30 minutes
  );
}

// Permissions par rôle
async getPermissionsByRole(roleId) {
  return cacheService.getOrSet(
    `permissions:${roleId}`,
    () => this.repository.getPermissionsByRole(roleId),
    1800
  );
}
```

---

## Commandes Debug

```bash
# Voir clés cache
docker exec ecotrack-redis redis-cli keys "user:*"

# TTL d'une clé
docker exec ecotrack-redis redis-cli ttl user:1:profile

# Stats cache
docker exec ecotrack-redis redis-cli info stats

# Vider cache utilisateur
docker exec ecotrack-redis redis-cli DEL user:1:profile user:1:session user:1:roles

# Vider tout le cache users
docker exec ecotrack-redis redis-cli KEYS "user:*" | xargs docker exec ecotrack-redis redis-cli DEL
```

---

## Performance

| Métrique | Avant | Après |
|----------|-------|-------|
| GET /users/:id | ~100ms | ~5ms |
| GET /users | ~200ms | ~15ms |
| GET /roles | ~80ms | ~3ms |
| Cache hit ratio | 0% | ~85% |

---

## Logs

```
[INFO] Redis connected - host: redis, port: 6379
[INFO] Cache hit for key: user:123:profile
[INFO] Cache miss for key: user:456:profile, fetching from DB
[INFO] Redis cache invalidated, pattern: user:123:*, count: 3
```
