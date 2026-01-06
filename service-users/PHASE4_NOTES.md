# Phase 4 : Sécurité Avancée

## Rate Limiting

### Endpoints publics
- 100 requêtes par minute
- message : "Too many requests"

### Login
- 5 tentatives par 15 minutes
- Protège contre le brute-force

### Password Reset
- 3 tentatives par heure

## Logging des tentatives

Chaque login réussi ou échoué est loggé dans JOURNAL_AUDIT :
- Qui (utilisateur ID)
- Action (LOGIN_SUCCESS/LOGIN_FAILED)
- Quand (timestamp)

## Refresh Tokens

### Flow
1. Login → access token + refresh token
2. Quand access token expire → POST /refresh
3. Utiliser refresh token pour obtenir nouvel access token
4. Logout → invalider le refresh token

### Sessions simultanées
- Maximum 3 sessions par utilisateur
- La plus ancienne est supprimée si dépassement
- POST /logout-all → déconnecter partout

## Sécurité ajoutée
-  Rate limiting sur endpoints critiques
-  Logging des tentatives de connexion
-  Refresh tokens (stockés en DB)
-  Sessions limitées
-  Logout avec invalidation

## Tests unitaires

- Middleware : couverture sur `publicLimiter` et `loginLimiter` (dépassement de quotas, skip des succès)
- Session controller : scénarios `/auth/refresh`, `logout`, `logout-all` (tokens valides/invalides)
- Audit service : vérification des insertions JOURNAL_AUDIT et lecture des tentatives récentes

