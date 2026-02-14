# Services EcoTrack

Ce dossier contient les microservices de l'application EcoTrack.

## Structure

```
services/
├── api-gateway/           # API Gateway (port 3000)
├── service-users/         # Authentification et utilisateurs (port 3010)
├── service-containers/    # Conteneurs et stats (port 3011)
├── service-gamifications/ # Gamification (port 3014)
├── service-routes/        # A venir
├── service-iot/           # A venir
└── service-analytics/     # A venir
```

## Services developpes

### API Gateway (port 3000)
- Point d'entree unique
- Proxy vers les microservices
- Rate limiting et CORS
- Health check: `GET /health`

### Service Users (port 3010)
- Authentification (login, register, refresh token)
- Gestion utilisateurs, roles, permissions
- Avatars et notifications
- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

### Service Containers (port 3011)
- CRUD conteneurs, zones, types
- Statistiques et alertes
- Notifications temps reel via Socket.IO
- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

### Service Gamifications (port 3014)
- Actions, badges, defis, classement
- Notifications et stats
- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

## Demarrage local

### Avec Docker Compose (recommande)
```bash
docker compose up -d
```

### En mode developpement
```bash
# Terminal 1 - Service Users
cd services/service-users
npm install
npm run dev

# Terminal 2 - API Gateway
cd services/api-gateway
npm install
npm run dev
```

## Variables d'environnement

Chaque service a son fichier `.env`. Voir `.env.example` a la racine.

## Tests

```bash
# Service users
cd services/service-users
npm test
npm run test:coverage

# Service containers
cd services/service-containers
npm test

# Service gamifications
cd services/service-gamifications
npm test
```

## Architecture

Les services communiquent via HTTP. L'API Gateway route selon les prefixes:

- `/api/auth/*` -> service-users
- `/api/users/*` -> service-users
- `/api/containers/*` -> service-containers
- `/api/gamification/*` -> service-gamifications
- `/api/routes/*` -> service-routes (a venir)

## Ajouter un service

1. Creer un dossier dans `services/`
2. Initialiser avec `npm init`
3. Ajouter un `Dockerfile`
4. Declarer le service dans `docker-compose.yml`
5. Ajouter les jobs dans `.github/workflows/ci.yml`
6. Ajouter le proxy dans l'api-gateway
