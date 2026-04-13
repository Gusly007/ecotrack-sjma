/**
 * Middleware RBAC pour service-routes
 */
const rolePermissions = {
    CITOYEN: [],
    AGENT: [
        'tournee:read',
        'tournee:update'
    ],
    GESTIONNAIRE: [
        'tournee:create',
        'tournee:read',
        'tournee:update',
        'tournee:delete'
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

    const headers = req.headers || {};
    const forwardedRole = headers['x-user-role'];
    const forwardedId = headers['x-user-id'];

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
