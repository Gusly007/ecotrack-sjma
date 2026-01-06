# Phase 3 : Rôles & Permissions

## 4 Rôles

### CITOYEN
- Signaler des problèmes
- Consulter les conteneurs
- Mettre à jour son profil

### AGENT
- Voir les signalements
- Valider les collectes
- Mettre à jour ses tournées

### GESTIONNAIRE
- Créer les tournées
- Consulter les statistiques
- Gérer les conteneurs
- Voir les utilisateurs

### ADMIN
- Accès à tout
- Gérer les rôles
- Gestion système

## Utilisation des Middleware
```javascript
router.post('/signalements',
  authenticateToken,        // Vérifier JWT
  requirePermission('signaler:create'),  // Vérifier permission
  controller.create
);
```

## Tests unitaires Phase 
- `__tests__/middleware/permissions.test.js` : vérifie les statuts 401/403 et l'appel à `next()` pour `requirePermission` et `requirePermissions` en simulant `hasPermission`.
- `__tests__/services/roleService.test.js` : mock la connexion PostgreSQL (`pool.query`) pour confirmer les requêtes SQL et les valeurs retournées de `assignRoleToUser`, `removeRoleFromUser` et `getUserRoles`.
- `__tests__/utils/permissions.test.js` : sécurise la matrice `rolePermissions` et les cas limites de `hasPermission` (wildcard ADMIN, rôle inconnu, permissions manquantes).

Exécuter uniquement ces tests :
```bash
npm run test -- __tests__/middleware/permissions.test.js __tests__/services/roleService.test.js __tests__/utils/permissions.test.js
```


