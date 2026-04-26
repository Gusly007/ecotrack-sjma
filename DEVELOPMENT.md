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

# 4. Démarrer TOUS les services (PostgreSQL + PgAdmin + API)
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
# 1. Démarrer uniquement PostgreSQL + PgAdmin
docker compose up -d postgres pgadmin

# 2. Dans un terminal : Service Users
cd services/service-users
npm install
npm run dev

# 3. Dans un autre terminal : API Gateway
cd services/api-gateway
npm install
npm run dev
```

> **Note** : Le hot-reload fonctionne car `npm run dev` utilise `nodemon` qui surveille les fichiers locaux.

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
cd services/service-users && npm install && cd ..
cd services/api-gateway && npm install && cd ..

# 4. Exécuter les migrations
cd database && npm run migrate && cd ..

# 5. Insérer les données de test
cd database && npm run seed && cd ..

# 6. Démarrer les services (2 terminaux)
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

| Service | URL | Description |
|---------|-----|-------------|
| API Gateway | http://localhost:3000 | Point d'entrée API |
| Service Users | http://localhost:3010 | Service authentification |
| Swagger UI | http://localhost:3010/api-docs | Documentation API |
| PgAdmin | http://localhost:5050 | Interface PostgreSQL |
| PostgreSQL | localhost:5432 | Base de données |

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
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ecotrack.local", "password": "password123"}'

# Réponse : { "token": "eyJ...", "refreshToken": "eyJ...", "user": {...} }
```

---

## FAQ

### Q: Où s'exécutent les commandes `make` et `npm run migrate` ?

**R:** Sur votre machine hôte (votre ordinateur), pas dans un container Docker. Ces commandes se connectent à PostgreSQL qui tourne dans Docker via le port exposé (5432).

### Q: `docker compose up -d --build` exécute-t-il les migrations ?

**R:** Non. Cette commande :
- ✅ Construit les images Docker (api-gateway, service-users)
- ✅ Démarre PostgreSQL (image pré-construite)
- ✅ Démarre PgAdmin
- ❌ N'exécute PAS les migrations

Vous devez exécuter les migrations séparément :
```bash
cd database && npm run migrate
```

### Q: Comment avoir le hot-reload avec Docker ?

**R:** Le plus simple est de :
1. Démarrer uniquement PostgreSQL avec Docker : `docker compose up -d postgres pgadmin`
2. Lancer les services Node.js localement : `npm run dev`

Sinon, vous pouvez utiliser le fichier `docker-compose.override.yml` qui monte les volumes.

### Q: Comment reset complètement la base de données ?

```bash
# Option 1 : Garder les volumes, juste reset les données
cd database && npm run db:reset

# Option 2 : Supprimer aussi les volumes Docker (tout effacer)
docker compose down -v
docker compose up -d postgres pgadmin
cd database && npm run migrate && npm run seed
```

### Q: Comment créer une nouvelle migration ?

```bash
cd database
npm run migrate:create add_new_feature
# Crée : migrations/xxx_add_new_feature.sql
# Éditez le fichier, puis :
npm run migrate
```

### Q: Comment se connecter à PostgreSQL depuis le terminal ?

```bash
# Depuis votre machine (PostgreSQL dans Docker)
psql -h localhost -U ecotrack_user -d ecotrack

# Depuis l'intérieur du container PostgreSQL
docker exec -it ecotrack-postgres psql -U ecotrack_user -d ecotrack
```

### Q: Les services Docker ne démarrent pas, que faire ?

```bash
# Vérifier les logs
docker compose logs

# Vérifier que les ports ne sont pas utilisés
lsof -i :5432  # PostgreSQL
lsof -i :3000  # API Gateway
lsof -i :3010  # Service Users

# Reconstruire les images
docker compose down
docker compose up -d --build
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
docker compose up -d postgres pgadmin  # Juste la BDD
cd database && npm run migrate         # Migrations
cd database && npm run seed            # Données de test
cd services/service-users && npm run dev   # Terminal 1
cd services/api-gateway && npm run dev     # Terminal 2
# Développer avec hot-reload...
docker compose down                    # Arrêter la BDD
```

### Workflow sans Docker

```bash
# PostgreSQL installé localement
cd database && npm run migrate
cd database && npm run seed
cd services/service-users && npm run dev   # Terminal 1
cd services/api-gateway && npm run dev     # Terminal 2
```
