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

const resolveRequestUser = (req) => {
    if (req.user?.role) {
        return req.user;
    }

    const forwardedRole = req.headers['x-user-role'];
    const forwardedId = req.headers['x-user-id'];

    if (!forwardedRole) {
        return null;
    }

    req.user = {
        id: forwardedId ? parseInt(forwardedId, 10) : undefined,
        role: forwardedRole
    };

    return req.user;
};

const requirePermission = (permission) => {
    return (req, res, next) => {
        const user = resolveRequestUser(req);

        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!hasPermission(user.role, permission)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: permission,
                role: user.role
            });
        }
        next();
    };
};

const requirePermissions = (permissions) => {
    return (req, res, next) => {
        const user = resolveRequestUser(req);

        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const hasAny = permissions.some(p => hasPermission(user.role, p));
        if (!hasAny) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: permissions,
                role: user.role
            });
        }
        next();
    };
};

module.exports = { requirePermission, requirePermissions, hasPermission };
