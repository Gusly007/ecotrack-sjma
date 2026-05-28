# API Gateway - Documentation

> Point d'entree unique pour tous les microservices EcoTrack

---

## Vue d'ensemble

L'API Gateway sert de reverse proxy et d'agregateur pour tous les microservices EcoTrack. Elle centralise le routage, la securite, le monitoring et la documentation API.

**Port :** 3000

**Services geres :**

| Service | Port | Variable d'env |
|---------|------|----------------|
| service-users | 3010 | `USERS_SERVICE_URL` |
| service-containers | 3011 | `CONTAINERS_SERVICE_URL` |
| service-routes | 3012 | `ROUTES_SERVICE_URL` |
| service-iot | 3013 | `IOT_SERVICE_URL` |
| service-gamifications | 3014 | `GAMIFICATIONS_SERVICE_URL` |
| service-analytics | 3015 | `ANALYTICS_SERVICE_URL` |
| service-notification-gestionnaire-admin | 3016 | `NOTIFICATION_SERVICE_URL` |

---

## Architecture

```
                    +--------------------+
                    |    Client Apps     |
                    |  (Web / Mobile)    |
                    +--------+-----------+
                             |
                    +--------v-----------+
                    |    API Gateway     |
                    |    (Port 3000)     |
                    |                   |
                    |  JWT validation   |
                    |  Rate limiting    |
                    |  Logging Pino     |
                    |  Redis cache      |
                    |  Prometheus       |
                    +--------+----------+
                             |
     +-----------+-----------+-----------+-----------+-----------+-----------+
     |           |           |           |           |           |           |
+----v---+  +----v---+  +----v---+  +----v---+  +----v---+  +----v---+  +----v---+
| Users  |  | Cont.  |  | Routes |  |  IoT   |  | Gamif. |  | Anal.  |  | Notif. |
| :3010  |  | :3011  |  | :3012  |  | :3013  |  | :3014  |  | :3015  |  | :3016  |
+--------+  +--------+  +--------+  +--------+  +--------+  +--------+  +--------+
```

---

## Proxy Routes

Toutes les routes sont protegees par JWT sauf les routes publiques listees ci-dessous.

### Routes proxy vers les microservices

| Methode | Chemin Gateway | Service cible | Description |
|---------|---------------|---------------|-------------|
| `*` | `/api/V1/users/*` | service-users :3010 | Auth, profils, avatars, RBAC |
| `*` | `/api/V1/containers/*` | service-containers :3011 | CRUD conteneurs |
| `*` | `/api/V1/zones/*` | service-containers :3011 | Zones geographiques |
| `*` | `/api/V1/typecontainers/*` | service-containers :3011 | Types de conteneurs |
| `*` | `/api/V1/stats/*` | service-containers :3011 | Statistiques dashboard |
| `*` | `/api/V1/routes/*` | service-routes :3012 | Tournees, collectes, vehicules |
| `*` | `/api/V1/iot/*` | service-iot :3013 | Capteurs, mesures, alertes |
| `*` | `/api/V1/gamification/*` | service-gamifications :3014 | Actions, badges, defis, classement |
| `*` | `/api/V1/analytics/*` | service-analytics :3015 | Agregations, ML, dashboards |
| `*` | `/api/V1/notifications/*` | service-notification :3016 | Notifications utilisateurs |
| `*` | `/api/V1/admin/notifications/*` | service-notification :3016 | Notifications admin |
| `WS` | `/ws` | service-notification :3016 | WebSocket notifications temps reel |

### Routes natives de la Gateway

| Methode | Chemin | Description | Auth |
|---------|--------|-------------|------|
| `GET` | `/health` | Statut basique de la gateway | Non |
| `GET` | `/health/detailed` | Statut complet + latence de chaque service | Non |
| `GET` | `/health/:service` | Statut d'un service specifique | Non |
| `GET` | `/api/V1/health/all` | Ping de tous les services en parallele | Oui |
| `GET` | `/metrics` | Metriques Prometheus | Non |
| `GET` | `/api-docs` | Documentation Swagger UI unifiee (8 services) | Non |
| `*` | `/api/V1/cookies/*` | Consentement GDPR cookies | Non |
| `*` | `/api/*` (gdpr) | Routes RGPD (export, suppression) | Oui |
| `POST` | `/api/V1/logs` | Reception des logs des microservices | Oui |
| `GET` | `/api/V1/logs` | Consultation des logs agreges | Oui |
| `GET` | `/api/V1/logs/summary` | Resume des logs | Oui |
| `GET` | `/api/V1/logs/stats` | Statistiques des logs | Oui |
| `GET` | `/api/V1/logs/export` | Export des logs (JSON/CSV) | Oui |
| `DELETE` | `/api/V1/logs/cleanup` | Purge des logs archives (ADMIN) | Oui |

### Routes publiques (sans JWT)

```
POST /api/V1/users/auth/login
POST /api/V1/users/auth/register
GET  /health
GET  /api-docs
GET  /metrics
POST /api/V1/cookies/consent
GET  /api/V1/cookies/consent
```

---

## Middlewares

### Auth (`src/middleware/auth.js`)
- `jwtValidationMiddleware` — valide les tokens JWT Bearer sur toutes les routes protegees
- `requireRole(...roles)` — verifie les roles utilisateur (ADMIN, GESTIONNAIRE, AGENT, CITOYEN)

**Headers transmis aux services en aval :**
- `x-user-id` — ID de l'utilisateur authentifie
- `x-user-role` — Role de l'utilisateur
- `x-user-email` — Email de l'utilisateur

### Logger (`src/middleware/logger.js`)
- `requestLogger` — Logs HTTP structures JSON avec Pino
- `detailedRequestLogger` — Logs detailles avec timing

### Securite
- **Helmet** — Headers HTTP securises (XSS, clickjacking, HSTS...)
- **Rate limiting** — 100 req/min par IP (configurable), attaque brute force bloquee
- **CORS** — Origines autorisees configurables via `ALLOWED_ORIGINS`

### Cache Redis
- `cacheService` — Cache Redis pour les reponses frequentes (TTL configurable)

---

## Health Checks

```bash
# Statut basique
GET /health

# Statut detaille avec latence de chaque service
GET /health/detailed

# Statut d'un service specifique
GET /health/users
GET /health/containers
GET /health/routes
GET /health/iot
GET /health/gamification
GET /health/analytics
GET /health/notification

# Ping de tous les services en parallele (route authentifiee)
GET /api/V1/health/all
```

**Reponse `/health/detailed` :**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-28T10:00:00Z",
  "uptime": 3600,
  "gateway": {
    "status": "up",
    "version": "1.0.0"
  },
  "services": {
    "users":        { "status": "up", "latency": "45ms" },
    "containers":   { "status": "up", "latency": "32ms" },
    "routes":       { "status": "up", "latency": "28ms" },
    "iot":          { "status": "up", "latency": "15ms" },
    "gamification": { "status": "up", "latency": "22ms" },
    "analytics":    { "status": "up", "latency": "38ms" },
    "notification": { "status": "up", "latency": "20ms" }
  }
}
```

Verification periodique automatique toutes les 30 secondes avec detection des services down.

---

## Documentation API

### Swagger UI interactif (en ligne)
```
http://localhost:3000/api-docs
```
Combine les specs de tous les microservices en une interface unifiee.

### Documentation statique HTML (hors ligne)
```bash
cd services/api-gateway
npm run docs:build
# Genere api-docs.html (standalone, 517 KiB)

# Ou pour tous les services :
cd ../..
npm run docs:swagger
# Genere docs/swagger/index.html + un HTML par service
```

---

## Configuration

### Variables d'environnement

| Variable | Description | Defaut |
|----------|-------------|--------|
| `GATEWAY_PORT` | Port du serveur | `3000` |
| `USERS_SERVICE_URL` | URL service users | `http://localhost:3010` |
| `CONTAINERS_SERVICE_URL` | URL service containers | `http://localhost:3011` |
| `ROUTES_SERVICE_URL` | URL service routes | `http://localhost:3012` |
| `IOT_SERVICE_URL` | URL service IoT | `http://localhost:3013` |
| `GAMIFICATIONS_SERVICE_URL` | URL service gamifications | `http://localhost:3014` |
| `ANALYTICS_SERVICE_URL` | URL service analytics | `http://localhost:3015` |
| `NOTIFICATION_SERVICE_URL` | URL service notifications | `http://localhost:3016` |
| `JWT_SECRET` | Cle secrete JWT (partager avec service-users) | — |
| `REDIS_URL` | URL Redis | `redis://localhost:6379` |
| `GATEWAY_RATE_WINDOW_MS` | Fenetre de rate limiting (ms) | `60000` |
| `GATEWAY_RATE_MAX` | Requetes max par fenetre | `100` |
| `HEALTH_CHECK_INTERVAL` | Intervalle health check (ms) | `30000` |
| `HEALTH_CHECK_TIMEOUT` | Timeout health check (ms) | `5000` |
| `LOG_LEVEL` | Niveau de log Pino | `info` |
| `ALLOWED_ORIGINS` | Origines CORS (virgule) | — |
| `NODE_ENV` | Environnement | `development` |

---

## Mise en route

```bash
cd services/api-gateway
npm install
cp .env.example .env   # configurer les URLs des services
npm run dev            # developpement
npm start              # production
```

**Verifier le demarrage :**
```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/detailed
```

### Docker

```bash
docker build -t ecotrack-api-gateway .
docker run -p 3000:3000 \
  -e USERS_SERVICE_URL=http://users:3010 \
  -e CONTAINERS_SERVICE_URL=http://containers:3011 \
  -e ROUTES_SERVICE_URL=http://routes:3012 \
  -e IOT_SERVICE_URL=http://iot:3013 \
  -e GAMIFICATIONS_SERVICE_URL=http://gamifications:3014 \
  -e ANALYTICS_SERVICE_URL=http://analytics:3015 \
  -e NOTIFICATION_SERVICE_URL=http://notification:3016 \
  ecotrack-api-gateway
```

---

## Technologies

- **Node.js** 20+ / **Express.js** 5.x
- **http-proxy-middleware** — Proxy reverse avec rewrite de paths
- **Pino** — Logging JSON haute performance
- **Redis** — Cache reponses et sessions
- **Helmet** — Headers securises
- **swagger-ui-express** + **@redocly/cli** — Documentation API
- **Prometheus (prom-client)** — Metriques
- **node-cron** — Taches planifiees GDPR
