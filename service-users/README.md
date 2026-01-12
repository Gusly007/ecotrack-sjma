# Service Users

Service d'authentification, de notifications et de gestion des rôles pour EcoTrack.

## Installation

\`\`\`bash
npm install
\`\`\`

## Configuration

\`\`\`bash
cp .env.example .env
# Éditer .env avec vos valeurs PostgreSQL
\`\`\`

## Lancer

\`\`\`bash
npm run dev        # Développement
npm start          # Production
\`\`\`

Swagger est disponible sur `http://localhost:3010/api-docs` et l'endpoint de santé sur `http://localhost:3010/health`.

## API Endpoints

### Authentification (publics)
- \`POST /auth/register\` - S'inscrire
- \`POST /auth/login\` - Se connecter
- \`POST /auth/refresh\` - Renouveler token
- \`POST /auth/logout\` - Se déconnecter

### Profils (protégés)
- \`GET /auth/profile\` - Mon profil
- \`PUT /users/profile\` - Mettre à jour profil
- \`POST /users/change-password\` - Changer mot de passe

### Notifications (protégés)
- \`GET /notifications\` - Mes notifications
- \`GET /notifications/unread-count\` - Non-lues
- \`PUT /notifications/:id/read\` - Marquer lue
- \`DELETE /notifications/:id\` - Supprimer

### Avatars (protégés)
- \`POST /users/avatar/upload\` - Upload via multipart/form-data (Sharp + Multer, max 5 MB)
- \`GET /users/avatar/:userId\` - Récupérer les URLs stockées
- \`DELETE /users/avatar\` - Supprimer l'avatar courant et les fichiers

> Prérequis : installer \`sharp\` et \`multer\`, puis créer les dossiers \`storage/avatars/{original,thumbnails,mini}\` et \`storage/temp\`.

### Rôles (admin)
- \`GET /admin/roles/users/:id\` - Rôles utilisateur
- \`POST /admin/roles/users/:id\` - Assigner rôle
- \`DELETE /admin/roles/users/:id/:roleId\` - Retirer rôle

## Rôles
- **CITOYEN** : Utilisateur standard
- **AGENT** : Collecteur
- **GESTIONNAIRE** : Superviseur
- **ADMIN** : Administrateur

## Sécurité

-  JWT pour authentification
-  Bcryptjs pour hash des mots de passe
-  Rate limiting (100 req/min global, 5 tentatives login/15 min)
-  Logging des tentatives
-  Refresh tokens
-  Sessions limitées (3 max)
-  RBAC (rôles et permissions)

## Tests

```bash
npm test
```

Le guide détaillé des scénarios manuels est disponible dans `TESTING_GUIDE.md`.

## CI: ce qui tourne sur un push

Le workflow GitHub Actions `ci.yml` lance (par ordre): lint (si configuré), tests Jest avec Postgres, scan `npm audit`, build d'une image Docker, et un test de l'image en PR. Si un job échoue, l'image n'est pas poussée.

## Vérifications locales avant push

1) Installer dépendances (clean comme la CI):
```bash
cd service-users
npm ci
```

2) Lancer les tests Jest avec une base Postgres locale (adapter l'URL si besoin):
```bash
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/ecotrack_test \
NODE_ENV=test \
npm run test:coverage
```

3) (Optionnel) Build Docker local pour vérifier l'image comme en CI:
```bash
docker build -t ecotrack-service-users:local .
```

4) (Optionnel) Smoke test rapide de l'image:
```bash
docker run --rm -p 3010:3010 \
	-e APP_PORT=3010 \
	-e DATABASE_URL="postgresql://test_user:test_pass@localhost:5432/ecotrack_test" \
	-e ACCESS_TOKEN_SECRET=test \
	-e REFRESH_TOKEN_SECRET=test \
	ecotrack-service-users:local
curl http://localhost:3010/health
```

5) (Si besoin d'une base de données provisionnée) Importer le schéma via le job compose dédié:
```bash
docker compose --profile migrate run --rm db-migrate
```

Ces commandes couvrent l'essentiel de ce que la CI exécute lors d'un push ou d'une PR.