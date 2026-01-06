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