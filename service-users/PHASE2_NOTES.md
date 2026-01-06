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