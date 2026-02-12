# API Gateway - Documentation

> Point d'entrée unique pour tous les microservices EcoTrack

---

## Vue d'ensemble

L'API Gateway sert de reverse proxy et d'agrégateur pour tous les microservices EcoTrack. Elle centralise le routage, la sécurité et le monitoring.

**Port :** 3000

**Services gérés :**
- Service Users (Port 3010)
- Service Containers (Port 3004)  
- Service Gamifications (Port 3014)
- Service Routes (à venir)
- Service Analytics (à venir)

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
CONTAINERS_SERVICE_URL=http://localhost:3004
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

**En attente :**
- `/api/routes/*` → service-routes (Planification)
- `/api/analytics/*` → service-analytics (Dashboards)

### 2.2 Agrégation de réponses

**En attente :**
- Endpoints composite (ex: profil utilisateur + stats)
- Cache Redis pour les réponses fréquentes
- Formatage standardisé des réponses d'erreur

---

## Phase 3 : Sécurité et Monitoring (À venir)

### 3.1 Sécurité centralisée

**En attente :**

| Fonctionnalité | Priorité | Description |
|----------------|----------|-------------|
| Validation JWT | Haute | Vérification des tokens sur toutes les routes protégées |
| Rate limiting global | Haute | 100 req/min par IP, 1000 req/min par utilisateur |
| Logs d'accès | Moyenne | Logs centralisés dans format JSON |
| WAF | Basse | Protection contre injections SQL, XSS |

**Implémentation prévue :**
```javascript
// Middleware JWT
app.use('/api/protected', jwtValidationMiddleware);

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // 100 requêtes par minute
}));
```

### 3.2 Health checks avancés

**Réalisé (basique) :**
- Endpoint `/health` retournant le statut de la gateway

**En attente :**
- Vérification de tous les services dépendants
- Endpoint `/health/detailed` avec statut de chaque service
- Alertes automatiques si service down
- Circuit breaker pattern

**Format prévu :**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-12T10:00:00Z",
  "services": {
    "users": { "status": "up", "latency": "45ms" },
    "containers": { "status": "up", "latency": "32ms" },
    "gamifications": { "status": "up", "latency": "28ms" }
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
│  (Port 3010) │   │   (Port 3004)   │   │ (Port 3014)  │
└──────────────┘   └─────────────────┘   └──────────────┘
```

---

## Endpoints

### Health

- `GET /health` - Statut de la gateway

### Proxy Routes

- `GET/POST/PUT/DELETE /api/users/*` → Proxy vers service-users
- `GET/POST/PUT/DELETE /api/containers/*` → Proxy vers service-containers
- `GET/POST/PUT/DELETE /api/gamifications/*` → Proxy vers service-gamifications

---

## Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|---------|
| `GATEWAY_PORT` | Port du serveur | 3000 |
| `USERS_SERVICE_URL` | URL service users | http://localhost:3010 |
| `CONTAINERS_SERVICE_URL` | URL service containers | http://localhost:3004 |
| `GAMIFICATIONS_SERVICE_URL` | URL service gamifications | http://localhost:3014 |
| `NODE_ENV` | Environnement | development |

### Docker

```bash
# Build
docker build -t ecotrack-api-gateway .

# Run
docker run -p 3000:3000 \
  -e USERS_SERVICE_URL=http://users:3010 \
  -e CONTAINERS_SERVICE_URL=http://containers:3004 \
  ecotrack-api-gateway
```

---

## Roadmap

### Version 1.1.0 (Mars 2026)
- [ ] Intégration Service Routes
- [ ] Rate limiting global
- [ ] Validation JWT centralisée

### Version 1.2.0 (Avril 2026)
- [ ] Cache Redis
- [ ] Agrégation de réponses
- [ ] Logs centralisés

### Version 1.3.0 (Mai 2026)
- [ ] Circuit breaker
- [ ] Health checks détaillés
- [ ] Monitoring Prometheus/Grafana

### Version 2.0.0 (Juin 2026)
- [ ] Load balancing multi-instance
- [ ] Service Mesh (Istio)
- [ ] Web Application Firewall (WAF)

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
   CONTAINERS_SERVICE_URL=http://localhost:3004
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
