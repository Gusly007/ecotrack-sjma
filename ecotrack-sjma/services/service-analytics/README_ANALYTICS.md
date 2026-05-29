# EcoTrack Analytics Service (port 3015)

Microservice de collecte, traitement et analyse des données de gestion des déchets.

## Fonctionnalités

### Phase 1 - Agrégations
- Vues matérialisées (quotidien, par zone, par type)
- Requêtes agrégées avec filtres de période
- API REST pour consultations

### Phase 2 - Dashboard
- KPIs en temps réel
- Heatmap GeoJSON
- Évolutions
- Conteneurs critiques

### Phase 3 - Rapports
- Génération PDF et Excel
- Rapports environnementaux
- Rapports performance tournées

### Phase 4 - ML Predictions
- Prédiction remplissage (régression linéaire)
- Détection anomalies (Z-score)
- Capteurs défaillants
- Intégration météo (Open-Meteo)
- Alertes automatiques

### Phase 5 - Infrastructure
- Rate limiting (express-rate-limit)
- Validation Joi
- WebSocket temps réel (socket.io)
- Cache (node-cache)
- Redis (docker)

## Installation

```bash
npm install
```

## Configuration

Variables d'environnement (`.env`):
```env
PORT=3015
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecotrack
DB_USER=ecotrack_user
DB_PASSWORD=ecotrack_password
JWT_SECRET=votre_secret_jwt
FRONTEND_URL=http://localhost:3000
```

## Docker

```bash
# Lancer tous les services
docker-compose up -d

# Services disponibles
- PostgreSQL:   localhost:5432
- Redis:       localhost:6379
- pgAdmin:     localhost:5052
- Analytics:   localhost:3015
```

## API REST

Base URL (via Gateway) : `http://localhost:3000/api/V1/analytics`
Base URL (direct)      : `http://localhost:3015/api/V1/analytics`

### Agrégations

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/aggregations` | Toutes les agrégations avec filtres de période |
| `GET` | `/aggregations/zones` | Agrégations par zone géographique |
| `GET` | `/aggregations/agents` | Performance des agents de collecte |

### Dashboard

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/dashboard` | Dashboard complet (KPIs, alertes, conteneurs critiques) |
| `GET` | `/realtime` | Statistiques en temps réel |
| `GET` | `/heatmap` | Heatmap GeoJSON des niveaux de remplissage |
| `GET` | `/evolution` | Évolutions temporelles |

### Rapports

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/reports/generate` | Générer un rapport PDF ou Excel |
| `GET` | `/reports/download/:file` | Télécharger un rapport généré |
| `POST` | `/reports/environmental` | Rapport d'impact environnemental |
| `POST` | `/reports/routes-performance` | Rapport performance des tournées |

### ML Predictions

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/ml/predict` | Prédire le remplissage (régression linéaire) |
| `GET` | `/ml/predict-critical` | Identifier les conteneurs critiques |
| `GET` | `/ml/anomalies/:id` | Détecter les anomalies d'un conteneur (Z-score) |
| `GET` | `/ml/defective-sensors` | Capteurs défaillants détectés |
| `POST` | `/ml/anomalies/:id/alerts` | Créer des alertes à partir des anomalies |

## Intégration Kafka

Le service-analytics consomme les topics Kafka produits par service-iot.

| Topic | Rôle |
|-------|------|
| `ecotrack.sensor.data` | Données brutes capteurs — calculs ML et agrégations statistiques |
| `ecotrack.alerts` | Alertes IoT — stockage pour rapports et historique |

## WebSocket

Connexion:
```javascript
const io = require('socket.io')('http://localhost:3015', {
  auth: { token: 'JWT_TOKEN' }
});
```

Événements:
- `subscribe:dashboard` - Mises à jour dashboard
- `subscribe:alerts` - Nouvelles alertes
- `subscribe:container` - Updates conteneur spécifique

## Tests

```bash
npm test
```

## Documentation API

Swagger UI: http://localhost:3015/api-docs

## Structure

```
src/
├── config/           # Configuration DB, cron
├── controllers/      # Logique métier
├── middleware/       # Auth, validation, rate limit
├── repositories/     # Requêtes SQL
├── routes/           # Définition routes
├── services/         # Services (cache, PDF, ML, etc.)
└── utils/           # Helpers, constants
```

## Licence

ISC - SJMA
