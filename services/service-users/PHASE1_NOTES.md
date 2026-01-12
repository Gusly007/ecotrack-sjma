# Phase 1 : Authentification & Setup

## Dépendances

### jsonwebtoken
- Créer et vérifier les JWT
- Stocke userId et role dans le token

### bcryptjs
- Hash les mots de passe
- Impossible de reverser le hash
- Comparaison sécurisée

### pg
- Driver PostgreSQL
- Pool de connexions

## Rôles
- CITOYEN : utilisateur standard
- AGENT : collecteur de déchets
- GESTIONNAIRE : superviseur
- ADMIN : administrateur système

## Tests Unitaires

### `utils/crypto.js`

- **`hashPassword`**
    - Teste qu'un mot de passe est correctement hashé et que le hash est différent du mot de passe original.
    - Teste que le hash est différent à chaque appel pour le même mot de passe (grâce au sel).
    - Gère le cas d'un mot de passe vide.
- **`comparePassword`**
    - Teste que la comparaison retourne `true` pour un mot de passe correct.
    - Teste que la comparaison retourne `false` pour un mot de passe incorrect.
    - Teste que la comparaison est sensible à la casse.

### `utils/jwt.js`

- **`generateToken`**
    - Teste qu'un token JWT standard est bien généré avec un `userId` et un `role`.
    - Vérifie que les informations `userId` et `role` sont correctement encodées dans le token.
- **`generateRefreshToken`**
    - Teste qu'un refresh token est bien généré.
    - Vérifie que le `userId` est correctement encodé dans le refresh token.
- **`verifyToken`**
    - Teste la bonne vérification d'un token valide.
    - Teste qu'une erreur est levée si le token est invalide ou vide.

### `middleware/auth.js`

- Mocke le module `jwt.js` pour isoler la logique du middleware.
- **`authenticateToken`**
    - Teste qu'une erreur `401 Unauthorized` est retournée si aucun token n'est fourni.
    - Teste qu'une erreur `401 Unauthorized` est retournée si le header `Authorization` est vide.
    - Teste que `next()` est appelé et que `req.user` est peuplé avec les données du token si celui-ci est valide.
    - Teste qu'une erreur `403 Forbidden` est retournée si le token est invalide.
- **`authorizeRole`**
    - Teste qu'une erreur `401 Unauthorized` est retournée si l'utilisateur n'est pas authentifié.
    - Teste qu'une erreur `403 Forbidden` est retournée si le rôle de l'utilisateur ne fait pas partie des rôles autorisés.
    - Teste que `next()` est appelé si le rôle de l'utilisateur est autorisé.

### `middleware/errorHandler.js`

- **`errorHandler` middleware**
    - Teste si une erreur avec le code `23005` (conflit de ressource) retourne un statut `409 Conflict`.
    - Teste si une erreur contenant `not found` retourne un statut `404 Not Found`.
    - Teste si une erreur contenant `token` retourne un statut `401 Unauthorized`.
    - Teste si une erreur contenant `validation` retourne un statut `400 Bad Request`.
    - Teste si les autres types d'erreurs retournent un statut `500 Internal Server Error`.
    - Vérifie que `console.error` est appelé pour tracer l'erreur.
- **`asyncHandler` utility**
    - Teste que `next(error)` est appelé si une fonction asynchrone (route) échoue (promesse rejetée).
    - Teste que `next()` n'est pas appelé avec une erreur si la fonction asynchrone réussit.
