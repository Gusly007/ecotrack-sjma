/**
 * Middleware RBAC pour service-gamifications
 */
const rolePermissions = {
    CITOYEN: [
        'gamification:read',
        'badges:read',
        'defis:read',
        'points:read',
        'classement:read'
    ],
    AGENT: [
        'gamification:read',
        'badges:read',
        'defis:read',
        'points:read',
        'classement:read'
    ],
    GESTIONNAIRE: [
        'gamification:create',
        'gamification:read',
        'gamification:update',
        'gamification:delete',
        'badges:create',
        'badges:read',
        'badges:update',
        'badges:delete',
        'defis:create',
        'defis:read',
        'defis:update',
        'defis:delete',
        'points:read',
        'classement:read'
    ],
    ADMIN: ['*']
};

const hasPermission = (role, permission) => {
    const perms = rolePermissions[role] || [];
    if (perms.includes('*')) return true;
    return perms.includes(permission);
};

export const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!hasPermission(req.user.role, permission)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: permission,
                role: req.user.role
            });
        }
        next();
    };
};

export const requirePermissions = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const hasAny = permissions.some(p => hasPermission(req.user.role, p));
        if (!hasAny) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: permissions,
                role: req.user.role
            });
        }
        next();
    };
};
