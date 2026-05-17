# MFA (Multi-Factor Authentication) - Implementation

## Vue d'ensemble
L'authentification à deux facteurs (TOTP) a été ajoutée au système EcoTrack pour renforcer la sécurité.

## Fichiers modifiés/creés

### Backend (service-users)
1. **`database/migrations/022_add_mfa_to_utilisateur.cjs`** - Migration BDD
   - Ajout colonnes : `mfa_enabled`, `totp_secret`, `backup_codes`

2. **`services/mfaService.js`** - Logique MFA
   - `generateMfaSetup()` - Génère secret + QR code
   - `verifyTotp()` - Vérifie code TOTP
   - `enableMfa()` - Active MFA + génère codes de secours
   - `disableMfa()` - Désactive MFA
   - `verifyMfaCode()` - Vérifie code (TOTP ou backup)

3. **`services/authService.js`** - Modifié
   - Login retourne `requiresMFA: true` si MFA activé
   - Plus de JWT généré si MFA requis

4. **`routes/auth.js`** - Endpoints ajoutés
   - `POST /auth/mfa/setup` - Setup MFA (JWT requis)
   - `POST /auth/mfa/verify` - Vérifie et active MFA (JWT requis)
   - `POST /auth/mfa/disable` - Désactive MFA (JWT requis)
   - `POST /auth/login/mfa` - Login avec code MFA (pas de JWT requis)

5. **`controllers/mfaController.js`** - Contrôleur MFA
   - Gère les requêtes setup, verify, disable, loginWithMfa

### Frontend
1. **`services/authService.js`** - Modifié
   - `login()` retourne `{ requiresMFA, userId }` si MFA activé
   - `loginWithMfa(userId, code)` - Login avec code MFA

2. **`pages/auth/MfaPage.jsx`** - Nouvelle page
   - Saisie du code TOTP à 6 chiffres
   - Redirection automatique après connexion

3. **`pages/auth/LoginPage.jsx`** - Modifié
   - Redirection vers `/auth/mfa` si `requiresMFA: true`

## Pré-requis
```bash
cd services/service-users
npm install speakeasy qrcode
```

## Migration BDD
```bash
docker compose up -d postgres
cd services/service-users
npx pg-migrate up
```

## Flux d'authentification

### 1. Login standard (MFA désactivé)
```
POST /auth/login {
  "email": "user@example.com",
  "password": "password123"
}
→ 200 OK {
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { ... }
}
```

### 2. Login avec MFA activé
```
POST /auth/login {
  "email": "user@example.com",
  "password": "password123"
}
→ 200 OK {
  "requiresMFA": true,
  "userId": 1,
  "email": "user@example.com"
}
```

### 3. Setup MFA (première fois)
```
POST /auth/mfa/setup (JWT requis)
→ 200 OK {
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "data:image/png;base64,..."
}
```
- Scanner le QR code avec Google Authenticator / Authy
- Sauvegarder les codes de secours affichés

### 4. Vérification et activation MFA
```
POST /auth/mfa/verify (JWT requis)
{
  "secret": "JBSWY3DPEHPK3PXP",
  "token": "123456"
}
→ 200 OK {
  "message": "MFA activé avec succès",
  "backupCodes": ["ABC12345", "DEF67890", ...]
}
```

### 5. Login avec code MFA
```
POST /auth/login/mfa {
  "userId": 1,
  "code": "123456"  // Code TOTP ou backup code
}
→ 200 OK {
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { ... }
}
```

## Test avec curl

### 1. Login (déclenche MFA)
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Setup MFA (récupérer secret + QR)
```bash
curl -X POST http://localhost:3000/auth/mfa/setup \
  -H "Authorization: Bearer VOTRE_JWT"
```

### 3. Vérifier et activer MFA
```bash
curl -X POST http://localhost:3000/auth/mfa/verify \
  -H "Authorization: Bearer VOTRE_JWT" \
  -H "Content-Type: application/json" \
  -d '{"secret":"VOTRE_SECRET","token":"123456"}'
```

### 4. Login avec MFA
```bash
curl -X POST http://localhost:3000/auth/login/mfa \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"code":"123456"}'
```

## Sécurité
- Codes TOTP valides 30 secondes (fenêtre de 1 période)
- 10 codes de secours générés (utilisation unique)
- Codes de secours invalidés après usage
- Secret TOTP stocké en base64 dans `totp_secret`

## Désactivation MFA
```bash
curl -X POST http://localhost:3000/auth/mfa/disable \
  -H "Authorization: Bearer VOTRE_JWT"
```

## Frontend - Pages

### MfaPage.jsx
- Accessible via `/auth/mfa`
- Reçoit `userId` via `localStorage('mfa_user_id')`
- Saisie code à 6 chiffres
- Redirection automatique selon rôle après connexion

### LoginPage.jsx
- Si `requiresMFA: true` → redirection vers `/auth/mfa`
- Stocke `userId` dans localStorage pour MfaPage

## Configuration
Pas de configuration supplémentaire requise. Les variables d'environnement existantes (JWT secrets) sont utilisées.

## Packages utilisés
- **speakeasy** - Génération et vérification TOTP
- **qrcode** - Génération QR code (PNG base64)
