
// Rôles
export const ROLES = {
  CITOYEN: 'CITOYEN',
  AGENT: 'AGENT',
  GESTIONNAIRE: 'GESTIONNAIRE',
  ADMIN: 'ADMIN',
};

// Types d'interface par rôle
export const INTERFACE_BY_ROLE = {
  [ROLES.CITOYEN]: 'mobile',
  [ROLES.AGENT]: 'mobile',
  [ROLES.GESTIONNAIRE]: 'desktop',
  [ROLES.ADMIN]: 'desktop',
};

// Labels
export const ROLE_LABELS = {
  [ROLES.CITOYEN]: 'Citoyen',
  [ROLES.AGENT]: 'Agent',
  [ROLES.GESTIONNAIRE]: 'Gestionnaire',
  [ROLES.ADMIN]: 'Administrateur',
};

// Permissions
export const PERMISSIONS = {
  SIGNALER_CREATE: 'signaler:create',
  SIGNALER_READ: 'signaler:read',
  SIGNALER_UPDATE: 'signaler:update',
  TOURNEE_CREATE: 'tournee:create',
  TOURNEE_READ: 'tournee:read',
  TOURNEE_UPDATE: 'tournee:update',
  CONTAINERS_UPDATE: 'containers:update',
  USER_READ: 'user:read',
  ZONE_CREATE: 'zone:create',
  ZONE_READ: 'zone:read',
  ZONE_UPDATE: 'zone:update',
  USERS_CREATE: 'users:create',
  USERS_DELETE: 'users:delete',
  CONFIG_UPDATE: 'config:update',
  LOGS_READ: 'logs:read',
};

// Matrice des permissions par rôle
export const ROLE_PERMISSIONS = {
  [ROLES.CITOYEN]: [
    PERMISSIONS.SIGNALER_CREATE,
    PERMISSIONS.SIGNALER_READ,
  ],
  [ROLES.AGENT]: [
    PERMISSIONS.SIGNALER_CREATE,
    PERMISSIONS.SIGNALER_READ,
    PERMISSIONS.SIGNALER_UPDATE,
    PERMISSIONS.TOURNEE_READ,
    PERMISSIONS.TOURNEE_UPDATE,
    PERMISSIONS.CONTAINERS_UPDATE,
  ],
  [ROLES.GESTIONNAIRE]: [
    PERMISSIONS.SIGNALER_CREATE,
    PERMISSIONS.SIGNALER_READ,
    PERMISSIONS.SIGNALER_UPDATE,
    PERMISSIONS.TOURNEE_CREATE,
    PERMISSIONS.TOURNEE_READ,
    PERMISSIONS.TOURNEE_UPDATE,
    PERMISSIONS.CONTAINERS_UPDATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.ZONE_READ,
    PERMISSIONS.ZONE_CREATE,
    PERMISSIONS.ZONE_UPDATE,
  ],
  [ROLES.ADMIN]: ['*'],
};

export const MOBILE_ROLES = [ROLES.CITOYEN, ROLES.AGENT];
export const DESKTOP_ROLES = [ROLES.GESTIONNAIRE, ROLES.ADMIN];
