## Endpoints

### Authentification (publics)
- POST /auth/register → Créer compte
- POST /auth/login → Se connecter
- GET /auth/profile → Profil connecté (protégé)

### Profil (protégés)
- PUT /users/profile → Modifier profil
- POST /users/change-password → Changer mot de passe
- GET /profile-with-stats → Profile avec stats

## Tokens

- **accessToken** : JWT court terme (24h)
- **refreshToken** : Token long terme (7 jours)

## Exemples

### Register
```bash
curl -X POST http://localhost:3002/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "john",
    "password": "password123",
    "role": "CITOYEN"
  }'
```
### Login
```bash
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```
### Utiliser le token
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3002/auth/profile
```

## Tests Unitaires

Des tests unitaires ont été mis en place pour valider la logique métier des services et des contrôleurs, en isolant le code de ses dépendances (base de données, autres modules).

### Tests pour `authService.js`
- **Fonctionnalités testées** : Inscription (`registerUser`), connexion (`loginUser`), et récupération d'utilisateur par ID (`getUserById`).
- **Cas de figure** : Succès, utilisateur déjà existant, utilisateur non trouvé, mot de passe incorrect.
- **Méthode** : Les dépendances comme la base de données (`pool`) et les utilitaires (`crypto`, `jwt`) sont simulées (mocked) pour tester la logique du service de manière isolée.

### Tests pour `userService.js`
- **Fonctionnalités testées** : Mise à jour du profil (`updateProfile`), changement de mot de passe (`changePassword`), et récupération du profil avec statistiques (`getProfileWithStats`).
- **Cas de figure** : Succès, utilisateur non trouvé, mot de passe actuel incorrect.
- **Méthode** : La base de données est simulée pour se concentrer sur la logique métier du service.

### Tests pour `authController.js`
- **Fonctionnalités testées** : Toutes les fonctions du contrôleur (`register`, `login`, `getProfile`, `updateProfile`, etc.).
- **Cas de figure** : Vérifie que les bonnes fonctions de service sont appelées et que les réponses HTTP (statuts, JSON) sont correctes.
- **Méthode** : La couche de service (`authService`, `userService`) ainsi que les objets `req` et `res` d'Express sont simulés pour tester le contrôleur de manière unitaire.