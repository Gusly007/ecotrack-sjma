# Services EcoTrack

Ce dossier contient tous les microservices de l'application EcoTrack.

## Structure

```
services/
├── api-gateway/        # API Gateway - Point d'entrée unique (port 3000)
├── service-users/      # Service d'authentification et gestion utilisateurs (port 3010)
├── service-containers/ # Service gestion des conteneurs (port 3011) - À venir
├── service-routes/     # Service gestion des tournées (port 3012) - À venir
├── service-iot/        # Service IoT et capteurs (port 3013) - À venir
├── service-gamifications/ # Service gamification (port 3014) - À venir
└── service-analytics/  # Service analytics et reporting (port 3015) - À venir
```

## Services Actuels

### 🚪 API Gateway (port 3000)
- Point d'entrée unique pour toutes les requêtes
- Proxie vers les microservices backend
- Rate limiting global
- CORS configuration
- Health check: `GET /health`

### 👤 Service Users (port 3010)
- Authentification (login, register, refresh token)
- Gestion des utilisateurs et profils
- Gestion des rôles et permissions
- Upload d'avatars
- Notifications utilisateur
- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

## Démarrage Local

### Avec Docker Compose (Recommandé)
```bash
docker compose up -d
```

### En mode développement
```bash
# Terminal 1 - Service Users
cd services/service-users
npm install
npm run dev

# Terminal 2 - API Gateway
cd services/api-gateway
npm install
npm run dev
```

## Variables d'Environnement

Chaque service a son propre fichier `.env`. Voir `.env.example` à la racine du projet.

## Tests

```bash
# Tests service-users
cd services/service-users
npm test
npm run test:coverage

# Tests api-gateway (à venir)
cd services/api-gateway
npm test
```

## Architecture

Les services communiquent entre eux via HTTP/REST. L'API Gateway fait office de proxy intelligent qui route les requêtes vers le bon microservice selon le préfixe d'URL :

- `/api/auth/*` → service-users (authentification)
- `/api/users/*` → service-users (gestion utilisateurs)
- `/api/containers/*` → service-containers (à venir)
- `/api/routes/*` → service-routes (à venir)
- etc.

## Base de Données

Tous les services utilisent une base de données PostgreSQL hébergée sur Neon :
- Host: `ep-blue-credit-agbgkufh.c-2.eu-central-1.aws.neon.tech`
- Database: `neondb`

Chaque service peut avoir son propre schéma dans la base de données pour garantir l'isolation des données.

## CI/CD

Le pipeline GitHub Actions (`.github/workflows/ci.yml`) :
1. **Lint** : Vérifie le code de tous les services
2. **Test** : Lance les tests unitaires (service-users)
3. **Security** : Audit npm des dépendances
4. **Build** : Construit les images Docker
5. **Test Docker** : Valide les conteneurs en PR

## Ajouter un Nouveau Service

1. Créer un dossier dans `services/`
2. Initialiser avec `npm init`
3. Créer un `Dockerfile` multi-stage
4. Ajouter le service dans `docker-compose.yml`
5. Ajouter le service dans `.github/workflows/ci.yml` (matrix)
6. Configurer le proxy dans l'api-gateway
