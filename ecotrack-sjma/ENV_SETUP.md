# Configuration des Environnements - EcoTrack

## Overview

Le projet utilise des fichiers `.env` pour gérer les configurations par environnement.

## Fichiers de Configuration

```
ecotrack-sjma/
├── .env                    # Configuration locale/développement
├── .env.production        # Configuration production
│
frontend/
├── .env                    # Frontend local
├── .env.production        # Frontend production
├── .env.development       # Frontend développement
└── .env.local             # Frontend local (secret)
```

## environnements

### 1. Développement Local

```bash
# Backend
cp .env.example .env

# Frontend  
cd frontend
cp .env.development .env.local
```

Pour lancer:
```bash
# Docker
docker compose up -d

# ou en local
npm run dev
```

### 2. Production

```bash
# Backend
cp .env.production .env
# Modifier les valeurs marquées CHANGEZ_CETTE_VALEUR

# Frontend
cd frontend
cp .env.production .env
# Modifier les URLs
```

Pour builder:
```bash
# Frontend production
cd frontend
npm run build

# Docker production
docker build -t ecotrack-frontend:prod .
```

## Variables d'Environnement

### Backend (.env)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DB_HOST` | Hôte PostgreSQL | localhost |
| `DB_PORT` | Port PostgreSQL | 5432 |
| `DATABASE_URL` | URL connexion DB | postgresql://... |
| `FRONTEND_URL` | URL frontend | http://localhost |
| `VITE_API_URL` | URL API Gateway | http://localhost:3000 |
| `GATEWAY_PORT` | Port API Gateway | 3000 |
| `JWT_SECRET` | Clé JWT principale | (vide) |
| `JWT_REFRESH_SECRET` | Clé JWT refresh | (vide) |

### Frontend (.env)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `VITE_API_URL` | URL API Gateway | http://localhost:3000 |
| `VITE_FRONTEND_URL` | URL Frontend | http://localhost |
| `VITE_GRAFANA_URL` | URL Grafana (monitoring) | http://localhost:3001 |
| `VITE_PROMETHEUS_URL` | URL Prometheus | http://localhost:9090 |
| `VITE_KAFKA_UI_URL` | URL Kafka UI | http://localhost:8080 |

## URLs par Défaut (Développement)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:3000 |
| service-users | http://localhost:3010 |
| service-containers | http://localhost:3011 |
| service-routes | http://localhost:3012 |
| service-iot | http://localhost:3013 |
| service-gamifications | http://localhost:3014 |
| service-analytics | http://localhost:3015 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |
| Kafka UI | http://localhost:8080 |

## Checklist Production

Avant de déployer en production:

- [ ] Modifier `JWT_SECRET` et `JWT_REFRESH_SECRET`
- [ ] Modifier `DB_PASSWORD`
- [ ] Modifier tous les mots de passe SMTP
- [ ] Remplacer toutes les URLs `localhost` par les URLs production
- [ ] Activer HTTPS/TLS
- [ ] Configurer les variables d'environnement dans le Docker/votre provider

## Docker Production

```bash
# Construire les images
docker build -t ecotrack-frontend:prod ./frontend
docker build -t ecotrack-gateway:prod ./services/api-gateway
# ...

# Utiliser .env.production
docker run --env-file .env.production ecotrack-frontend:prod
```