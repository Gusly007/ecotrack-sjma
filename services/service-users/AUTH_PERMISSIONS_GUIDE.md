# Guide de Gestion des Permissions et Rôles Utilisateurs

## Vue d'Ensemble

Le système d'authentification et d'autorisation du projet EcoTrack utilise JWT pour l'authentification et un système de permissions basé sur les rôles (RBAC - Role-Based Access Control).

### Types d'utilisateurs

| Rôle | Interface | Description |
|------|-----------|-------------|
| **CITOYEN** | Mobile | Utilisateur standard - signalements |
| **AGENT** | Mobile | Agent de collecte - tournées, signalements, conteneurs |
| **GESTIONNAIRE** | Desktop | Gestionnaire de zone - zones, utilisateurs, tournées |
| **ADMIN** | Desktop | Administrateur - accès complet, configuration |

---

## Matrice des Permissions

| Permission | Citoyen | Agent | Gestionnaire | Admin |
|------------|:-------:|:-----:|:------------:|:-----:|
| `signaler:create` | ✓ | ✓ | ✓ | ✓ |
| `signaler:read` | ✓ | ✓ | ✓ | ✓ |
| `signaler:update` | ✗ | ✓ | ✓ | ✓ |
| `tournee:create` | ✗ | ✗ | ✓ | ✓ |
| `tournee:read` | ✗ | ✓ | ✓ | ✓ |
| `tournee:update` | ✗ | ✓ | ✓ | ✓ |
| `containers:update` | ✗ | ✓ | ✓ | ✓ |
| `user:read` | ✗ | ✗ | ✓ | ✓ |
| `zone:create` | ✗ | ✗ | ✓ | ✓ |
| `zone:read` | ✗ | ✗ | ✓ | ✓ |
| `zone:update` | ✗ | ✗ | ✓ | ✓ |
| `users:create` | ✗ | ✗ | ✗ | ✓ |
| `users:delete` | ✗ | ✗ | ✗ | ✓ |
| `config:update` | ✗ | ✗ | ✗ | ✓ |
| `logs:read` | ✗ | ✗ | ✗ | ✓ |

### Interfaces

- **Mobile**: CITOYEN, AGENT
- **Desktop**: GESTIONNAIRE, ADMIN

---

## Architecture

### 1. Permissions par Rôle (`src/utils/permissions.js`)

```javascript
export const rolePermissions = {
    CITOYEN: [
        'signaler:create',
        'signaler:read'
    ],
    AGENT: [
        'signaler:create',
        'signaler:read',
        'signaler:update',
        'tournee:read',
        'tournee:update',
        'containers:update'
    ],
    GESTIONNAIRE: [
        'signaler:create',
        'signaler:read',
        'signaler:update',
        'tournee:create',
        'tournee:read',
        'tournee:update',
        'containers:update',
        'user:read',
        'zone:read',
        'zone:create',
        'zone:update'
    ],
    ADMIN: ['*']
};

// Type d'interface par rôle
export const INTERFACE_BY_ROLE = {
    CITOYEN: 'mobile',
    AGENT: 'mobile',
    GESTIONNAIRE: 'desktop',
    ADMIN: 'desktop'
};
```

### 2. Génération du JWT (`src/utils/jwt.js`)

```javascript
export const generateToken = (userId, role, interfaceType) => {
    const type = interfaceType || getInterfaceType(role);
    return jwt.sign(
        { id: userId, role, interfaceType: type, type: 'access' },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
    );
};
```

**Le token contient:** `id`, `role`, `interfaceType: 'mobile'|'desktop'`, `type: 'access'`

### 3. Middleware d'Authentification (`src/middleware/auth.js`)

```javascript
export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

export const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
```

### 4. Middleware de Permissions (`src/middleware/permissions.js`)

```javascript
export const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });
        if (!hasPermission(req.user.role, permission)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
```

### 5. Middleware Interface Guard (`src/middleware/interface-guard.js`)

```javascript
import { isMobileRole, isDesktopRole } from '../utils/permissions.js';

export const requireInterface = (interfaceType) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        let hasAccess = false;
        if (interfaceType === 'mobile') hasAccess = isMobileRole(req.user.role);
        else if (interfaceType === 'desktop') hasAccess = isDesktopRole(req.user.role);

        if (!hasAccess) {
            return res.status(403).json({
                error: `Cette route nécessite l'interface ${interfaceType}`,
                currentRole: req.user.role
            });
        }
        next();
    };
};

export const requireDesktop = (req, res, next) => {
    if (!isDesktopRole(req.user?.role)) {
        return res.status(403).json({ error: 'Cette route nécessite l\'interface desktop' });
    }
    next();
};

export const requireMobile = (req, res, next) => {
    if (!isMobileRole(req.user?.role)) {
        return res.status(403).json({ error: 'Cette route nécessite l\'interface mobile' });
    }
    next();
};
```

---

## Utilisation dans les Routes

### Exemple 1: Route protégée par interface

```javascript
import { requireInterface } from '../middleware/interface-guard.js';

// Route desktop uniquement (Gestionnaire, Admin)
router.get('/admin/dashboard', 
    authenticateToken, 
    requireInterface('desktop'), 
    adminController.dashboard
);

// Route mobile uniquement (Citoyen, Agent)
router.get('/mobile/dashboard', 
    authenticateToken, 
    requireInterface('mobile'), 
    mobileController.dashboard
);
```

### Exemple 2: Route protégée par permission

```javascript
import { requirePermission } from '../middleware/permissions.js';

// Créer un signalement (Tous sauf lecture seule)
router.post('/signaler', 
    authenticateToken, 
    requirePermission('signaler:create'), 
    signalerController.create
);

// Mettre à jour un conteneur (Agent, Gestionnaire, Admin)
router.put('/containers/:id', 
    authenticateToken, 
    requirePermission('containers:update'), 
    containerController.update
);

// Gérer les zones (Gestionnaire, Admin)
router.post('/zones', 
    authenticateToken, 
    requirePermission('zone:create'), 
    zoneController.create
);
```

### Exemple 3: Route admin uniquement

```javascript
// Config système (Admin uniquement)
router.put('/system/config', 
    authenticateToken, 
    authorizeRole(['ADMIN']), 
    configController.update
);

// Logs (Admin uniquement)
router.get('/logs', 
    authenticateToken, 
    requirePermission('logs:read'), 
    logsController.get
);
```

---

## Modification Dynamique des Permissions (Admin)

### 1. Table de permissions (`database/migrations/010_create_permissions_config.cjs`)

```javascript
exports.up = (pgm) => {
    pgm.createTable('permissions_config', {
        id: { type: 'SERIAL', primaryKey: true },
        role: { type: 'VARCHAR(20)', notNull: true },
        permission: { type: 'VARCHAR(50)', notNull: true },
        is_active: { type: 'BOOLEAN', default: true },
        created_at: { type: 'TIMESTAMP', default: 'NOW()' },
        updated_at: { type: 'TIMESTAMP', default: 'NOW()' },
        CONSTRAINT uk_role_permission UNIQUE(role, permission)
    });
    pgm.createIndex('permissions_config', 'role');
};
```

### 2. Service de gestion (`src/services/permissionsService.js`)

```javascript
import pool from '../db/connexion.js';

export const permissionsService = {
    async getAllPermissions() { /* ... */ },
    async updateRolePermissions(role, permissions) { /* ... */ },
    async addPermission(role, permission) { /* ... */ },
    async removePermission(role, permission) { /* ... */ },
    async getRolePermissions(role) { /* ... */ }
};
```

### 3. Routes d'administration (`src/routes/admin-permissions.js`)

```javascript
// GET /api/admin/permissions - Liste toutes
// PUT /api/admin/permissions/:role - Mettre à jour
// POST /api/admin/permissions/:role - Ajouter
// DELETE /api/admin/permissions/:role/:permission - Supprimer
```

---

## Flux d'Authentication

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTIFICATION                            │
├─────────────────────────────────────────────────────────────────┤
│  Login → generateToken(role, interfaceType) → JWT              │
│                  ↓                                              │
│         { id, role, interfaceType, type }                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHORIZATION                              │
├─────────────────────────────────────────────────────────────────┤
│  Requête → authenticateToken → authorizeRole/requirePermission   │
│                                    ↓                            │
│                          requireInterface (mobile/desktop)       │
│                                    ↓                            │
│                              Controller                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Résumé des Étapes d'Intégration

1. **Migration**: `010_create_permissions_config.cjs`
2. **Seed**: `014_permissions_default.cjs`
3. **Middleware**: `interface-guard.js`
4. **Service**: `permissionsService.js`
5. **Routes**: `admin-permissions.js`
6. **JWT**: `jwt.js` mis à jour avec interfaceType
7. **Permissions**: `permissions.js` avec la matrice RBAC

---

*Document généré pour EcoTrack - Système RBAC*
