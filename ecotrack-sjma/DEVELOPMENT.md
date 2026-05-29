# Guide de Développement EcoTrack

Ce guide explique comment lancer le projet en développement, avec ou sans Docker.

---

## Table des matières

- [Prérequis](#prérequis)
- [Option 1 : Développement avec Docker (Recommandé)](#option-1--développement-avec-docker-recommandé)
- [Option 2 : Développement sans Docker](#option-2--développement-sans-docker)
- [Commandes de base de données](#commandes-de-base-de-données)
- [Accès aux services](#accès-aux-services)
- [Utilisateurs de test](#utilisateurs-de-test)
- [FAQ](#faq)

---

## Prérequis

### Avec Docker
- Docker Desktop (v20+)
- Docker Compose (v2+)
- Make (optionnel, pour les commandes rapides)

### Sans Docker
- Node.js 20+
- PostgreSQL 16+ avec PostGIS
- Redis 6+
- Kafka 3+ (optionnel — dégradé sans Kafka)
- npm ou yarn

---

## Option 1 : Développement avec Docker (Recommandé)

### Première installation

```bash
# 1. Cloner le projet
git clone <repo-url>
cd ecotrack-sjma

# 2. Copier le fichier d'environnement
cp .env.example .env

# 3. Installer les dépendances locales (pour les migrations)
cd database && npm install && cd ..

# 4. Démarrer TOUS les services
docker compose up -d --build

# 5. Attendre que PostgreSQL soit prêt (~10 secondes)
docker compose logs -f postgres
# Attendre "database system is ready to accept connections"
# Ctrl+C pour quitter les logs

# 6. Exécuter les migrations
cd database && npm run migrate && cd ..

# 7. Insérer les données de test
cd database && npm run seed && cd ..
```

### Commandes quotidiennes

```bash
# Démarrer les services
docker compose up -d

# Voir les logs
docker compose logs -f

# Arrêter les services
docker compose down

# Reconstruire après modification du Dockerfile
docker compose up -d --build
```

### Avec Makefile (plus simple)

```bash
make up              # Démarrer tous les services
make down            # Arrêter
make logs            # Voir les logs
make db-migrate      # Exécuter les migrations
make db-seed         # Insérer les données de test
make db-reset        # Reset complet de la BDD
```

### Mode développement avec hot-reload

Pour avoir le hot-reload (rechargement automatique du code) :

```bash
# 1. Démarrer les dépendances (BDD, Redis, Kafka, monitoring)
docker compose up -d postgres pgadmin redis kafka zookeeper kafka-ui

# 2. Lancer chaque service dans un terminal séparé
cd services/api-gateway && npm run dev          # Terminal 1
cd services/service-users && npm run dev        # Terminal 2
cd services/service-containers && npm run dev   # Terminal 3
cd services/service-routes && npm run dev       # Terminal 4
cd services/service-iot && npm run dev          # Terminal 5
cd services/service-gamifications && npm run dev  # Terminal 6
cd services/service-analytics && npm run dev    # Terminal 7
cd services/service-notification-gestionnaire-admin && npm run dev  # Terminal 8
```

> Le hot-reload fonctionne car `npm run dev` utilise `nodemon` qui surveille les fichiers locaux.

---

## Option 2 : Développement sans Docker

### Installation de PostgreSQL

#### macOS (Homebrew)
```bash
brew install postgresql@16 postgis
brew services start postgresql@16
```

#### Ubuntu/Debian
```bash
sudo apt install postgresql-16 postgresql-16-postgis-3
sudo systemctl start postgresql
```

#### Windows
Télécharger depuis https://www.postgresql.org/download/windows/
Installer PostGIS via Stack Builder.

### Configuration de la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer l'utilisateur et la base
CREATE USER ecotrack_user WITH PASSWORD 'ecotrack_password';
CREATE DATABASE ecotrack OWNER ecotrack_user;
GRANT ALL PRIVILEGES ON DATABASE ecotrack TO ecotrack_user;

# Se connecter à la base ecotrack
\c ecotrack

# Activer PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Quitter
\q
```

### Lancer le projet

```bash
# 1. Copier le fichier d'environnement
cp .env.example .env

# 2. Vérifier que DATABASE_URL pointe vers votre PostgreSQL local
# DATABASE_URL=postgresql://ecotrack_user:ecotrack_password@localhost:5432/ecotrack

# 3. Installer les dépendances
cd database && npm install && cd ..
cd services/service-users && npm install && cd ../..
cd services/api-gateway && npm install && cd ../..

# 4. Exécuter les migrations
cd database && npm run migrate && cd ..

# 5. Insérer les données de test
cd database && npm run seed && cd ..

# 6. Démarrer les services (terminaux séparés)
# Terminal 1:
cd services/service-users && npm run dev

# Terminal 2:
cd services/api-gateway && npm run dev
```

---

## Commandes de base de données

Toutes les commandes s'exécutent depuis votre machine (hôte), **pas dans un container**.

### Migrations

| Commande | Description |
|----------|-------------|
| `cd database && npm run migrate` | Appliquer toutes les migrations |
| `cd database && npm run migrate:down` | Annuler la dernière migration |
| `cd database && npm run migrate:status` | Voir le statut des migrations |
| `cd database && npm run migrate:create nom_migration` | Créer une nouvelle migration |

### Seeds (données de test)

| Commande | Description |
|----------|-------------|
| `cd database && npm run seed` | Insérer les données de test |
| `cd database && npm run seed:fresh` | Vider les tables puis insérer |

### Reset

| Commande | Description |
|----------|-------------|
| `cd database && npm run db:fresh` | Supprimer toutes les tables |
| `cd database && npm run db:reset` | Reset complet (fresh + migrate + seed) |
| `cd database && npm run db:status` | Afficher le statut de la BDD |

### Via Makefile

```bash
make db-migrate       # npm run migrate
make db-migrate-down  # npm run migrate:down
make db-seed          # npm run seed
make db-fresh         # npm run db:fresh
make db-reset         # npm run db:reset
make db-status        # npm run db:status
```

---

## Accès aux services

### Microservices

| Service | URL | Swagger |
|---------|-----|---------|
| API Gateway | http://localhost:3000 | http://localhost:3000/api-docs |
| service-users | http://localhost:3010 | http://localhost:3010/api-docs |
| service-containers | http://localhost:3011 | http://localhost:3011/api-docs |
| service-routes | http://localhost:3012 | http://localhost:3012/api-docs |
| service-iot | http://localhost:3013 | http://localhost:3013/api-docs |
| service-gamifications | http://localhost:3014 | http://localhost:3014/api-docs |
| service-analytics | http://localhost:3015 | http://localhost:3015/api-docs |
| service-notification-gestionnaire-admin | http://localhost:3016 | http://localhost:3016/api-docs |

### Infrastructure

| Service | URL | Description |
|---------|-----|-------------|
| PgAdmin | http://localhost:5050 | Interface PostgreSQL |
| PostgreSQL | localhost:5432 | Base de données principale |
| PostgreSQL (service-notification) | localhost:5435 | Port local Docker |
| Redis | localhost:6379 | Cache et sessions |
| Kafka | localhost:9092 | Message broker |
| Kafka UI | http://localhost:8080 | Interface web Kafka |
| Prometheus | http://localhost:9090 | Metriques |
| Grafana | http://localhost:3001 | Dashboards |

### Credentials PgAdmin

- **Email** : `admin@ecotrack.local`
- **Password** : `admin`

### Credentials PostgreSQL

- **Host** : `localhost` (ou `postgres` depuis un container)
- **Port** : `5432`
- **Database** : `ecotrack`
- **User** : `ecotrack_user`
- **Password** : `ecotrack_password`

---

## Utilisateurs de test

Après avoir exécuté les seeds, ces utilisateurs sont disponibles :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@ecotrack.local | password123 | ADMIN |
| gestionnaire@ecotrack.local | password123 | GESTIONNAIRE |
| agent1@ecotrack.local | password123 | AGENT |
| agent2@ecotrack.local | password123 | AGENT |
| citoyen1@ecotrack.local | password123 | CITOYEN |
| citoyen2@ecotrack.local | password123 | CITOYEN |
| citoyen3@ecotrack.local | password123 | CITOYEN |

### Tester l'authentification

```bash
# Login
curl -X POST http://localhost:3000/api/V1/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ecotrack.local", "password": "password123"}'

# Réponse : { "token": "eyJ...", "refreshToken": "eyJ...", "user": {...} }
```

---

## Résumé des workflows

### Workflow Docker complet

```bash
docker compose up -d --build    # Démarrer tout
cd database && npm run migrate  # Migrations
cd database && npm run seed     # Données de test
# Développer...
docker compose down             # Arrêter
```

### Workflow hybride (recommandé pour le dev)

```bash
docker compose up -d postgres pgadmin redis kafka zookeeper kafka-ui  # Dépendances
cd database && npm run migrate         # Migrations
cd database && npm run seed            # Données de test
cd services/service-users && npm run dev             # Terminal 1
cd services/api-gateway && npm run dev               # Terminal 2
# Ajouter d'autres services au besoin...
docker compose down                    # Arrêter la BDD
```

### Workflow sans Docker

```bash
# PostgreSQL, Redis, Kafka installés localement
cd database && npm run migrate
cd database && npm run seed
cd services/service-users && npm run dev   # Terminal 1
cd services/api-gateway && npm run dev     # Terminal 2
```
