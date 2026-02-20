# Changelog - EcoTrack

> Historique des versions et changements du projet EcoTrack

---
### [1.5.0] 2026-02-19 - Authentification & Emails

#### Backend (service-users)
- **Nouveau**: Ajout du champ `nom` dans l'inscription (RegisterRequest)
- **Nouveau**: Endpoint `/auth/forgot-password` - Demander réinitialisation mot de passe
- **Nouveau**: Endpoint `/auth/reset-password` - Réinitialiser mot de passe avec token
- **Nouveau**: Service SMTP intégré avec nodemailer
- **Nouveau**: Envoi d'emails HTML stylisés (reset password, bienvenue)
- **Fix**: Validation du champ `nom` dans le registre

#### Frontend
- **Nouveau**: Page Inscription (`RegisterPage.jsx`) avec validation nom/prénom
- **Nouveau**: Page Mot de passe oublié (`ForgotPasswordPage.jsx`)
- **Nouveau**: Page Réinitialisation mot de passe (`ResetPasswordPage.jsx`)
- **Nouveau**: Page Conditions Générales (`TermsPage.jsx`)
- **Nouveau**: Page Politique de Confidentialité (`PrivacyPage.jsx`)
- **Nouveau**: Styles CSS globaux pour les pages d'auth

#### Base de données
- **Nouveau**: Table `password_reset_tokens` pour les tokens de reset

#### Swagger
- **Mise à jour**: Documentation avec champ `nom`
- **Mise à jour**: Documentation forgot-password et reset-password

#### Tests
- **Nouveau**: Vitest configuré pour le frontend
- **Nouveau**: Tests unitaires (`src/test/auth.test.js`)
- **Commandes**: `npm test`, `npm run test:run`, `npm run test:coverage`

### Rôles

| Rôle | Interface | Accès | Description |
|-------|-----------|-------|-------------|
| CITOYEN | Mobile | /dashboard | Utilisateur standard |
| AGENT | Mobile | /dashboard | Agent de collecte |
| GESTIONNAIRE | Desktop | /desktop | Superviseur |
| ADMIN | Desktop | /desktop | Administrateur |

## [1.4.0] - 2026-02-18

### RBAC - Roles et Permissions

**Permissions Matrix:**
- Mise a jour de la matrice des permissions selon spec:
  - CITOYEN: `signaler:create`, `signaler:read`
  - AGENT: `signaler:create`, `signaler:read`, `signaler:update`, `tournee:read`, `tournee:update`, `containers:update`
  - GESTIONNAIRE: Toutes les permissions AGENT + `tournee:create`, `user:read`, `zone:create`, `zone:read`, `zone:update`
  - ADMIN: `*` (toutes permissions)

**Interface Guard:**
- Ajout du middleware `interface-guard.js` pour proteger les routes mobile/desktop
- Separation des interfaces: Mobile (CITOYEN, AGENT) vs Desktop (GESTIONNAIRE, ADMIN)
- Nouvelles fonctions: `requireInterface()`, `requireDesktop()`, `requireMobile()`

**Permissions Service:**
- Refactoring vers pattern Repository: `permissionsRepository.js`
- Service CRUD: `permissionsService.js`
- API Admin: `admin-permissions.js`

**Base de donnees:**
- Migration `010_create_permissions_config` - Table de configuration des permissions
- Seed `014_permissions_default` - Permissions par defaut

**Guide:**
- Documentation `AUTH_PERMISSIONS_GUIDE.md` avec exemples d'utilisation

---

## [1.3.2] - 2026-02-13

### Logging

- Standardise le logging avec `pino` + `pino-pretty` et `morgan` dans les services.
- Remplace les `console.*` par le logger (API Gateway, users, containers, gamifications, scripts DB, healthchecks).
- Ajoute des loggers dedies par service avec format uniforme.

### Documentation

- Nettoie les emojis/icone dans la documentation et les commentaires.
- Met a jour README racine et [services/README.md](services/README.md).
- Supprime l'audit d'endpoints obsolete.

### Outils

- Ajoute un script `database/run-migrations.cjs` pour lancer les migrations manuellement.

## [1.3.1] - 2026-02-12

### Securite

**Fix Path Traversal - service-users**
- Correction vulnerabilite d'upload d'avatar (multer.js:22)
- Validation stricte des extensions de fichiers (.jpg, .jpeg, .png, .webp uniquement)
- Generation de noms de fichiers securises avec suffixe aleatoire
- Normalisation des extensions (.jpeg → .jpg)
- Prevention des attaques par traversée de répertoire

### API Gateway - Phase 3 : Sécurité et Monitoring (Complété)

**Sécurité centralisée :**
- Validation JWT sur toutes les routes protégées
- Rate limiting global configurable (100 req/min par défaut)
- Headers de sécurité Helmet (XSS, clickjacking, etc.)
- Middleware `jwtValidationMiddleware` avec vérification Bearer token
- Forward des headers `x-user-id` et `x-user-role` aux services

**Health checks avancés :**
- Endpoint `/health/detailed` avec vérification de tous les services
- Endpoint `/health/:service` pour vérifier un service spécifique
- Vérification périodique automatique (toutes les 30s)
- Mesure de la latence pour chaque service
- Détection des services down (3 échecs consécutifs)
- Status : healthy / degraded / unhealthy

**Logging centralisé :**
- Winston pour logs structurés JSON
- Morgan pour logs HTTP
- Logger de sécurité pour événements critiques
- Logs détaillés avec timing et user ID

**Nouvelles dépendances :**
- `jsonwebtoken` - Validation JWT
- `helmet` - Headers de sécurité
- `morgan` - Logging HTTP
- `winston` - Logging avancé
- `axios` - Health checks

### Documentation

**API Gateway**
- Documentation complete des phases de developpement
- Phase 1 : Structure de Base (Complété)
- Phase 2 : Gestion des Requêtes (En cours)
- Phase 3 : Sécurité et Monitoring (Complété)
- Roadmap avec versions 1.1.0 à 2.0.0
- Architecture et endpoints documentés

---

## [1.3.0] - 2026-02-12

### Ajoute
- Preparation pour l'integration frontend
- Migration 010 : Tables gamification_defi et gamification_participation_defi
- Mises a jour mineures et optimisations

### Mises a jour
- Seeds complets pour toutes les tables (maintenance, tournees, collectes, signalements, gamification, audit/alertes, refresh tokens)
- Alignement service-gamifications avec les migrations (verifie les tables au demarrage, schema auto optionnel)
- Healthcheck service-gamifications corrige (CommonJS)

---

## [1.2.0] - 2026-02-10

### Service Gamifications

#### Ajoute

**Service Gamifications (Port 3014)**
- Système de points avec attribution automatique
- Catalogue de badges avec seuils (Debutant: 100, Eco-Guerrier: 500, Super-Heros: 1000)
- Gestion des defis communautaires
- Classement des utilisateurs avec niveaux (Debutant, Eco-Warrior, Super-Heros, Legende Verte)
- Notifications de gamification
- Statistiques personnelles (jour/semaine/mois)
- Estimation impact CO2 (points * 0.02)
- Tests unitaires complets (services et controllers)
- Documentation des phases (PHASE1 a PHASE4)
- Integration API Gateway

**Endpoints**
- POST /actions - Enregistrer une action et attribuer des points
- GET /badges - Liste des badges disponibles
- GET /badges/utilisateurs/:idUtilisateur - Badges d'un utilisateur
- GET /defis - Liste des defis
- POST /defis - Creer un defi
- POST /defis/:idDefi/participations - Participer a un defi
- PATCH /defis/:idDefi/participations/:idUtilisateur - Mettre a jour progression
- GET /classement - Classement des utilisateurs
- GET /notifications - Liste des notifications
- POST /notifications - Creer une notification
- GET /utilisateurs/:idUtilisateur/stats - Statistiques utilisateur

**Base de donnees et Migrations**
- Migration 007 : Ajout tables historique_points et notification
- Migration 010 : Ajout tables gamification_defi et gamification_participation_defi
- Seeds des badges par defaut (DEBUTANT, ECO_GUERRIER, SUPER_HEROS)
- Scripts SQL dans services/service-gamifications/sql/gamification.sql
- Initialisation automatique pour tests unitaires

**Tables créees**
- gamification_defi (defis communautaires avec dates et objectifs)
- gamification_participation_defi (participations aux defis avec progression)
- historique_points (historique des gains de points - Migration 007)
- notification (notifications utilisateurs - Migration 007)

---

## [1.1.0] - 2026-02-05

### Service Containers & Integration

#### Ajoute

**Service Containers (Port 3004)**
- CRUD complet des conteneurs
- Géolocalisation des conteneurs (latitude/longitude)
- Gestion des niveaux de remplissage (vide, faible, moyen, eleve, plein)
- Historique des collectes
- Socket.IO pour temps reel
- Tests unitaires complets
- Docker support

**Integration**
- Integration service-containers dans API Gateway
- Integration service-gamifications dans API Gateway
- Configuration CI/CD amelioree (GitHub Actions)
- Renommage champ 'username' vers 'prenom' dans les modeles utilisateurs

**Documentation**
- README complet pour service-containers
- Documentation technique

**Base de donnees et Migrations**
- Migration 004 : Ajout tables conteneur, capteur et mesure
- Migration 005 : Ajout tables tournee et collecte
- Migration 006 : Ajout tables signalements
- Scripts SQL dans services/service-containers/sql/containers.sql

**Tables créees**
- conteneur (infos conteneurs avec geolocalisation)
- capteur (capteurs IoT associes aux conteneurs)
- mesure (donnees des capteurs - niveau de remplissage, batterie)
- tournee (planification des tournees de collecte)
- collecte (historique des collectes effectuees)

---

## [1.0.0] - 2026-01-13

### Version initiale - Services Users & API Gateway

#### Ajoute

**Service Users (Port 3010)**
- Authentification complète (JWT + Refresh Tokens)
- Inscription et connexion utilisateurs
- Système RBAC avec 4 roles (CITOYEN, AGENT, GESTIONNAIRE, ADMIN)
- Gestion des profils utilisateurs
- Notifications utilisateurs
- Upload et gestion d'avatars (Sharp + Multer)
- Sessions limitees (max 3 par utilisateur)
- Rate limiting (100 req/min global, 5 login/15min)
- Journal d'audit complet
- Swagger UI interactif
- Tests unitaires complets (93% de couverture)

**API Gateway (Port 3000)**
- Reverse proxy vers microservices
- Rate limiting global
- Health check unifie
- Agregation documentation Swagger
- CORS centralise
- Routage dynamique

**Technologies**
- Node.js 18+
- Express.js 5.2.1
- PostgreSQL 14+ (Neon Cloud)
- JWT + bcrypt
- Docker & Docker Compose
- Jest pour tests
- GitHub Actions CI/CD

**Securite**
- Hash bcrypt (10 rounds)
- JWT avec secret fort
- Protection SQL Injection
- Headers securises (Helmet)
- Validation des entrees (Zod)
- Audit logging

**Documentation**
- README complet
- Swagger pour tous les endpoints
- Guides de testing
- Documentation des phases de developpement
- Runbooks operationnels

**Base de donnees et Migrations**
- Migration 001 : Schema initial (tables de base, role, type_signalement)
- Migration 002 : Ajout zones et vehicules
- Migration 003 : Ajout table utilisateur complete avec user_role et user_badge
- Migration 008 : Ajout tables d'audit et alertes
- Migration 009 : Ajout table refresh_tokens
- Script SQL initial dans sql/EcoTrack.sql

**Tables créees**
- UTILISATEUR (gestion des comptes utilisateurs)
- ROLE (catalogue des roles)
- user_role (association utilisateurs-roles)
- badge (catalogue des badges)
- user_badge (association utilisateurs-badges)
- REFRESH_TOKEN (gestion des sessions)
- JOURNAL_AUDIT (journal d'audit securite)

---

## [0.9.0] - 2026-01-12

### Phase 7 : Documentation & Swagger

#### Ajoute
- Documentation Swagger complète
- Schemas OpenAPI 3.0
- Interface interactive sur `/api-docs`
- Exemples de requêtes/reponses
- Authentification Bearer token dans Swagger

#### Documentation
- README ameliore avec exemples
- SWAGGER_SETUP.md
- Gestion Avatars.md

---

## [0.8.0] - 2026-01-11

### Phase 6 : Gestion d'avatars

#### Ajoute
- Upload d'images (max 5 MB)
- Traitement avec Sharp (3 tailles: original, thumbnail, mini)
- Stockage dans `storage/avatars/`
- Endpoint `POST /users/avatar/upload`
- Endpoint `GET /users/avatar/:userId`
- Endpoint `DELETE /users/avatar`
- Suppression avec nettoyage des fichiers

#### Tests
- avatarController.test.js
- avatarService.test.js

---

## [0.7.0] - 2026-01-10

### Phase 5 : Notifications

#### Ajoute
- Système de notifications
- Endpoint `GET /notifications`
- Endpoint `GET /notifications/unread-count`
- Endpoint `PUT /notifications/:id/read`
- Endpoint `DELETE /notifications/:id`
- Table `NOTIFICATION` en DB

#### Tests
- notificationController.test.js
- notificationService.test.js

---

## [0.6.0] - 2026-01-09

### Phase 4 : Securite avancee

#### Ajoute
- Refresh tokens (stockes en DB)
- Sessions limitees (max 3 par utilisateur)
- Rate limiting differencie:
  - Global: 100 req/min
  - Login: 5 tentatives/15 min
  - Password reset: 3 tentatives/heure
- Journal d'audit (table JOURNAL_AUDIT)
- Logging des tentatives de connexion
- Endpoint `POST /auth/refresh`
- Endpoint `POST /auth/logout`
- Endpoint `POST /auth/logout-all`

#### Tests
- rateLimit.test.js
- sessionController.test.js
- auditService.test.js

#### Documentation
- PHASE4_NOTES.md

---

## [0.5.0] - 2026-01-08

### Phase 3 : RBAC (Roles & Permissions)

#### Ajoute
- Système RBAC complet
- 4 roles: CITOYEN, AGENT, GESTIONNAIRE, ADMIN
- Matrice de permissions granulaires
- Middleware `requirePermission(permission)`
- Middleware `requirePermissions([permissions])`
- Fonction `hasPermission(role, permission)`
- Wildcard ADMIN (`*`)
- Endpoints admin:
  - `GET /admin/roles/users/:id`
  - `POST /admin/roles/users/:id`
  - `DELETE /admin/roles/users/:id/:roleId`

#### Base de donnees
- Table `ROLE`
- Table `UTILISATEUR_ROLE`
- Table `PERMISSION`

#### Tests
- permissions.test.js (middleware)
- roleService.test.js
- permissions.test.js (utils)

#### Documentation
- PHASE3_NOTES.md

---

## [0.4.0] - 2026-01-07

### Phase 2 : Profil utilisateur

#### Ajoute
- Mise a jour du profil (`PUT /users/profile`)
- Changement de mot de passe (`POST /users/change-password`)
- Profil avec statistiques (`GET /profile-with-stats`)
- Middleware de gestion d'erreurs global
- Support des erreurs asynchrones

#### Tests
- authService.test.js
- userService.test.js
- authController.test.js
- errorHandler.test.js

#### Documentation
- PHASE2_NOTES.md

---

## [0.3.0] - 2026-01-06

### Phase 1 : Authentification de base

#### Ajoute
- Inscription utilisateur (`POST /auth/register`)
- Connexion (`POST /auth/login`)
- Recuperation profil (`GET /auth/profile`)
- Generation JWT (access token)
- Hash des mots de passe (bcryptjs)
- Middleware d'authentification `authenticateToken`
- Middleware d'autorisation `authorizeRole`

#### Base de donnees
- Table `UTILISATEUR`
- Champs: id, email, username, password_hash, role, date_creation

#### Tests
- crypto.test.js
- jwt.test.js
- auth.test.js (middleware)

#### Documentation
- PHASE1_NOTES.md

---

## [0.2.0] - 2026-01-05

### API Gateway initial

#### Ajoute
- Structure de base API Gateway
- Reverse proxy vers service-users
- Rate limiting global
- Health check endpoint
- Configuration des services
- Support CORS

#### Fichiers
- `services/api-gateway/src/index.js`
- `services/api-gateway/package.json`
- `services/api-gateway/README.md`

---

## [0.1.0] - 2026-01-04

### Configuration initiale du projet

#### Ajoute
- Structure de base du projet
- Configuration Git
- Configuration Docker
- Fichier `docker-compose.yml`
- `.gitignore`
- README.md principal
- Schema de base de donnees PostgreSQL

#### Base de donnees
- Script SQL initial (`sql/EcoTrack.sql`)
- Configuration PostgreSQL sur Neon Cloud
- Pool de connexions

#### Structure
```
ecotrack-sjma/
├── services/
│   ├── service-users/
│   └── api-gateway/
├── docs/
├── context/
└── docker-compose.yml
```

---

## Gestion des Migrations Base de Donnees

### Versionnement des Migrations

Le projet utilise un systeme de migrations sequentielles pour la base de donnees PostgreSQL.

**Numérotation des migrations existantes :**
- Migration 001 : Schema initial (role, badge, type_conteneur, type_signalement, maintenance)
- Migration 002 : Ajout zones et vehicules
- Migration 003 : Ajout utilisateur, user_role, user_badge
- Migration 004 : Service Containers (conteneur, capteur, mesure)
- Migration 005 : Ajout tournee et collecte
- Migration 006 : Ajout signalements
- Migration 007 : Service Gamifications (historique_points, notification)
- Migration 008 : Ajout audit et alertes
- Migration 009 : Ajout refresh_tokens
- Migration 010 : Service Gamifications (gamification_defi, gamification_participation_defi)

**Fichiers de migration :**
- `database/migrations/001_create_base_tables.cjs`
- `database/migrations/002_create_zones_vehicules.cjs`
- `database/migrations/003_create_utilisateur.cjs`
- `database/migrations/004_create_conteneurs.cjs`
- `database/migrations/005_create_tournees_collectes.cjs`
- `database/migrations/006_create_signalements.cjs`
- `database/migrations/007_create_gamification.cjs`
- `database/migrations/008_create_audit_alertes.cjs`
- `database/migrations/009_create_refresh_tokens.cjs`
- `database/migrations/010_create_gamification_defis.cjs`

**Commandes disponibles :**
```bash
# Executer toutes les migrations
npm run db:migrate

# Rollback derniere migration
npm run db:migrate:undo

# Reset complet (attention: perte de donnees)
npm run db:reset

# Seed donnees de test
npm run db:seed
```

**Schema version tracking :**
La table `pgmigrations` garde la trace des migrations executees :
- `id` : Numero de la migration
- `name` : Nom du fichier de migration
- `run_on` : Date d'execution

---


**Format de date** : AAAA-MM-JJ (ISO 8601)
**Derniere mise a jour** : 2026-02-12
**Maintenu par** : Equipe EcoTrack
