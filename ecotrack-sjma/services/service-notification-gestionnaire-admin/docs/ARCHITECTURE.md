# Architecture — service-notification-gestionnaire

## Vue d'ensemble

Le service suit une architecture **en couches** (Layered Architecture) avec une séparation stricte des responsabilités. Chaque requête HTTP traverse la chaîne suivante avant d'atteindre la base de données :

```
Client HTTP / Kafka
       │
       ▼
   index.js          ← Point d'entrée : Express + Kafka consumer + Prometheus
       │
  ┌────▼─────────────────────────────────────┐
  │            MIDDLEWARE CHAIN              │
  │  Helmet → CORS → JSON → Logger → Metrics │
  └────┬─────────────────────────────────────┘
       │
  ┌────▼──────────────────────┐
  │         ROUTES            │
  │  /api/notifications/*     │
  └────┬──────────────────────┘
       │
  ┌────▼──────────────────────────────────────┐
  │         MIDDLEWARE DE ROUTE               │
  │  authenticateToken                        │
  │      └─ requirePermission(...)            │
  │           └─ validate*(...)               │
  └────┬──────────────────────────────────────┘
       │
  ┌────▼──────────────────────┐
  │       CONTROLLER          │
  │  notification.controller  │
  └────┬──────────────────────┘
       │
  ┌────▼──────────────────────┐
  │        SERVICE            │
  │  notification.service     │  ← Logique métier, logging, invalidation cache
  └────┬──────────────────────┘
       │
  ┌────▼──────────────────────┐
  │      REPOSITORY           │
  │  notification.repository  │  ← Requêtes SQL, validation type/rôle
  └────┬──────────────────────┘
       │
  ┌────▼──────────────────────┐
  │       BASE DE DONNÉES     │
  │       PostgreSQL          │
  └───────────────────────────┘
```

---

## Couches détaillées

### 1. Point d'entrée — `index.js`

Responsabilités :
- Instancier et configurer l'application Express
- Enregistrer tous les middlewares globaux dans le bon ordre
- Monter les routes sous le préfixe `/api`
- Exposer `/health`, `/metrics`, `/api-docs`
- Démarrer le consumer Kafka après la connexion DB
- Gérer l'arrêt propre (`SIGTERM` / `SIGINT`)

**Ordre de démarrage :**
```
1. Express + middleware globaux
2. server.listen(PORT)
3. testConnection()      → PostgreSQL
4. createRedisClient()   → Redis  (dégradé si indisponible)
5. kafkaConsumer.connect() → Kafka (dégradé si indisponible)
```

---

### 2. Middleware — `src/middleware/`

| Fichier | Rôle | Ordre |
|---------|------|-------|
| `cors.js` | Origines autorisées — tout en dev, `ALLOWED_ORIGINS` en prod | 1 |
| `request-logger.js` | Morgan (prod) / console formatée (test) | 2 |
| `auth.js` | Vérifie le JWT Bearer, peuple `req.user` | par route |
| `rbac.js` | Contrôle d'accès — `requirePermission('notifications:create')` | par route |
| `validation.js` | Valide le format du body avant le controller | par route |
| `error-handler.js` | Dernier middleware — transforme toute erreur en réponse JSON normalisée | dernier |

**Chaîne sur les routes POST :**
```
authenticateToken → requirePermission → validate* → controller → [errorHandler si erreur]
```

**`error-handler.js` — cas traités :**
```
ApiError (4xx)  → statusCode + message métier
PG 23505        → 409 contrainte unique
PG 23503        → 409 clé étrangère
CORS error      → 403
Fallback        → 500 "Erreur serveur interne"
```

---

### 3. Routes — `src/routes/notification.route.js`

Déclare les 5 endpoints et attache la chaîne de middleware à chacun :

```
POST   /api/notifications           auth → notifications:create → validateCreate  → controller.create
POST   /api/notifications/bulk      auth → notifications:bulk   → validateBulk    → controller.createBulk
PATCH  /api/notifications/read-all  auth → notifications:own                      → controller.markAllAsRead
PATCH  /api/notifications/:id/read  auth → notifications:own                      → controller.markAsRead
DELETE /api/notifications/:id       auth → notifications:own                      → controller.delete
```

> `/notifications/read-all` est déclaré **avant** `/:id/read` pour éviter qu'Express interprète `read-all` comme un paramètre `:id`.

---

### 4. Controller — `src/controllers/notification.controller.js`

Responsabilités :
- Extraire les données de `req.body`, `req.params`, `req.query`
- Lire `req.user.id` et `req.user.role` (peuplés par `auth.js`)
- Appeler le service correspondant
- Retourner le code HTTP et le corps de réponse appropriés
- Passer toute exception à `next(err)`

**Pattern :**
```javascript
async create(req, res, next) {
  try {
    const result = await notificationService.createNotification(req.body);
    return res.status(201).json(result);
  } catch (err) {
    next(err);  // → errorHandler
  }
}
```

---

### 5. Service — `src/services/notification.service.js`

Logique métier au-dessus du repository :

| Méthode | Ce qu'elle ajoute |
|---------|-------------------|
| `createNotification` | Validation titre/corps + trim + log + invalidation cache |
| `createBulkNotifications` | Sanitize tableau + log + invalidation cache par utilisateur |
| `markAsRead` | Log + invalidation cache |
| `markAllAsRead` | Retourne `{ updated: N }` normalisé + invalidation cache |
| `deleteNotification` | Log + invalidation cache |
| `getUnreadCountCached` | Cache Redis TTL 30s |
| `getNotificationsByUserCached` | Cache Redis TTL 10s |
| `_invalidateUserCache` | Supprime les clés Redis de l'utilisateur concerné |

---

### 6. Repository — `src/repositories/notification.repository.js`

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

### 7. Utilitaires — `src/utils/`

| Fichier | Rôle |
|---------|------|
| `logger.js` | Instance pino avec `pino-pretty` (dev) ou JSON pur (prod). En test : `console` |
| `api-error.js` | `new ApiError(statusCode, message, details)` — reconnu par l'error handler |
| `api-response.js` | `ApiResponse.success(data)` / `ApiResponse.error(code, msg)` |

---

## RBAC — Matrice complète

```
┌──────────────────────────┬──────────────┬───────┐
│ Permission               │ GESTIONNAIRE │ ADMIN │
├──────────────────────────┼──────────────┼───────┤
│ notifications:create     │      ❌      │   ✅  │
│ notifications:bulk       │      ❌      │   ✅  │
│ notifications:own        │      ✅      │   ✅  │
└──────────────────────────┴──────────────┴───────┘
```

`notifications:own` couvre : markAsRead, markAllAsRead, delete.
Un ADMIN peut en plus marquer/supprimer les notifications `SYSTEME` qui ne lui appartiennent pas.

---

## Connexions externes

| Service externe | Protocole | Usage |
|----------------|-----------|-------|
| PostgreSQL | TCP `5435` (local) / `5432` (Docker interne) | Persistance |
| Redis | TCP `6379` | Cache compteurs et listes |
| Kafka | TCP `9092` | Réception alertes et signalements |

---

## Gestion de la dégradation

Le service est conçu pour rester **opérationnel** même si Redis ou Kafka sont indisponibles :

```
Redis DOWN  → warning loggé, toutes les requêtes passent directement en DB
Kafka DOWN  → warning loggé, l'API HTTP continue normalement, plus de notifs automatiques
DB DOWN     → le service refuse les requêtes (connexion PostgreSQL obligatoire)
```

---

## Métriques Prometheus

Deux métriques exposées sur `GET /metrics` :

| Métrique | Type | Labels |
|----------|------|--------|
| `http_requests_total` | Counter | `method`, `route`, `status` |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status` |

Buckets de durée : `[0.05, 0.1, 0.3, 0.5, 1, 2, 5]` secondes.
