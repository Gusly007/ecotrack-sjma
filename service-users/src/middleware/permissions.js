import { hasPermission } from '../utils/permissions.js';

/**
 * Vérifier les permissions de l'utilisateur
 */

export const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!hasPermission(req.user.role, permission)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

/**
 * Vérifier les permissions de l'utilisateur avec plusieurs permissions
 */
export const requirePermissions = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const hasAny = permissions.some(p => hasPermission(req.user.role, p));

        if (!hasAny) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

