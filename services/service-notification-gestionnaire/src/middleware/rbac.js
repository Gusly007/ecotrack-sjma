'use strict';

/**
 * RBAC — service-notification-gestionnaire
 *
 * Matrice des permissions :
 *   notifications:create  → ADMIN (envoie des notifs aux gestionnaires)
 *   notifications:bulk    → ADMIN
 *   notifications:own     → GESTIONNAIRE, ADMIN (lecture/marquage/suppression de ses propres notifs)
 */
const rolePermissions = {
  GESTIONNAIRE: [
    'notifications:own'
  ],
  ADMIN: ['*']
};

const hasPermission = (role, permission) => {
  const perms = rolePermissions[role] || [];
  if (perms.includes('*')) return true;
  return perms.includes(permission);
};

const requirePermission = (permission) => (req, res, next) => {
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

module.exports = { requirePermission, hasPermission };
