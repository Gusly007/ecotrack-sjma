# EcoTrack Analytics Service

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

## API Endpoints

### Agrégations
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/V1/analytics/aggregations` | Toutes agrégations |
| GET | `/api/V1/analytics/aggregations/zones` | Par zone |
| GET | `/api/V1/analytics/aggregations/agents` | Performance agents |

### Dashboard
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/V1/analytics/dashboard` | Dashboard complet |
| GET | `/api/V1/analytics/realtime` | Stats temps réel |
| GET | `/api/V1/analytics/heatmap` | Heatmap GeoJSON |
| GET | `/api/V1/analytics/evolution` | Évolutions |

### Rapports
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/V1/analytics/reports/generate` | Générer rapport |
| GET | `/api/V1/analytics/reports/download/:file` | Télécharger |
| POST | `/api/V1/analytics/reports/environmental` | Impact environnemental |
| POST | `/api/V1/analytics/reports/routes-performance` | Performance tournées |

### ML Predictions
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/V1/analytics/ml/predict` | Prédire remplissage |
| GET | `/api/V1/analytics/ml/predict-critical` | Conteneurs critiques |
| GET | `/api/V1/analytics/ml/anomalies/:id` | Détecter anomalies |
| GET | `/api/V1/analytics/ml/defective-sensors` | Capteurs défaillants |
| POST | `/api/V1/analytics/ml/anomalies/:id/alerts` | Créer alertes |

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
