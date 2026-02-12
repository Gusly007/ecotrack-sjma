# API Gateway - Documentation

> Point d'entrée unique pour tous les microservices EcoTrack

---

## Vue d'ensemble

L'API Gateway sert de reverse proxy et d'agrégateur pour tous les microservices EcoTrack. Elle centralise le routage, la sécurité et le monitoring.

**Port :** 3000

**Services gérés :**
- Service Users (Port 3010)
- Service Containers (Port 3011)  
- Service Gamifications (Port 3014)
- Service Routes (à venir)
- Service Analytics (à venir)
-Service IoT( a venir)

---

## Phase 1 : Structure de Base (Complété)

### 1.1 Setup du projet

**Réalisé :**
- Structure du projet Express.js
- Installation de `http-proxy-middleware`
- Configuration de base des routes de proxy
- Gestion des erreurs HTTP

**Fichiers :**
- `src/index.js` - Point d'entrée
- `src/swagger-config.js` - Documentation API

### 1.2 Configuration des services

**Réalisé :**
- URLs des microservices définies via variables d'environnement
- Configuration CORS centralisée
- Timeouts configurables (30s par défaut)
- Health checks de base

**Variables d'environnement :**
```
GATEWAY_PORT=3000
USERS_SERVICE_URL=http://localhost:3010
CONTAINERS_SERVICE_URL=http://localhost:3011
GAMIFICATIONS_SERVICE_URL=http://localhost:3014
```

---

## Phase 2 : Gestion des Requêtes (En cours)

### 2.1 Routing intelligent

**Réalisé :**

| Route | Service | Description |
|-------|---------|-------------|
| `/api/users/*` | service-users | Authentification, profils, avatars |
| `/api/containers/*` | service-containers | Gestion des conteneurs, IoT |
| `/api/gamifications/*` | service-gamifications | Points, badges, défis |
| `/health` | api-gateway | Health check global |

**Configuration :**
```javascript
// Exemple de configuration de route
app.use('/api/users', createProxyMiddleware({
  target: process.env.USERS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' }
}));
```

**Routes en attente de services :**
- `/api/routes/*` → service-routes (Planification) - Service non disponible
- `/api/analytics/*` → service-analytics (Dashboards) - Service non disponible

### 2.2 Agrégation de réponses (En attente)

**À venir :**
- Endpoints composite (ex: profil utilisateur + stats)
- Cache Redis pour les réponses fréquentes
- Formatage standardisé des réponses d'erreur

---

## Phase 3 : Sécurité et Monitoring (Complété)

### 3.1 Sécurité centralisée

**Réalisé :**

| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| Validation JWT | Complété | Vérification des tokens sur toutes les routes protégées |
| Rate limiting global | Complété | 100 req/min par IP, configurable via env vars |
| Headers de sécurité Helmet | Complété | Protection XSS, clickjacking, etc. |
| Logs d'accès | Complété | Logs structurés JSON avec Winston |
| WAF | Basse | Protection contre injections SQL, XSS (futur) |

**Routes publiques (sans auth) :**
- `/auth/login` - Connexion
- `/auth/register` - Inscription
- `/health` - Health check
- `/api-docs` - Documentation Swagger

**Implémentation :**
```javascript
// Middleware JWT - valide automatiquement les tokens
app.use(jwtValidationMiddleware);

// Rate limiting configurable
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // 100 requêtes par minute
}));

// Headers de sécurité Helmet
app.use(helmet());
```

### 3.2 Health checks avancés

**Réalisé :**
- Endpoint `/health` - Statut basique de la gateway
- Endpoint `/health/detailed` - Statut complet avec vérification des services
- Endpoint `/health/:service` - Statut d'un service spécifique
- Vérification périodique automatique (toutes les 30s)
- Détection des services down avec compteur d'échecs
- Latence mesurée pour chaque service

**En attente :**
- Circuit breaker pattern
- Alertes automatiques (email/Slack)

**Endpoints :**

```bash
# Health check basique
GET /health

# Health check détaillé
GET /health/detailed

# Health check d'un service spécifique
GET /health/users
GET /health/containers
GET /health/gamification
```

**Réponse `/health/detailed` :**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-12T10:00:00Z",
  "uptime": 3600,
  "gateway": {
    "status": "up",
    "version": "1.0.0",
    "nodeVersion": "v20.11.0"
  },
  "services": {
    "users": { 
      "status": "up", 
      "latency": "45ms",
      "lastCheck": "2026-02-12T10:00:00Z"
    },
    "containers": { 
      "status": "up", 
      "latency": "32ms",
      "lastCheck": "2026-02-12T10:00:00Z"
    },
    "gamifications": { 
      "status": "up", 
      "latency": "28ms",
      "lastCheck": "2026-02-12T10:00:00Z"
    }
  }
}
```

---

## Architecture

```
                    ┌─────────────────┐
                    │   Client Apps   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  API Gateway    │
                    │    (Port 3000)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────┐   ┌────────▼────────┐   ┌───────▼──────┐
│   Service    │   │     Service     │   │    Service   │
│    Users     │   │    Containers   │   │ Gamifications│
│  (Port 3010) │   │   (Port 3011)   │   │ (Port 3014)  │
└──────────────┘   └─────────────────┘   └──────────────┘
```

---

## Middlewares

### Auth (`src/middleware/auth.js`)
- `jwtValidationMiddleware` - Valide les tokens JWT
- `requireRole(...roles)` - Vérifie les rôles utilisateur

### Logger (`src/middleware/logger.js`)
- `requestLogger` - Log les requêtes HTTP (Morgan)
- `detailedRequestLogger` - Log détaillé avec timing
- `errorLogger` - Log des erreurs
- `securityLogger` - Log des événements de sécurité

### Services
- `healthCheckService` - Vérification périodique des services

---

## Endpoints

### Health

- `GET /health` - Statut basique de la gateway
- `GET /health/detailed` - Statut complet avec tous les services
- `GET /health/:service` - Statut d'un service spécifique (users, containers, gamification)

### Proxy Routes

Toutes les routes sont protégées par JWT (sauf routes publiques listées ci-dessus).

- `GET/POST/PUT/DELETE /api/users/*` → Proxy vers service-users
- `GET/POST/PUT/DELETE /api/containers/*` → Proxy vers service-containers
- `GET/POST/PUT/DELETE /api/gamifications/*` → Proxy vers service-gamifications

**Headers ajoutés automatiquement :**
- `x-user-id` - ID de l'utilisateur authentifié
- `x-user-role` - Rôle de l'utilisateur

---

## Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|---------|
| `GATEWAY_PORT` | Port du serveur | 3000 |
| `USERS_SERVICE_URL` | URL service users | http://localhost:3010 |
| `CONTAINERS_SERVICE_URL` | URL service containers | http://localhost:3011 |
| `GAMIFICATIONS_SERVICE_URL` | URL service gamifications | http://localhost:3014 |
| `JWT_SECRET` | Clé secrète pour JWT | votre_secret_jwt_a_changer_en_production |
| `GATEWAY_RATE_WINDOW_MS` | Fenêtre de rate limiting (ms) | 60000 |
| `GATEWAY_RATE_MAX` | Requêtes max par fenêtre | 100 |
| `HEALTH_CHECK_INTERVAL` | Intervalle health check (ms) | 30000 |
| `HEALTH_CHECK_TIMEOUT` | Timeout health check (ms) | 5000 |
| `LOG_LEVEL` | Niveau de log (debug/info/warn/error) | info |
| `NODE_ENV` | Environnement | development |

### Docker

```bash
# Build
docker build -t ecotrack-api-gateway .

# Run
docker run -p 3000:3000 \
  -e USERS_SERVICE_URL=http://users:3010 \
  -e CONTAINERS_SERVICE_URL=http://containers:3011 \
  ecotrack-api-gateway
```

---

## Roadmap

### Version 1.1.0 (Mars 2026) - Complété ✅
- [x] Intégration Service Routes
- [x] Rate limiting global
- [x] Validation JWT centralisée
- [x] Health checks avancés

### Version 1.2.0 (Avril 2026) - En cours 🚧
- [ ] Cache Redis
- [ ] Agrégation de réponses (endpoints composite)
- [x] Logs centralisés (Winston)
- [ ] Circuit breaker pattern

### Version 1.3.0 (Mai 2026) - À venir 📅
- [ ] Monitoring Prometheus/Grafana
- [ ] Alertes automatiques (Slack/Email)
- [ ] Dashboard d'administration

### Version 2.0.0 (Juin 2026) - Futur 🔮
- [ ] Load balancing multi-instance
- [ ] Service Mesh (Istio)
- [ ] Web Application Firewall (WAF)
- [ ] Protection DDoS

---

## Technologies

- **Node.js** 20+
- **Express.js** 5.2.1
- **http-proxy-middleware** - Proxy reverse
- **Swagger UI** - Documentation interactive
- **Docker** - Containerisation

---

## Mise en route rapide

1. **Installer les dépendances**
   ```bash
   cd api-gateway
   npm install
   ```

2. **Configurer l'environnement**
   Créer un fichier `.env` avec :
   ```env
   GATEWAY_PORT=3000
   USERS_SERVICE_URL=http://localhost:3010
   CONTAINERS_SERVICE_URL=http://localhost:3011
   GAMIFICATIONS_SERVICE_URL=http://localhost:3014
   ```

3. **Lancer le service**
   ```bash
   npm run dev
   ```

4. **Tester**
   - Health check : `curl http://localhost:3000/health`
   - Swagger : `http://localhost:3000/api-docs`

---

**Dernière mise à jour** : 2026-02-12
**Maintenu par** : Équipe EcoTrack
