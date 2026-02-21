/**
 * Définition des permissions par rôle selon la matrice RBAC
 */
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

/**
 * Types d'interface par rôle
 */
export const INTERFACE_BY_ROLE = {
    CITOYEN: 'mobile',
    AGENT: 'mobile',
    GESTIONNAIRE: 'desktop',
    ADMIN: 'desktop'
};

/**
 * Rôles par type d'interface
 */
export const ROLES_BY_INTERFACE = {
    mobile: ['CITOYEN', 'AGENT'],
    desktop: ['GESTIONNAIRE', 'ADMIN']
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

/**
 * Obtenir le type d'interface pour un rôle
 * @param {string} role - Le rôle de l'utilisateur
 * @returns {string} - 'mobile' ou 'desktop'
 */
export const getInterfaceType = (role) => {
    return INTERFACE_BY_ROLE[role] || 'mobile';
};

/**
 * Vérifier si un rôle est un utilisateur mobile
 * @param {string} role - Le rôle de l'utilisateur
 * @returns {boolean}
 */
export const isMobileRole = (role) => {
    return role === 'CITOYEN' || role === 'AGENT';
};

/**
 * Vérifier si un rôle est un utilisateur desktop
 * @param {string} role - Le rôle de l'utilisateur
 * @returns {boolean}
 */
export const isDesktopRole = (role) => {
    return role === 'GESTIONNAIRE' || role === 'ADMIN';
};
