# EcoTrack SJMA

Plateforme microservices pour la gestion des services EcoTrack (auth, conteneurs, gamification...).

## Demarrage rapide

```bash
docker compose up -d --build
cd database && npm install && npm run migrate && npm run seed
```

## Services developpes

- API Gateway (port 3000)
- Service Users (port 3010)
- Service Containers (port 3011)
- Service Gamifications (port 3014)

## Developpement local (sans Docker)

```bash
cd services/service-users && npm install && npm run dev
cd services/api-gateway && npm install && npm run dev
```

## Tests

```bash
cd services/service-users && npm test
cd services/service-containers && npm test
cd services/service-gamifications && npm test
```

## Documentation

- Guide developpement: DEVELOPMENT.md
- Services: services/README.md