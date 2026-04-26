# Services EcoTrack

Ce dossier contient les microservices de l'application EcoTrack.

## Structure

```
services/
├── api-gateway/           # API Gateway (port 3000)
├── service-users/         # Authentification et utilisateurs (port 3010)
├── service-containers/    # Conteneurs et stats (port 3011)
├── service-routes/       # Tournées et collectes (port 3012)
├── service-iot/          # Données capteurs IoT (port 3013)
├── service-gamifications/ # Gamification (port 3014)
└── service-analytics/     # Analytics et stats (port 3015)
```

## Services Développés

### API Gateway (port 3000)
- Point d'entrée unique
- Proxy vers les microservices
- Rate limiting et CORS
- JWT validation
- Health check: `GET /health`

### Service Users (port 3010)
- Authentification (login, register, refresh token)
- Gestion utilisateurs, roles, permissions (RBAC)
- Avatars et notifications
- Cache Redis
- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

**Docs:** `service-users/docs/`

### Service Containers (port 3011)
- CRUD conteneurs, zones, types
- Statistiques et alertes
- Notifications temps reel via Socket.IO
- Cache Redis
- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

**Docs:** `service-containers/docs/`

### Service Routes (port 3012)
- Gestion tournées et collectes
- Optimisation itinéraires
- PDF generation
- Rate limiting
- Cache Redis
- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

**Docs:** `service-routes/docs/`

### Service IoT (port 3013)
- Réception données capteurs MQTT
- Génération alertes automatiques
- Kafka producer
- Cache Redis
- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

**Docs:** `service-iot/docs/`

### Service Gamifications (port 3014)
- Actions, badges, defis, classement
- Notifications et stats
- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

**Docs:** `service-gamifications/docs/`

### Service Analytics (port 3015)
- Agrégations et statistiques
- Dashboard et rapports (PDF/Excel)
- ML predictions
- Cache Redis
- Metrics API (Prometheus)
- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

**Docs:** `service-analytics/docs/`

## Architecture

### Communication

```
[Frontend] -> [API Gateway] -> [Microservices]
                              |
                              +-> Kafka -> Consumers
                              |
                              +-> Redis (Cache)
                              |
                              +-> PostgreSQL
```

### Ports

| Service | Port | Description |
|---------|------|-------------|
| api-gateway | 3000 | Point d'entrée |
| service-users | 3010 | Auth/Users |
| service-containers | 3011 | Conteneurs |
| service-routes | 3012 | Tournées |
| service-iot | 3013 | IoT/MQTT |
| service-gamifications | 3014 | Gamification |
| service-analytics | 3015 | Analytics |

## Démarrage local

### Avec Docker Compose (recommandé)
```bash
docker compose up -d
```

### En mode développement
```bash
# Terminal 1 - Service Users
cd services/service-users && npm install && npm run dev

# Terminal 2 - Service Analytics
cd services/service-analytics && npm install && npm run dev
```

## Tests

```bash
# Chaque service
cd services/<service-name>
npm test
npm run test:coverage
```

## Infrastructure

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Base de données |
| Redis | 6379 | Cache |
| Kafka | 9092 | Message broker |
| Zookeeper | 2181 | Kafka coord |
| Prometheus | 9090 | Monitoring |
| Grafana | 3001 | Dashboards |
| Kafka-UI | 8080 | Kafka interface |

## Ajouter un service

1. Créer un dossier dans `services/`
2. Initialiser avec `npm init`
3. Ajouter documentation dans `docs/`
4. Ajouter un `Dockerfile`
5. Déclarer le service dans `docker-compose.yml`
6. Ajouter le proxy dans l'api-gateway
7. Ajouter les jobs dans `.github/workflows/ci.yml`
