# EcoTrack SJMA

Plateforme microservices complète pour la gestion des services urbains - collecte des déchets, suivi des conteneurs, gamification, et analytics temps réel.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway (3000)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
    ┌─────────────┬──────────────┼──────────────┬─────────────┐
    ▼             ▼              ▼              ▼             ▼
 Users(3010)  Containers(3011) Routes(3012)    IoT(3013)  Analytics(3015)
    │             │              │              │             │
    └─────────────┴──────────────┴──────────────┴─────────────┘
                                │
                    Gamifications (3014)
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 3000 | Point d'entrée, load balancing, caching |
| service-users | 3010 | Auth, RBAC, sessions, gestion utilisateurs |
| service-containers | 3011 | CRUD conteneurs, zones, stats |
| service-routes | 3012 | Optimisation tournées, véhicules |
| service-iot | 3013 | CapteursMQTT, alertes, Kafka producer |
| service-analytics | 3015 | Agrégations, ML, dashboards |
| service-gamifications | 3014 | Défis, badges, classements |

## Fonctionnalités

- **Authentication & RBAC** - JWT, permissions par rôle (Admin, Gestionnaire, Agent, Citoyen)
- **IoT & temps réel** - MQTT, Kafka, seuils d'alerte
- **Cache Redis** - Réduction latence sur endpoints fréquents
- **Logging centralisé** - Pino, agrégation logs via API Gateway
- **Monitoring** - Prometheus + Grafana dashboards
- **ML Analytics** - Prédiction niveau remplissage, détection anomalies

## Démarrage rapide

```bash
# Clone & démarrer
git clone https://github.com/Gusly007/ecotrack-sjma.git
cd ecotrack-sjma

# Docker (tout-inclus)
docker compose up -d --build

# OU développement local
cd services/service-users && npm install && npm run dev
cd services/api-gateway && npm install && npm run dev
# ... autres services
```

## Configuration

```bash
# Variables d'environnement
cp .env.example .env
# Édite .env avec tes configs (DB, Redis, JWT secrets...)
```

## Tests

```bash
# Tous les services
cd services/service-users && npm test
cd services/service-containers && npm test
cd services/service-gamifications && npm test
cd services/service-iot && npm test
cd services/service-analytics && npm test
cd services/service-routes && npm test

# Couverture
npm run test:coverage
```

## Monitoring

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **API Gateway docs**: http://localhost:3000/api-docs

## Documentation

- [Architecture diagrams](./docs/diagrams/flows/)
- [Guide déploiement](./docs/DEPLOYMENT_GUIDE.md)
- [Configuration](./docs/CONFIGURATIONS.md)
- [Monitoring](./docs/GRAFANA_METRICS.md)
- [Kafka](./docs/KAFKA.md)

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL, Redis
- **IoT**: MQTT, Kafka
- **Monitoring**: Prometheus, Grafana
- **Tests**: Jest, Supertest

## License

ISC