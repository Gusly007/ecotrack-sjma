# Architecture — service-notification-gestionnaire-admin

## Vue d'ensemble

Le service remplit **deux responsabilités distinctes** :

1. **API HTTP REST** — gestion CRUD des notifications (lecture, marquage, suppression)
2. **Serveur WebSocket temps réel** — pousse les notifications instantanément vers les navigateurs des gestionnaires et admins

Ces deux chemins convergent sur le **même serveur HTTP** (`http.createServer(app)`), ce qui permet à Socket.IO de coexister avec Express sur le même port (3016).

```
┌──────────────────────────────────────────────────────────────────┐
│                  service-notification (port 3016)                │
│                                                                  │
│  ┌─────────────────────────┐   ┌──────────────────────────────┐  │
│  │   Express (HTTP/REST)   │   │   Socket.IO (WebSocket)      │  │
│  │                         │   │                              │  │
│  │  /api/V1/notifications/*   │   │  /ws/notifications  → notif  │  │
│  │  /api/V1/admin/notif/*     │   │  /ws/admin          → admin  │  │
│  │  /internal/emit-ws      │   │                              │  │
│  │  /health  /metrics      │   │  JWT auth par middleware     │  │
│  └─────────────────────────┘   └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
           ▲                                  ▲
           │ HTTP (REST)                      │ WS upgrade proxié
           └──────────────┬───────────────────┘
                          │
                    api-gateway :3000
                    /api/V1/* → HTTP
                    /ws/*  → WS upgrade (server.on 'upgrade')
```

---

## Flux de notification complet — agent signale une anomalie

Le flux le plus courant dans le système :

```
Agent (mobile)
    │
    │ POST /api/V1/routes/tournees/:id/anomalie
    ▼
service-routes :3012
    │
    ├─ INSERT INTO anomalie (DB)
    │
    ├─ notifyAllStaff(db, { type:'ALERTE', titre, corps })
    │       │
    │       ├─ SELECT id_utilisateur FROM utilisateur
    │       │  WHERE role_par_defaut IN ('GESTIONNAIRE','ADMIN')
    │       │  AND est_active = true
    │       │
    │       ├─ INSERT INTO notification × N (DB direct)
    │       │
    │       └─ POST /internal/emit-ws   ← fire-and-forget axios
    │               │
    ▼               ▼
    OK        service-notification :3016
              /internal/emit-ws
                    │
                    ├─ WebSocketNotifService.emitToUser(userId, notif)
                    │       → io.to('user:{id}').emit('notification:new', notif)
                    │
                    └─ notifService._invalidateUserCache(userId)
                            → DEL ecotrack:notifications:unread:{id}
                            → DEL ecotrack:notifications:recent:{id}:*
```

**Côté navigateur (gestionnaire/admin) :**

```
NotificationContext.jsx
    │
    ├─ Socket.IO reçoit 'notification:new'
    │       │
    │       ├─ setUnreadCount(prev => prev + 1)   ← badge +1 immédiat
    │       ├─ playChime()                          ← son notification
    │       └─ dispatchEvent('notifications-refresh') ← recharge la liste
    │
    └─ DesktopLayout.jsx consomme wsUnreadCount
            → badge de la cloche mis à jour en temps réel
```

**Chemin de secours (si WS non connecté) :**

```
Toutes les 15 secondes :
    NotificationContext → GET /api/V1/notifications/unread/count
    → count > baseline ET wsAlive=false
    → setUnreadCount(count) + playChime()
```

---

## Architecture en couches — chemin HTTP

```
Client HTTP / Kafka / service-routes (emit-ws)
       │
       ▼
   index.js          ← Point d'entrée : Express + Socket.IO + Kafka + Prometheus
       │
  ┌────▼─────────────────────────────────────────┐
  │              MIDDLEWARE CHAIN                │
  │  Helmet → CORS → JSON → Logger → RateLimit  │
  └────┬─────────────────────────────────────────┘
       │
  ┌────▼───────────────────────────────────────────────────────┐
  │                        ROUTES                              │
  │  /api/V1/notifications/*      → notification.route.js         │
  │  /api/V1/admin/notifications/* → adminNotification.route.js   │
  │  /internal/emit-ws         → inline (index.js)             │
  └────┬───────────────────────────────────────────────────────┘
       │
  ┌────▼──────────────────────────────────────────┐
  │         MIDDLEWARE DE ROUTE (par endpoint)    │
  │  authenticateToken → requirePermission        │
  │      → validate*(...)                         │
  └────┬──────────────────────────────────────────┘
       │
  ┌────▼──────────────────────┐
  │       CONTROLLER          │
  │  notification.controller  │
  └────┬──────────────────────┘
       │
  ┌────▼──────────────────────┐
  │        SERVICE            │
  │  notification.service     │  ← Logique métier, logging, cache
  └────┬──────────────────────┘
       │
       ├──────────────────────────────────────────────┐
       │                                              │
  ┌────▼──────────────────┐           ┌──────────────▼──────────────┐
  │      REPOSITORY        │           │         CACHE               │
  │  notification.repo     │           │  Redis TTL 30s (count)      │
  │  (SQL via pg pool)     │           │  Redis TTL 10s (liste)      │
  └────┬──────────────────┘           └─────────────────────────────┘
       │
  ┌────▼──────────────────────┐
  │       POSTGRESQL          │
  └───────────────────────────┘
```

---

## Démarrage du service (`index.js`)

Ordre de démarrage après `server.listen()` :

```
1. Express + middlewares globaux
2. server.listen(PORT)        ← Socket.IO attaché avant listen
3. testConnection()           → PostgreSQL (bloquant si KO)
4. createRedisClient()        → Redis       (dégradé si KO)
5. createWebSocketAdminService(server)  → /ws/admin
6. createWebSocketNotifService(server)  → /ws/notifications
7. kafkaConsumer.connect()    → Kafka       (dégradé si KO)
8. kafkaAdminProducer.connect()→ Kafka      (dégradé si KO)
9. healthMonitorService.start()
```

> Socket.IO est instancié **avant** `server.listen()` — il s'attache au serveur HTTP brut pour intercepter les upgrades WebSocket dès le démarrage.

---

## Middleware

| Fichier | Rôle | Ordre |
|---------|------|-------|
| `cors.js` | Origines autorisées — tout en dev, `ALLOWED_ORIGINS` en prod | 1 |
| `request-logger.js` | Morgan (prod) / console formatée (test) | 2 |
| `rateLimit.js` | 100 req/15min par IP (général) | 3 |
| `auth.js` | Vérifie le JWT Bearer, peuple `req.user` | par route |
| `rbac.js` | Contrôle d'accès GESTIONNAIRE/ADMIN | par route |
| `validation.js` | Valide le body avant le controller | par route |
| `error-handler.js` | Transforme toute erreur en JSON normalisé | dernier |

---

## Routes HTTP

### Notifications gestionnaire

```
GET    /api/V1/notifications/list          auth → own       → controller.list
GET    /api/V1/notifications/unread/count  auth → own       → controller.unreadCount  (cachée Redis 30s)
PATCH  /api/V1/notifications/read-all     auth → own        → controller.markAllAsRead
PATCH  /api/V1/notifications/:id/read     auth → own        → controller.markAsRead
DELETE /api/V1/notifications/:id          auth → own        → controller.delete
```

### Notifications admin

```
GET    /api/V1/admin/notifications         auth → ADMIN     → adminController.list
GET    /api/V1/admin/notifications/stats   auth → ADMIN     → adminController.stats
PATCH  /api/V1/admin/notifications/:id/read auth → ADMIN   → adminController.markAsRead
PATCH  /api/V1/admin/notifications/read-all auth → ADMIN   → adminController.markAllAsRead
```

### Endpoint interne (service-to-service)

```
POST   /internal/emit-ws    x-internal-secret requis    → WS emit + invalidation cache
```

Voir [WEBSOCKET.md](./WEBSOCKET.md) pour le détail de cet endpoint.

---

## Repository — SQL

Seul fichier qui accède directement à PostgreSQL via le pool.

**Validation type/rôle en base (CTE) :**
```sql
WITH target_user AS (
  SELECT id_utilisateur, role_par_defaut
  FROM utilisateur WHERE id_utilisateur = $1
)
INSERT INTO notification (type, titre, corps, id_utilisateur)
SELECT $2, $3, $4, tu.id_utilisateur
FROM target_user tu
WHERE tu.role_par_defaut = ANY($5::text[])
RETURNING *
```

Si `rowCount === 0` → distinction 404 (utilisateur absent) vs 422 (rôle incompatible).

---

## RBAC — Matrice complète

```
┌──────────────────────────┬──────────────┬───────┐
│ Permission               │ GESTIONNAIRE │ ADMIN │
├──────────────────────────┼──────────────┼───────┤
│ notifications:own        │      ✅      │   ✅  │
│ notifications:create     │      ❌      │   ✅  │
│ notifications:bulk       │      ❌      │   ✅  │
└──────────────────────────┴──────────────┴───────┘
```

---

## Connexions externes

| Service | Protocole | Usage |
|---------|-----------|-------|
| PostgreSQL | TCP 5432 | Persistance des notifications |
| Redis | TCP 6379 | Cache compteur (30s) et liste (10s) |
| Kafka (consumer) | TCP 9092 | Alertes IoT + signalements citoyens |
| Kafka (producer) | TCP 9092 | Publication `ecotrack.admin.notifications` |
| api-gateway | WS proxy `/ws/*` | Pont navigateur → Socket.IO |

---

## Gestion de la dégradation

```
Redis DOWN  → warning loggé, requêtes passent directement en DB
Kafka DOWN  → warning loggé, l'API HTTP continue, plus de notifs automatiques
DB DOWN     → service refuse les requêtes (connexion PostgreSQL obligatoire)
WS KO       → frontend bascule sur polling HTTP toutes les 15 secondes
```

---

## Métriques Prometheus

| Métrique | Type | Labels |
|----------|------|--------|
| `http_requests_total` | Counter | `method`, `route`, `status` |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status` |

Buckets : `[0.05, 0.1, 0.3, 0.5, 1, 2, 5]` secondes.

---

## Voir aussi

- [WEBSOCKET.md](./WEBSOCKET.md) — Architecture WebSocket temps réel, proxy gateway, frontend
- [CACHE.md](./CACHE.md) — Stratégie Redis et invalidation
- [KAFKA.md](./KAFKA.md) — Consumer Kafka alertes IoT et signalements
