/**
 * Middleware RBAC pour service-routes
 */
const ApiError = require('../utils/api-error');

const rolePermissions = {
    CITOYEN: [
        // Lecture publique des prochaines collectes (feed home citoyen).
        'collecte:read'
    ],
    AGENT: [
        'tournee:read',
        'tournee:update',
        'collecte:read'
    ],
    GESTIONNAIRE: [
        'tournee:create',
        'tournee:read',
        'tournee:update',
        'tournee:delete',
        'collecte:read'
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

const assertTourneeAccess = (tournee, user) => {
    if (['ADMIN', 'GESTIONNAIRE'].includes(user?.role)) return;

    const agentId = Number(user?.id);
    if (user?.role !== 'AGENT' || !Number.isSafeInteger(agentId) || agentId <= 0
        || tournee.id_agent !== agentId) {
        throw new ApiError(403, 'Vous n\'êtes pas assigné à cette tournée');
    }
};

module.exports = { requirePermission, requirePermissions, hasPermission, assertTourneeAccess };
