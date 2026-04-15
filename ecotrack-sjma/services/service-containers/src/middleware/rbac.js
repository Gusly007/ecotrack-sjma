/**
 * Middleware RBAC pour service-containers
 */
const rolePermissions = {
    CITOYEN: [
        'containers:read'
    ],
    AGENT: [
        'containers:read',
        'containers:update'
    ],
    GESTIONNAIRE: [
        'containers:create',
        'containers:read',
        'containers:update',
        'containers:delete',
        'zone:create',
        'zone:read',
        'zone:update',
        'zone:delete'
    ],
    ADMIN: ['*']
};

const hasPermission = (role, permission) => {
    const perms = rolePermissions[role] || [];
    if (perms.includes('*')) return true;
    return perms.includes(permission);
};

const requirePermission = (permission) => {
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

const requirePermissions = (permissions) => {
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

module.exports = { requirePermission, requirePermissions, hasPermission };
