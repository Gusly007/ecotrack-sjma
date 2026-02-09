# 🚀 EcoTrack Containers API - Service Professionnel

API RESTful professionnelle pour la gestion des conteneurs écologiques intelligents.

## 📋 Table des matières

- [Caractéristiques](#caractéristiques)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Structure du projet](#structure-du-projet)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)

## ✨ Caractéristiques

- ✅ **Architecture MVC professionnelle** - Séparation des préoccupations
- ✅ **Gestion centralisée des erreurs** - Middleware d'erreur personnalisé
- ✅ **Validation robuste** - Validateurs réutilisables
- ✅ **Réponses API standardisées** - Format cohérent pour toutes les réponses
- ✅ **Logging des requêtes** - Traçabilité complète
- ✅ **Configuration externalisée** - Fichier `.env` pour les secrets
- ✅ **Documentation Swagger** - API interactive
- ✅ **Tests unitaires** - Couverture complète des modèles
- ✅ **PostGIS intégré** - Gestion géospatiale pour les coordonnées GPS
- ✅ **Transactions PostgreSQL** - Garantie d'intégrité des données
- ✅ **Historique d'audit** - Suivi des changements de statut
- ✅ **CORS et sécurité** - Headers de sécurité configurés

## 🔧 Prérequis

- Node.js >= 14.x
- PostgreSQL >= 12 avec PostGIS
- npm ou yarn

## 📦 Installation

### 1. Cloner et installer les dépendances

```bash
cd service-containers
npm install
```

### 2. Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos paramètres PostgreSQL
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=ecotrack
```

### 3. Initialiser la base de données

```bash
# Option 1: Script Node
npm run init-db

# Option 2: Via psql
psql -h localhost -U postgres -d ecotrack -f src/db/init-db-pg.sql
```

### 4. Démarrer le serveur

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## ⚙️ Configuration

### Variables d'environnement (.env)

```env
# Serveur
APP_PORT=3011
NODE_ENV=development

# PostgreSQL
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=ecotrack

# Logging
LOG_LEVEL=debug
```

## 📁 Structure du projet

```
service-containers/
├── src/
│   ├── config/
│   │   └── config.js           # Configuration centralisée
│   ├── controllers/            # Contrôleurs (logique HTTP)
│   │   ├── containercontroller.js
│   │   ├── zonecontroller.js
│   │   └── typeconteneurcontroller.js
│   ├── db/
│   │   ├── connexion.js        # Pool PostgreSQL
│   │   ├── init-db-pg.sql      # Schéma de base
│   │   └── test-db.js          # Tests de connexion
│   ├── middleware/             # Middleware personnalisé
│   │   ├── errorHandler.js     # Gestion centralisée des erreurs
│   │   └── requestLogger.js    # Logging des requêtes
│   ├── models/                 # Modèles (accès données)
│   │   ├── containermodel.js
│   │   ├── zonemodel.js
│   │   └── typeconteneurmodel.js
│   ├── services/               # Services (logique métier)
│   │   ├── containerservices.js
│   │   ├── zoneservices.js
│   │   └── typeconteneurservices.js
│   ├── utils/                  # Utilitaires
│   │   ├── ApiError.js        # Classe d'erreur personnalisée
│   │   ├── ApiResponse.js     # Formatage des réponses
│   │   └── Validators.js      # Validateurs réutilisables
│   ├── container.di.js         # Injection de dépendances
│   └── index.js                # Point d'entrée
├── routes/                     # Routes Express
│   ├── route.js               # Routes conteneurs
│   ├── zone.route.js          # Routes zones
│   └── typeconteneur.route.js # Routes types
├── test/                       # Tests unitaires
│   ├── container.test.js
│   └── zone.test.js
├── scripts/
│   └── init-db.js             # Script d'initialisation DB
├── .env.example               # Variables d'environnement (exemple)
├── index.js                   # Application principale
├── package.json               # Dépendances npm
└── README.md                  # Cette documentation
```

## 🚀 Utilisation

### Démarrer le serveur

```bash
npm start
```

### Accéder à la documentation

```
http://localhost:3011/api-docs
```

### Tests

```bash
# Tous les tests
npm test

# Tests en mode watch
npm test -- --watch

# Avec couverture
npm test -- --coverage
```

### Tests de connexion DB

```bash
npm run test-db
```

## 📚 API Documentation

### Format des réponses

#### Succès (200, 201, etc.)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Opération réussie",
  "data": { /* ... */ },
  "timestamp": "2026-01-13T10:30:00.000Z"
}
```

#### Erreur (400, 404, 500, etc.)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Requête invalide",
  "details": { /* ... */ },
  "timestamp": "2026-01-13T10:30:00.000Z"
}
```

### Endpoints principaux

#### Conteneurs
- `GET /api/containers` - Lister tous les conteneurs
- `POST /api/containers` - Créer un conteneur
- `GET /api/containers/:id` - Récupérer un conteneur
- `PATCH /api/containers/:id` - Mettre à jour un conteneur
- `PATCH /api/containers/:id/status` - Changer le statut
- `GET /api/containers/:id/status/history` - Historique du statut
- `DELETE /api/containers/:id` - Supprimer un conteneur

#### Zones
- `GET /api/zones` - Lister toutes les zones
- `POST /api/zones` - Créer une zone
- `GET /api/zones/:id` - Récupérer une zone
- `PATCH /api/zones/:id` - Mettre à jour une zone
- `DELETE /api/zones/:id` - Supprimer une zone

#### Santé
- `GET /health` - Vérifier que le serveur est actif

## 🏗️ Architecture

### Pattern MVC

```
Route (HTTP) 
  ↓
Controller (logique HTTP, validation)
  ↓
Service (logique métier, orchestration)
  ↓
Model (accès données, SQL)
  ↓
Database (PostgreSQL)
```

### Gestion des erreurs

Les erreurs sont centralisées via le middleware `errorHandler.js` :
- Capture et log automatiquement les erreurs
- Formate les réponses d'erreur de manière standardisée
- Gère les erreurs de base de données spécifiques
- Retourne les codes HTTP appropriés

### Validation

Les validateurs sont réutilisables via la classe `Validators` :
```javascript
Validators.validateGPS(latitude, longitude);
Validators.validateCapacite(capacite);
Validators.validateStatut(statut);
```

### Transactions

Les opérations critiques (changement de statut) utilisent les transactions PostgreSQL :
```javascript
BEGIN → SELECT → UPDATE → INSERT → COMMIT/ROLLBACK
```

## 🔐 Sécurité

- ✅ CORS configuré
- ✅ Validation des entrées
- ✅ Prepared statements contre l'injection SQL
- ✅ Gestion des erreurs sans exposition d'informations sensibles
- ✅ Logging des requêtes pour audit

## 📊 Monitoring

Les requêtes sont loggées automatiquement :
```
✅ GET /api/containers - 200 [45ms]
⚠️  POST /api/containers - 400 [12ms]
```

## 🤝 Contribution

1. Créer une branche pour votre feature
2. Écrire des tests
3. Soumettre une pull request

## 📄 Licence

MIT

---

**Besoin d'aide ?** Consultez la documentation Swagger : http://localhost:3011/api-docs
