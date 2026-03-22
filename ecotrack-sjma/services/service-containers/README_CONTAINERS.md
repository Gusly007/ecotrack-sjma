# EcoTrack Containers Service

Microservice pour la gestion des conteneurs intelligents de la plateforme EcoTrack avec notifications en temps réel via Socket.IO.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [API REST](#api-rest)
- [Socket.IO](#socketio)
- [Tests](#tests)
- [Docker](#docker)
- [Architecture](#architecture)
- [Sécurité](#sécurité)
- [Documentation](#documentation)

## Vue d'ensemble

Le service Containers est un microservice Node.js dédié à la gestion complète des conteneurs de collecte des déchets. Il offre:

- API REST complète pour les opérations CRUD
- Notifications temps réel via Socket.IO
- Statistiques et monitoring avancés
- Validation robuste des données
- Documentation Swagger interactive
- 174 tests automatisés

## Fonctionnalités

### Gestion des conteneurs
- Création et modification de conteneurs
- Changement de statut (ACTIF, INACTIF, EN_MAINTENANCE)
- Génération automatique d'UID uniques (CNT-XXXXXXXXXXXX)
- Historique complet des changements de statut
- Suppression avec gestion des dépendances

### Statistiques et monitoring
- Tableau de bord global
- Distribution des niveaux de remplissage
- Statistiques par zone géographique
- Statistiques par type de conteneur
- Alertes et conteneurs critiques
- Historique de remplissage
- Stats de collecte et maintenance

### Notifications temps réel
- Abonnement par zone géographique
- Notifications de changement de statut
- Support multi-clients
- Gestion automatique de la reconnexion

### Zones géographiques
- Gestion des zones de collecte
- Filtrage géospatial avec PostGIS
- Recherche par rayon

### Types de conteneurs
- Catalogue des types disponibles
- Association conteneurs-types

## Stack technique

### Backend
- **Node.js** 20+ - Runtime JavaScript
- **Express** 5 - Framework web
- **PostgreSQL** - Base de données relationnelle
- **PostGIS** - Extension géospatiale
- **Socket.IO** 4.8.3 - Communication temps réel

### Validation et sécurité
- **Joi** 17 - Validation des schémas
- **Helmet** 8 - Sécurité HTTP headers
- **CORS** - Gestion des origines

### Documentation et tests
- **Swagger/OpenAPI** - Documentation API
- **Jest** - Framework de tests
- **Supertest** - Tests HTTP

### DevOps
- **Docker** - Conteneurisation
- **nodemon** - Hot-reload développement

## Installation

### Prérequis

- Node.js >= 18.0.0
- PostgreSQL >= 12
- Extension PostGIS installée
- npm ou yarn

### Étapes d'installation

```bash
# Cloner le repository
git clone https://github.com/Gusly007/ecotrack-sjma.git
cd ecotrack-sjma/services/service-containers

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Lancer le service
npm run dev
```

## Configuration

### Variables d'environnement

Créer un fichier `.env` à partir de `.env.example`:

```env
# Port du serveur
APP_PORT=3011

# Environnement
NODE_ENV=development

# PostgreSQL
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password_here
PGDATABASE=ecotrack

# Logging
LOG_LEVEL=debug

# API
API_VERSION=1.0.0
API_BASE_URL=http://localhost:3011/api
```

### Configuration de la base de données

Le service nécessite une base de données PostgreSQL avec l'extension PostGIS:

```sql
CREATE DATABASE ecotrack;
\c ecotrack
CREATE EXTENSION IF NOT EXISTS postgis;
```

Voir le dossier `database/` à la racine du projet pour les migrations complètes.

## Utilisation

### Démarrage en développement

```bash
npm run dev
```

Le service sera accessible sur http://localhost:3011

### Démarrage en production

```bash
npm start
```

### Endpoints principaux

- API REST: http://localhost:3011/api
- Documentation Swagger: http://localhost:3011/api-docs
- Health check: http://localhost:3011/health
- Socket.IO: ws://localhost:3011

## API REST

### Conteneurs

#### Lister les conteneurs
```http
GET /api/containers?page=1&limit=20
```

Paramètres de query:
- `page` (number): Numéro de page (défaut: 1)
- `limit` (number): Éléments par page (défaut: 20, max: 100)
- `statut` (string): Filtrer par statut
- `id_zone` (number): Filtrer par zone
- `id_type_conteneur` (number): Filtrer par type

Réponse:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### Créer un conteneur
```http
POST /api/containers
Content-Type: application/json

{
  "id_zone": 1,
  "id_type_conteneur": 1,
  "localisation": {
    "latitude": 48.8566,
    "longitude": 2.3522
  },
  "capacite": 1000,
  "niveau_remplissage": 25,
  "statut": "ACTIF"
}
```

#### Obtenir un conteneur
```http
GET /api/containers/:id
```

#### Modifier un conteneur
```http
PATCH /api/containers/:id
Content-Type: application/json

{
  "capacite": 1200,
  "niveau_remplissage": 30
}
```

#### Changer le statut
```http
PATCH /api/containers/:id/status
Content-Type: application/json

{
  "statut": "EN_MAINTENANCE"
}
```

#### Historique des statuts
```http
GET /api/containers/:id/status/history
```

#### Supprimer un conteneur
```http
DELETE /api/containers/:id
```

### Statistiques

#### Tableau de bord global
```http
GET /api/stats/dashboard
```

Retourne:
- Statistiques globales
- Distribution des niveaux
- Stats par zone
- Stats par type
- Alertes actives
- Conteneurs critiques

#### Statistiques globales
```http
GET /api/stats
```

#### Distribution des niveaux de remplissage
```http
GET /api/stats/fill-levels
```

#### Statistiques par zone
```http
GET /api/stats/by-zone?zoneId=1
```

#### Statistiques par type
```http
GET /api/stats/by-type?typeId=1
```

#### Alertes actives
```http
GET /api/stats/alerts
```

#### Conteneurs critiques
```http
GET /api/stats/critical?threshold=80&includeInactive=false
```

Paramètres:
- `threshold` (number): Seuil de remplissage (défaut: 80, min: 0, max: 100)
- `includeInactive` (boolean): Inclure les inactifs (défaut: false)

#### Historique de remplissage
```http
GET /api/stats/containers/:id/history?days=30
```

Paramètres:
- `days` (number): Nombre de jours (défaut: 30, min: 1, max: 365)
- Ou `startDate` et `endDate` au format ISO 8601

#### Statistiques de collecte
```http
GET /api/stats/collections?startDate=2026-01-01&endDate=2026-01-31
```

#### Statistiques de maintenance
```http
GET /api/stats/maintenance?startDate=2026-01-01&endDate=2026-01-31
```

### Zones

#### Lister les zones
```http
GET /api/zones
```

### Types de conteneurs

#### Lister les types
```http
GET /api/typecontainers
```

### Health check

```http
GET /health
```

Retourne l'état des services:
```json
{
  "status": "OK",
  "timestamp": "2026-02-09T20:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "services": {
    "api": "healthy",
    "socketio": "healthy",
    "database": "healthy"
  }
}
```

## Socket.IO

### Connexion

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3011');

socket.on('connect', () => {
  console.log('Connecté:', socket.id);
});
```

### Abonnement aux notifications

```javascript
// S'abonner aux notifications d'une zone
socket.emit('subscribe-zone', 1);

// Se désabonner
socket.emit('unsubscribe-zone', 1);
```

### Réception des notifications

```javascript
socket.on('container:status-changed', (data) => {
  console.log('Changement de statut:', data);
  // {
  //   id_conteneur: 1,
  //   uid: "CNT-ABC123XYZ",
  //   ancien_statut: "ACTIF",
  //   nouveau_statut: "EN_MAINTENANCE",
  //   date_changement: "2026-02-09T20:00:00.000Z",
  //   id_zone: 1
  // }
});
```

### Gestion des erreurs

```javascript
socket.on('error', (error) => {
  console.error('Erreur Socket.IO:', error);
});

socket.on('disconnect', () => {
  console.log('Déconnecté');
});
```

### Test interactif

```bash
npm run test:socket:interactive
```

Permet de tester les fonctionnalités Socket.IO de manière interactive.

## Tests

### Exécuter tous les tests

```bash
npm test
```

### Tests unitaires

```bash
npm run test:unit
```

Couvre:
- Controllers (5 suites)
- Services (4 suites)
- Models (3 suites)
- Middlewares (3 suites)
- Utilitaires (2 suites)

Total: 174 tests

### Tests d'intégration

```bash
npm run test:integration
```

Nécessite une base de données PostgreSQL.

### Tests manuels

#### Test Socket.IO automatique
```bash
npm run test:socket:client
```

#### Test Socket.IO interactif
```bash
npm run test:socket:interactive
```

#### Test API complet
```bash
node test-api-complete.js
```

Teste tous les endpoints principaux.

### Coverage

Pour générer un rapport de couverture:

```bash
npm test -- --coverage
```

## Docker

### Build de l'image

```bash
docker build -t ecotrack-containers:1.0.0 .
```

### Exécution du conteneur

```bash
docker run -d \
  --name containers-service \
  -p 3011:3011 \
  -e PGHOST=postgres \
  -e PGDATABASE=ecotrack \
  -e PGUSER=postgres \
  -e PGPASSWORD=password \
  ecotrack-containers:1.0.0
```

### Développement avec Docker

```bash
docker build -f Dockerfile.dev -t ecotrack-containers:dev .

docker run -d \
  --name containers-dev \
  -p 3011:3011 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/index.js:/app/index.js \
  ecotrack-containers:dev
```

### Healthcheck

Le conteneur inclut un healthcheck automatique:
- Intervalle: 10 secondes
- Timeout: 5 secondes
- Retries: 5

## Architecture

### Structure du projet

```
service-containers/
├── src/
│   ├── config/           # Configuration
│   │   └── config.js
│   ├── controllers/      # Contrôleurs HTTP
│   │   ├── container-controller.js
│   │   ├── stats-controller.js
│   │   ├── type-conteneur-controller.js
│   │   └── zone-controller.js
│   ├── repositories/     # Repositories (accès données)
│   │   ├── container-repository.js
│   │   ├── stats-repository.js
│   │   ├── type-conteneur-repository.js
│   │   └── zone-repository.js
│   ├── validators/       # Validateurs (schémas Joi)
│   │   ├── container.validator.js
│   │   ├── zone.validator.js
│   │   └── type-conteneur.validator.js
│   ├── services/         # Logique métier
│   │   ├── container-services.js
│   │   ├── stats-service.js
│   │   ├── type-conteneur-services.js
│   │   └── zone-services.js
│   ├── routes/           # Définition des routes
│   │   ├── container.route.js
│   │   ├── stats.route.js
│   │   ├── typecontainer.route.js
│   │   └── zone.route.js
│   ├── middleware/       # Middlewares
│   │   ├── error-handler.js
│   │   ├── request-logger.js
│   │   ├── socket-middleware.js
│   │   └── validate-request.js
│   ├── socket/           # Socket.IO
│   │   └── socket-service.js
│   ├── db/               # Base de données
│   │   └── connexion.js
│   ├── utils/            # Utilitaires
│   │   ├── api-error.js
│   │   ├── api-response.js
│   │   └── Validators.js
│   └── container-di.js   # Injection de dépendances
├── test/                 # Tests
│   ├── unit/             # Tests unitaires
│   ├── integration/      # Tests d'intégration
│   └── manual/           # Tests manuels
├── docs/                 # Documentation
├── index.js              # Point d'entrée
├── package.json
├── Dockerfile
├── Dockerfile.dev
├── healthcheck.cjs
└── README.md
```

### Pattern MVC

Le service suit le pattern Model-View-Controller:

```
Request → Router → Controller → Service → Repository → DB
                                    ↓
Response ← Controller ← Service ← Repository ← DB
```

### Injection de dépendances

Le fichier `container-di.js` gère l'injection de dépendances:

```javascript
const { pool } = require('./db/connexion');

// Repositories
const containerRepository = new ContainerRepository(pool);
const statsRepository = new StatsRepository(pool);

// Services
const containerService = new ContainerService(containerRepository);
const statsService = new StatsService(statsRepository);

// Controllers
const containerController = new ContainerController(containerService);
const statsController = new StatsController(statsService);

module.exports = {
  containerController,
  statsController,
  // ...
};
```

## Sécurité

### En-têtes HTTP

Le service utilise Helmet pour sécuriser les en-têtes HTTP:

```javascript
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
```

### Validation des données

Toutes les entrées utilisateur sont validées avec Joi:

- Paramètres de query
- Paramètres d'URL
- Corps de requête
- Types de données
- Formats et contraintes

### Protection SQL

- Requêtes préparées (parameterized queries)
- Validation stricte des types
- Échappement automatique par pg

### Limitation de payload

- JSON: 10MB maximum
- URL-encoded: 10MB maximum

### CORS

Configuration CORS pour autoriser les origines spécifiques.

## Documentation

### Documentation API

Documentation Swagger disponible sur:
http://localhost:3011/api-docs

### Documentation technique

- [Architecture](docs/ARCHITECTURE.md) - Design et patterns
- [Socket.IO](docs/SOCKET_IO.md) - Notifications temps réel
- [Tests](docs/TESTING.md) - Guide des tests
- [Déploiement](docs/DEPLOYMENT.md) - Guide de production
- [Configuration](docs/SETUP.md) - Configuration détaillée

### Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique des versions.

### Rapport de tests

Voir [TEST_REPORT.md](TEST_REPORT.md) pour le rapport détaillé des tests.

## Scripts npm

```bash
# Développement
npm run dev              # Démarrage avec hot-reload

# Production
npm start                # Démarrage production

# Tests
npm test                 # Tous les tests
npm run test:unit        # Tests unitaires
npm run test:integration # Tests d'intégration
npm run test:socket:client # Test Socket.IO automatique
npm run test:socket:interactive # Test Socket.IO interactif
```

## Troubleshooting

### Le service ne démarre pas

Vérifier:
1. PostgreSQL est démarré
2. La base de données "ecotrack" existe
3. Les variables d'environnement sont correctes
4. Le port 3011 est disponible

### Erreur de connexion DB

```
Error: database "ecotrack" does not exist
```

Solution:
```sql
CREATE DATABASE ecotrack;
\c ecotrack
CREATE EXTENSION postgis;
```

### Health check retourne 503

C'est normal si:
- La base de données n'est pas accessible
- Les migrations ne sont pas appliquées

### Les notifications Socket.IO ne fonctionnent pas

Vérifier:
1. Le client est connecté
2. L'abonnement à la zone est actif
3. Le changement de statut est bien effectué via l'API
4. Le conteneur appartient à la zone abonnée

## Licence

Ce projet fait partie du projet EcoTrack SJMA.

