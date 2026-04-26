# Guide de Test - Service Users

## Ordre de test

### 1. Health Check

```
GET http://localhost:3010/health
```

### 1. Health Check

\`\`\`
# Guide de Test - Service Users

## Ordre de test

### 1. Health Check
```
GET http://localhost:3010/health
```

### 2. Register
```
POST http://localhost:3010/auth/register
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "password123",
  "role": "CITOYEN"
}
```
→ Récupérer le `token` et `refreshToken`

### 3. Login
```
POST http://localhost:3010/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}
```

### 4. Profile
```
GET http://localhost:3010/auth/profile
Headers: Authorization: Bearer {token}
```

### 5. Update Profile
```
PUT http://localhost:3010/users/profile
Headers: Authorization: Bearer {token}
{
  "prenom": "Test User Updated"
}
```

### 6. Refresh Token
```
POST http://localhost:3010/auth/refresh
{
  "refreshToken": "{refreshToken}"
}
```

### 7. Notifications
```
GET http://localhost:3010/notifications
Headers: Authorization: Bearer {token}
```

### 8. Compteur non-lu
```
GET http://localhost:3010/notifications/unread-count
Headers: Authorization: Bearer {token}
```

### 9. Marquer une notification comme lue
```
PUT http://localhost:3010/notifications/{id}/read
Headers: Authorization: Bearer {token}
```

### 10. Supprimer une notification
```
DELETE http://localhost:3010/notifications/{id}
Headers: Authorization: Bearer {token}
```

### 11. Logout
```
POST http://localhost:3010/auth/logout
Headers: Authorization: Bearer {token}
{
  "refreshToken": "{refreshToken}"
}
```

### 12. Rate Limiting (login limiter)
```bash
for i in {1..30}; do
  curl -X POST http://localhost:3010/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' &
done
wait
```
À partir de la 6ème tentative (fenêtre 15 min), la réponse doit être `429 Too Many Requests`.

## Cas d'erreurs à tester
-  Register sans email → 400
-  Login avec password faux → 401
-  Endpoints sans token → 401
-  Token expiré → 403
-  Trop de requêtes → 429 (auth login limiter ou `/auth` public limiter)
## Cas d'erreurs à tester

- Register sans email → 400
- Login avec password faux → 401
- Endpoints sans token → 401
- Token expiré → 403
- Trop de requêtes → 429 (auth login limiter ou `/auth` public limiter)
- Trop de requêtes → 429
