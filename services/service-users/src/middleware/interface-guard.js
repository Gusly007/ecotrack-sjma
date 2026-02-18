import { isMobileRole, isDesktopRole } from '../utils/permissions.js';

/**
 * Middleware pour vérifier le type d'interface (mobile/desktop)
 */
export const requireInterface = (interfaceType) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role;
        let hasAccess = false;

        if (interfaceType === 'mobile') {
            hasAccess = isMobileRole(userRole);
        } else if (interfaceType === 'desktop') {
            hasAccess = isDesktopRole(userRole);
        }

        if (!hasAccess) {
            return res.status(403).json({
                error: `Cette route nécessite l'interface ${interfaceType}`,
                currentRole: userRole,
                requiredInterface: interfaceType,
                message: 'Vous n\'avez pas accès à cette interface'
            });
        }
        next();
    };
};

/**
 * Middleware pour uniquement l'interface desktop
 */
export const requireDesktop = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!isDesktopRole(req.user.role)) {
        return res.status(403).json({
            error: 'Cette route nécessite l\'interface desktop',
            currentRole: req.user.role
        });
    }
    next();
};

/**
 * Middleware pour uniquement l'interface mobile
 */
export const requireMobile = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!isMobileRole(req.user.role)) {
        return res.status(403).json({
            error: 'Cette route nécessite l\'interface mobile',
            currentRole: req.user.role
        });
    }
    next();
};
