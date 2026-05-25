#  Cache Redis - Service Notification

## Vue d'ensemble

Le service notification utilise **Redis** pour mettre en cache les données fréquemment accédées et coûteuses à calculer. Cela réduit la charge sur PostgreSQL et améliore les performances jusqu'à **25x**.

---

##  Stratégie de cache

### Priorité 1 : Compteur notifications non lues  CRITIQUE

```
Clé Redis          : ecotrack:notifications:unread:{userId}
TTL                : 30 secondes
Fréquence accès    : Très élevée (à chaque chargement page)
Modification       : Faible (change uniquement si nouvelle notif)
Gain performance   : 25x plus rapide
```

**Cas d'usage :**
- Badge compteur UI (affiche le nombre de notifs non lues)
- Endpoint GET `/notifications/unread/count`

**Invalidation :**
- Automatique lors de `createNotification` (API REST)
- Automatique lors de `markAsRead` / `markAllAsRead`
- Automatique via `/internal/emit-ws` — appelé par service-routes après un INSERT direct en base (ex : anomalie agent → `notifyAllStaff`)

**Code :**
```javascript
// Service
const count = await notificationService.getUnreadCountCached(userId);

// Requête HTTP
GET /notifications/unread/count
Authorization: Bearer {token}

// Réponse
{ "unread_count": 5 }
```

---

### Priorité 2 : Types de notifications valides

```
Clé Redis          : ecotrack:notification:types
TTL                : 1 heure (jamais modifié en prod)
Fréquence accès    : Moyenne (à chaque création notif)
Modification       : Jamais (config système)
```

**Matrice TYPE_ROLE_MAP :**
```javascript
{
  ALERTE:  ['GESTIONNAIRE', 'ADMIN'],
  TOURNEE: ['GESTIONNAIRE', 'ADMIN'],
  BADGE:   ['CITOYEN', 'AGENT'],
  SYSTEME: ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN']
}
```

**Utilisation interne :**
```javascript
// Validation lors de création
const types = await notificationService.getValidTypesCached();
if (!types[type]) throw new Error('Invalid type');
```

---

### Priorité 3 : Liste récente de notifications (OPTIONAL)

```
Clé Redis          : ecotrack:notifications:recent:{userId}:page:{page}
TTL                : 10 secondes (très court !)
Fréquence accès    : Moyenne (lors consultation)
Modification       : Élevée (nouvelles notifs)
```

**Endpoint avec pagination :**
```
GET /notifications/list?page=1&limit=20
```

**Réponse :**
```json
{
  "data": [
    {
      "id_notification": 42,
      "titre": "Zone saturée",
      "corps": "Taux 90%",
      "type": "ALERTE",
      "est_lu": false,
      "created_at": "2026-05-07T12:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

** ATTENTION :** TTL court (10s) car invalidation sur CHAQUE nouvelle notification !

---

##  Invalidation du cache

Le cache est **AUTOMATIQUEMENT invalidé** lors de modifications :

| Opération | Caches invalidés |
|-----------|-----------------|
| `createNotification` | `unread:{userId}`, `recent:{userId}:*` |
| `createBulkNotifications` | `unread:{userId1}`, `unread:{userId2}`, etc. |
| `markAsRead` | `unread:{userId}`, `recent:{userId}:*` |
| `markAllAsRead` | `unread:{userId}`, `recent:{userId}:*` |
| `deleteNotification` | `unread:{userId}`, `recent:{userId}:*` |

---

##  Configuration

### Variables d'environnement (.env)

```bash
# Redis connexion
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # (optionnel)
REDIS_DB=0               # (défaut: 0)
```

### Docker Compose

```yaml
redis:
  image: redis:7-alpine
  container_name: ecotrack-redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  networks:
    - ecotrack
  restart: unless-stopped
```

---

##  Metrics & Monitoring

### Logs

Le cache produit des logs détaillés (avec Pino) :

```json
{
  "level": 20,
  "time": 1725436496789,
  "key": "ecotrack:notifications:unread:42",
  "msg": "Cache hit"
}

{
  "level": 20,
  "time": 1725436496800,
  "key": "ecotrack:notifications:unread:42",
  "msg": "Cache miss - fetching from source"
}

{
  "level": 20,
  "time": 1725436496810,
  "userId": 42,
  "msg": "User notification cache invalidated"
}
```

### Redis CLI

```bash
# Connexion
redis-cli

# Vérifier une clé
GET ecotrack:notifications:unread:42

# Voir toutes les clés
KEYS ecotrack:notifications:*

# Voir le TTL restant
TTL ecotrack:notifications:unread:42

# Supprimer une clé
DEL ecotrack:notifications:unread:42

# Vider tout le cache
FLUSHDB
```

---

##  Cas d'erreur & Fallback

Si **Redis n'est pas disponible** :

```
1. Service démarre normalement
2. Log : "Redis cache initialization failed - running without cache"
3. Les requêtes continuent à fonctionner 
4. Pas de cache = performances dégradées mais OK
```

**Code du fallback :**
```javascript
try {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
} catch (err) {
  logger.warn('Redis GET error - fallback to source');
}
// Retour direct à la source (BDD)
return await fetchFn();
```

---

##  Impact estimé

| Métrique | Sans cache | Avec cache | Gain |
|----------|-----------|-----------|------|
| **Compteur non lues** | 50ms | 2ms | **25x** ⚡ |
| **Types valides** | 20ms | 1ms | **20x** |
| **Charge BDD** | 100% | ~30-40% | **60-70%** ↓ |
| **Réponse moyenne** | 100ms | 10ms | **10x** |

---

##  Tests

### Test du cache manuellement

```bash
# 1. Démarrer le service avec Redis
npm start

# 2. Créer une notification
curl -X POST http://localhost:3014/api/V1/notifications \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "id_utilisateur": 42,
    "type": "ALERTE",
    "titre": "Test cache",
    "corps": "Vérification cache"
  }'

# 3. Vérifier le cache Redis
redis-cli GET ecotrack:notifications:unread:42

# 4. Appeler l'endpoint de compteur
curl http://localhost:3014/api/V1/notifications/unread/count \
  -H "Authorization: Bearer {token}"
# → Cache hit (2ms)

# 5. Appeler à nouveau
curl http://localhost:3014/api/V1/notifications/unread/count
# → Cache hit (2ms) - même résultat

# 6. Attendre 30s
sleep 30

# 7. Appeler à nouveau
# → Cache miss (recalculé) - nouveau compteur
```

---

## Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `src/db/redis-client.js` | Connexion Redis |
| `src/utils/cache.js` | Service de cache (getOrCache, invalidate, etc.) |
| `src/repositories/notification.repository.js` | Méthodes BDD (getUnreadCount, etc.) |
| `src/services/notification.service.js` | Méthodes avec cache (getUnreadCountCached, etc.) |
| `src/controllers/notification.controller.js` | Endpoints HTTP |
| `index.js` | Initialisation Redis au démarrage |

---

---

##  Support

Logs du cache :
```bash
# Voir tous les logs du cache
docker-compose logs -f service-notification | grep "Cache"

# Voir les cache hits/misses
docker-compose logs -f service-notification | grep -E "Cache (hit|miss)"
```
