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
