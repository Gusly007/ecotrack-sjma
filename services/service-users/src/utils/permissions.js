/**
 * Définition des permissions par rôle selon la matrice RBAC
 * 
 * Format: service:action (create, read, update, delete)
 */

export const rolePermissions = {
    /** Rôle mobile - Citoyen */
    CITOYEN: [
        // Signalements
        'signaler:create',
        'signaler:read',
        
        // Containers (lecture seule)
        'containers:read',
        
        // Gamification
        'gamification:read',
        'badges:read',
        'defis:read',
        'points:read',
        'classement:read'
    ],
    
    /** Rôle mobile - Agent de collecte */
    AGENT: [
        // Signalements
        'signaler:create',
        'signaler:read',
        'signaler:update',
        
        // Tournées
        'tournee:read',
        'tournee:update',
        
        // Containers
        'containers:read',
        'containers:update',
        
        // Mesures IoT
        'iot:read',
        
        // Gamification
        'gamification:read',
        'badges:read',
        'defis:read',
        'points:read',
        'classement:read'
    ],
    
    /** Rôle desktop - Gestionnaire */
    GESTIONNAIRE: [
        // Signalements (full CRUD)
        'signaler:create',
        'signaler:read',
        'signaler:update',
        'signaler:delete',
        
        // Tournées (full CRUD)
        'tournee:create',
        'tournee:read',
        'tournee:update',
        'tournee:delete',
        
        // Containers (full CRUD)
        'containers:create',
        'containers:read',
        'containers:update',
        'containers:delete',
        
        // Zones (full CRUD)
        'zone:create',
        'zone:read',
        'zone:update',
        'zone:delete',
        
        // IoT
        'iot:read',
        'iot:update',
        
        // Analytics
        'analytics:read',
        
        // Gamification
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
    
    /** Rôle desktop - Administrateur */
    ADMIN: ['*']
};

/**
 * Permissions par type d'interface (mobile/desktop)
 * Utilisé pour过滤器 les endpoints selon l'interface
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
 * Mapping permissions vers services
 */
export const PERMISSIONS_BY_SERVICE = {
    signaler: ['signaler:create', 'signaler:read', 'signaler:update', 'signaler:delete'],
    tournee: ['tournee:create', 'tournee:read', 'tournee:update', 'tournee:delete'],
    containers: ['containers:create', 'containers:read', 'containers:update', 'containers:delete'],
    zone: ['zone:create', 'zone:read', 'zone:update', 'zone:delete'],
    iot: ['iot:read', 'iot:update'],
    analytics: ['analytics:read'],
    gamification: ['gamification:create', 'gamification:read', 'gamification:update', 'gamification:delete'],
    badges: ['badges:create', 'badges:read', 'badges:update', 'badges:delete'],
    defis: ['defis:create', 'defis:read', 'defis:update', 'defis:delete'],
    points: ['points:read'],
    classement: ['classement:read']
};

/**
 * Obtenir les permissions par service pour un rôle
 * @param {string} role - Le rôle de l'utilisateur
 * @returns {Object} - Permissions groupées par service
 */
export const getPermissionsByService = (role) => {
    const perms = rolePermissions[role] || [];
    if (perms.includes('*')) {
        // Return all permissions
        const all = {};
        for (const [service, servicePerms] of Object.entries(PERMISSIONS_BY_SERVICE)) {
            all[service] = servicePerms;
        }
        return all;
    }
    
    const result = {};
    for (const [service, servicePerms] of Object.entries(PERMISSIONS_BY_SERVICE)) {
        const filtered = servicePerms.filter(p => perms.includes(p));
        if (filtered.length > 0) {
            result[service] = filtered;
        }
    }
    return result;
};

/**
 * Vérifier si un rôle a une permission spécifique
 * @param {string} role - Le rôle de l'utilisateur
 * @param {string} permission - La permission à vérifier
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
    const perms = rolePermissions[role] || [];
    if (perms.includes('*')) return true;
    return perms.includes(permission);
};

/**
 * Vérifier si un rôle peut effectuer une action CRUD sur un service
 * @param {string} role - Le rôle de l'utilisateur
 * @param {string} service - Le service (ex: 'containers')
 * @param {string} action - L'action (ex: 'create')
 * @returns {boolean}
 */
export const canPerformAction = (role, service, action) => {
    const permission = `${service}:${action}`;
    return hasPermission(role, permission);
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

/**
 * Liste de toutes les permissions disponibles
 */
export const ALL_PERMISSIONS = [
    // Signalements
    'signaler:create', 'signaler:read', 'signaler:update', 'signaler:delete',
    // Tournées
    'tournee:create', 'tournee:read', 'tournee:update', 'tournee:delete',
    // Containers
    'containers:create', 'containers:read', 'containers:update', 'containers:delete',
    // Zones
    'zone:create', 'zone:read', 'zone:update', 'zone:delete',
    // IoT
    'iot:read', 'iot:update',
    // Analytics
    'analytics:read',
    // Gamification
    'gamification:create', 'gamification:read', 'gamification:update', 'gamification:delete',
    // Badges
    'badges:create', 'badges:read', 'badges:update', 'badges:delete',
    // Défis
    'defis:create', 'defis:read', 'defis:update', 'defis:delete',
    // Points
    'points:read',
    // Classement
    'classement:read'
];
