/**
 * Définir les permissions par rôle
 */
export const rolePermissions = {
    CITOYEN: [
    'signaler:create',
    'signaler:read',
    'containers:read',
    'profile:read',
    'profile:update'
  ],
  AGENT: [
    'signaler:read',
    'signaler:update',
    'containers:read',
    'tournee:read',
    'tournee:update',
    'collecte:create'
  ],
  GESTIONNAIRE: [
    'signaler:read',
    'signaler:update',
    'containers:read',
    'containers:update',
    'tournee:create',
    'tournee:read',
    'tournee:update',
    'users:read',
    'analytics:read'
  ],
  ADMIN: ['*']
};

/**
 * Vérifier si un rôle a une permission spécifique
 * @param {string} role - Le rôle de l'utilisateur.
 * @param {string} permission - La permission à vérifier.
 * @returns {boolean} - True si le rôle a la permission, sinon false.
 */

export const hasPermission = (role, permission) => {
  const perms = rolePermissions[role] || [];
  if (perms.includes('*')) return true;
  return perms.includes(permission);
};