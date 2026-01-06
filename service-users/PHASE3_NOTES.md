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


