# EcoTrack - Service Routes

Microservice de gestion des **tournées de collecte** pour la plateforme EcoTrack.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Installation rapide](#installation-rapide)
- [API REST](#api-rest)
- [Tests](#tests)
- [Docker](#docker)
- [Architecture](#architecture)
- [Documentation](#documentation)

## Vue d'ensemble

Le Service Routes est un microservice Node.js dédié à la gestion complète des tournées de collecte des déchets. Il offre :

- API REST complète pour la gestion des tournées, collectes, véhicules et stats
- Optimisation automatique des itinéraires (Nearest Neighbor + 2-opt)
- Suivi en temps réel de la progression des collectes agent
- Signalement d'anomalies sur les conteneurs pendant les tournées
- Tableau de bord et KPIs de performance
- Documentation Swagger interactive
- Métriques Prometheus
- 141 tests unitaires

## Fonctionnalités

### Gestion des tournées
- Création avec code auto-généré (`T-YYYY-NNN`)
- Filtrage par statut, zone, agent, dates
- Changement de statut avec audit trail (`historique_statut`)
- Suppression protégée (impossible si EN_COURS)

### Optimisation des itinéraires
- Algorithme **Nearest Neighbor** (O(n²)) — rapide
- Algorithme **2-opt** — optimal (-15% à -45% de distance)
- Filtre par seuil de remplissage (ex. ≥ 70%)
- Calcul Haversine pour distances GPS précises
- Création automatique des étapes ordonnées avec heure estimée

### Suivi des collectes (Agent terrain)
- Enregistrement collecte avec quantité (transaction atomique)
- Clôture automatique de la tournée si toutes étapes faites
- Signalement anomalies : `CONTENEUR_INACCESSIBLE`, `CONTENEUR_ENDOMMAGE`, `CAPTEUR_DEFAILLANT`
- Identification agent via header `X-User-Id` (injecté par l'API Gateway)

### Statistiques & KPIs
- Dashboard global : tournées, collectes 30j, véhicules
- KPIs : taux complétion, distances, quantité, CO2 économisé
- Collectes par date et zone (filtrable)
- Comparaison algorithmes NN vs 2-opt

### Export & Visualisation
- Génération PDF de la feuille de route (itinéraire, conteneurs, heures)
- Export GeoJSON pour affichage sur carte interactive

### Gestion des véhicules
- CRUD complet du parc de véhicules
- Comptage des tournées actives par véhicule

## Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| **Node.js** | 20 | Runtime |
| **Express** | 5.2.1 | Framework HTTP |
| **PostgreSQL + PostGIS** | 16 | Base de données avec support GPS |
| **pg** | 8.x | Driver PostgreSQL (Pool) |
| **Joi** | 17.x | Validation des données entrantes |
| **Pino** | 9.x | Logger haute performance |
| **prom-client** | 15.x | Métriques Prometheus |
| **swagger-jsdoc** | 6.x | Documentation OpenAPI |
| **Jest** | 30.x | Tests unitaires |

## Installation rapide

### Prérequis

- Node.js 20+
- PostgreSQL 16 + PostGIS
- npm 9+

### 1. Installer les dépendances

```bash
cd services/service-routes
npm install
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
# Éditer .env :
APP_PORT=3012
DATABASE_URL=postgresql://ecotrack_user:ecotrack_password@localhost:5432/ecotrack
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Démarrer

```bash
npm run dev       # Développement (nodemon)
npm start         # Production
```

**Succès :**
```
Service Routes démarré sur le port 3012
Swagger UI : http://localhost:3012/api-docs
Health     : http://localhost:3012/health
Metrics    : http://localhost:3012/metrics
```

## API REST

Base URL (via Gateway) : `http://localhost:3000/api/routes`
Base URL (direct)      : `http://localhost:3012/api/routes`

### Endpoints principaux

```
# Tournées
GET    /tournees                        # Liste paginée + filtres
POST   /tournees                        # Créer une tournée
POST   /optimize                        # Créer une tournée optimisée automatiquement
GET    /tournees/active                 # Tournées EN_COURS
GET    /my-tournee                      # Tournée du jour de l'agent (X-User-Id)
GET    /tournees/:id                    # Détail tournée
PATCH  /tournees/:id                    # Mise à jour partielle
PATCH  /tournees/:id/statut             # Changer le statut
DELETE /tournees/:id                    # Supprimer
GET    /tournees/:id/etapes             # Liste des étapes avec GPS
GET    /tournees/:id/progress           # Progression en temps réel

# Collectes & Anomalies
POST   /tournees/:id/collecte           # Valider une collecte
POST   /tournees/:id/anomalie           # Signaler une anomalie
GET    /tournees/:id/collectes          # Collectes d'une tournée
GET    /tournees/:id/anomalies          # Anomalies d'une tournée

# Véhicules
GET    /vehicules                       # Liste paginée
POST   /vehicules                       # Créer un véhicule
GET    /vehicules/:id                   # Détail
PATCH  /vehicules/:id                   # Mise à jour
DELETE /vehicules/:id                   # Supprimer

# Statistiques
GET    /stats/dashboard                 # Compteurs globaux
GET    /stats/kpis                      # KPIs de performance
GET    /stats/collectes                 # Stats par date et zone
GET    /stats/algorithm-comparison      # Comparaison NN vs 2-opt

# Export
GET    /tournees/:id/pdf                # Générer feuille de route PDF
GET    /tournees/:id/map                # Données cartographiques GeoJSON

# Infrastructure
GET    /health                          # Health check (SELECT 1)
GET    /metrics                         # Métriques Prometheus
GET    /api-docs                        # Swagger UI
```

> Documentation interactive complète : **http://localhost:3012/api-docs**

## Tests

```bash
npm test
```

**Résultat : 141 tests, 0 échec, 12 suites**

| Suite | Tests |
|---|---|
| OptimizationService | 21 |
| TourneeService | 20 |
| CollecteService | 16 |
| TourneeController | 18 |
| CollecteController | 12 |
| VehiculeService | 12 |
| VehiculeController | 10 |
| StatsService | 9 |
| StatsController | 8 |
| ApiError + ApiResponse + ErrorHandler | 15 |

> Guide complet : [docs/TESTING.md](./docs/TESTING.md)

## Docker

### Démarrage avec Docker Compose

```bash
# Depuis la racine du projet
docker compose up service-routes postgres migrations -d

# Logs
docker compose logs -f service-routes

# Health check
curl http://localhost:3012/health
```

### Variables Docker Compose

```yaml
environment:
  APP_PORT: 3012
  DATABASE_URL: postgresql://ecotrack_user:ecotrack_password@postgres:5432/ecotrack
  NODE_ENV: production
  LOG_LEVEL: info
```

> Guide complet : [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## Architecture

```
service-routes/
├── index.js                    # Entrée : Express, Swagger, Prometheus, routes
├── healthcheck.cjs             # Docker healthcheck (HTTP → /health)
├── Dockerfile                  # Node 20 alpine
├── .env.example
│
├── src/
│   ├── config/config.js        # Variables d'environnement
│   ├── db/connexion.js         # Pool PostgreSQL
│   ├── middleware/
│   │   ├── error-handler.js    # Gestion centralisée des erreurs
│   │   └── request-logger.js   # Logger Pino par requête
│   ├── validators/
│   │   ├── tournee.validator.js # Joi schemas tournée/optimize/anomalie
│   │   └── collecte.validator.js # Joi schemas collecte/vehicule
│   ├── repositories/           # Couche d'accès aux données (SQL)
│   │   ├── tournee-repository.js
│   │   ├── collecte-repository.js
│   │   ├── vehicule-repository.js
│   │   └── stats-repository.js
│   ├── services/               # Logique métier
│   │   ├── optimization-service.js  # Haversine, NN, 2-opt
│   │   ├── tournee-service.js
│   │   ├── collecte-service.js
│   │   ├── vehicule-service.js
│   │   └── stats-service.js
│   ├── controllers/            # Handlers HTTP (request → response)
│   │   ├── tournee-controller.js
│   │   ├── collecte-controller.js
│   │   ├── vehicule-controller.js
│   │   └── stats-controller.js
│   ├── routes/                 # Définitions des routes + Swagger JSDoc
│   │   ├── tournee.route.js
│   │   ├── collecte.route.js
│   │   ├── vehicule.route.js
│   │   └── stats.route.js
│   └── di.js                   # Injection de dépendances
│
├── test/unit/                  # 141 tests unitaires Jest
│   ├── utils/
│   ├── middleware/
│   ├── services/
│   └── controllers/
│
└── docs/                       # Documentation technique
    ├── INDEX.md
    ├── ARCHITECTURE.md
    ├── SETUP.md
    ├── API.md
    ├── ALGORITHMS.md
    ├── TESTING.md
    └── DEPLOYMENT.md
```

> Architecture détaillée : [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## Documentation

| Guide | Description |
|---|---|
| [docs/INDEX.md](./docs/INDEX.md) | Index de toute la documentation |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Architecture, patterns, DI |
| [docs/SETUP.md](./docs/SETUP.md) | Installation et configuration |
| [docs/API.md](./docs/API.md) | Référence complète des endpoints |
| [docs/ALGORITHMS.md](./docs/ALGORITHMS.md) | Algorithmes d'optimisation |
| [docs/TESTING.md](./docs/TESTING.md) | Guide des tests unitaires |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Déploiement Docker |

---

**Port** : 3012 | **Version** : 1.0.0 | **Status** : Production Ready
