
# Service Users

Service d'authentification, notifications et gestion des rôles pour EcoTrack.

## Architecture & Structure

Le service suit une architecture **Service/Repository** :

- `src/services/` : logique métier (appelle les repositories)
- `src/repositories/` : accès aux données (PostgreSQL)
- `src/controllers/` : endpoints Express
- `src/middleware/` : middlewares Express (auth, validation, erreurs)
- `src/utils/` : utilitaires (crypto, jwt, etc.)

Arborescence simplifiée :

```
src/
	controllers/
	middleware/
	repositories/
	services/
	utils/
	config/
	...
__tests__/
	controllers/
	middleware/
	services/
	utils/
```
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
- `POST /auth/register` - S'inscrire (avec nom, prenom)
- `POST /auth/login` - Se connecter
- `POST /auth/forgot-password` - Demander réinitialisation mot de passe
- `POST /auth/reset-password` - Réinitialiser mot de passe
- `POST /auth/refresh` - Renouveler token
- `POST /auth/logout` - Se déconnecter

### Profils (protégés)
- \`GET /auth/profile\` - Mon profil
- \`PUT /users/profile\` - Mettre à jour profil
- \`POST /users/change-password\` - Changer mot de passe

### Utilisateurs (gestionnaire / admin)
- \`GET /users/agents\` - Liste des utilisateurs actifs ayant le rôle **AGENT** (filtre forcé côté serveur). Utilisée par le gestionnaire lors de la création/optimisation d'une tournée. Permission : \`tournee:create\`.
- \`GET /users\` - Liste paginée des utilisateurs (admin). Supporte filtres \`role\`, \`search\`, \`est_active\`.

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

## MFA / 2FA (Authentification à deux facteurs)

Le service implémente le TOTP (RFC 6238) via **speakeasy** + **qrcode**. Compatible avec Google Authenticator, Authy et toute application TOTP standard.

### Endpoints MFA

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `POST` | `/auth/mfa/setup` | JWT requis | Génère un secret TOTP et un QR code (Data URL) |
| `POST` | `/auth/mfa/verify` | JWT requis | Vérifie le premier code TOTP et active le MFA |
| `POST` | `/auth/mfa/complete-setup` | Public | Active le MFA et retourne les tokens JWT |
| `POST` | `/auth/mfa/disable` | JWT requis | Désactive le MFA pour l'utilisateur connecté |
| `POST` | `/auth/mfa/regenerate` | Public (userId requis) | Régénère le QR code (perte de device) |
| `POST` | `/auth/login/mfa` | Public (rate-limited) | Valide le code TOTP et retourne les tokens JWT |

### Flux d'activation

```
1. POST /auth/mfa/setup          → { secret, qrCodeUrl }
   (scanner le QR code dans l'app TOTP)
2. POST /auth/mfa/complete-setup → { token, refreshToken, user }
   body: { userId, code }         (code à 6 chiffres de l'app)
```

### Flux de connexion avec MFA actif

```
1. POST /auth/login               → { requiresMfa: true, userId }
2. POST /auth/login/mfa           → { token, refreshToken, user }
   body: { userId, code }          (code TOTP ou code de secours)
```

### Codes de secours

À l'activation, 10 codes de secours (8 caractères hexadécimaux) sont générés et retournés une seule fois. Chaque code ne peut être utilisé qu'une fois. Si le device est perdu, utiliser `POST /auth/mfa/regenerate` pour obtenir un nouveau QR code.

### Stockage

| Colonne | Description |
|---------|-------------|
| `mfa_enabled` | Booléen — MFA activé pour cet utilisateur |
| `totp_secret` | Secret TOTP chiffré (base32) |
| `backup_codes` | JSON array — codes de secours hachés |
| `mfa_setup_secret` | Secret temporaire pendant le setup |

---

## Sécurité

- JWT pour authentification
- Bcryptjs pour hash des mots de passe
- Rate limiting (100 req/min global, 5 tentatives login/15 min)
- TOTP 2FA (speakeasy) avec codes de secours
- Logging des tentatives de connexion
- Refresh tokens
- Sessions limitées (3 max)
- RBAC (rôles et permissions)

## Tests

```bash
npm test
```
Les tests unitaires couvrent :
- Les services (logique métier, mocks des repositories)
- Les controllers (mocks des services)

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