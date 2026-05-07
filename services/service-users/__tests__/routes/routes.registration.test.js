const passthrough = (req, res, next) => next();

jest.mock('../../src/controllers/userController.js', () => ({
  __esModule: true,
  getOwnProfile: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
  getProfileWithStats: jest.fn(),
  listUsers: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserByAdmin: jest.fn(),
  deleteUser: jest.fn(),
  getUserStats: jest.fn(),
}));

jest.mock('../../src/controllers/authController.js', () => ({
  __esModule: true,
  register: jest.fn(),
  login: jest.fn(),
  getProfile: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  activateAccount: jest.fn(),
}));

jest.mock('../../src/controllers/sessionController.js', () => ({
  __esModule: true,
  refreshAccessToken: jest.fn(),
  logout: jest.fn(),
  logoutAll: jest.fn(),
}));

jest.mock('../../src/controllers/roleController.js', () => ({
  __esModule: true,
  getUserRoles: jest.fn(),
  assignRole: jest.fn(),
  removeRole: jest.fn(),
}));

jest.mock('../../src/controllers/notificationController.js', () => ({
  __esModule: true,
  getNotifications: jest.fn(),
  getUnreadCount: jest.fn(),
  markAsRead: jest.fn(),
  deleteNotification: jest.fn(),
}));

jest.mock('../../src/controllers/avatarController.js', () => ({
  __esModule: true,
  uploadAvatar: jest.fn(),
  getUserAvatar: jest.fn(),
  deleteAvatar: jest.fn(),
}));

jest.mock('../../src/middleware/auth.js', () => ({
  __esModule: true,
  authenticateToken: passthrough,
  authorizeRole: jest.fn(() => passthrough),
}));

jest.mock('../../src/middleware/permissions.js', () => ({
  __esModule: true,
  requirePermission: jest.fn(() => passthrough),
}));

jest.mock('../../src/middleware/validate.js', () => ({
  __esModule: true,
  validate: jest.fn(() => passthrough),
}));

jest.mock('../../src/config/rateLimit.js', () => ({
  __esModule: true,
  publicLimiter: passthrough,
  loginLimiter: passthrough,
  passwordResetLimiter: passthrough,
}));

jest.mock('../../src/config/multer.js', () => ({
  __esModule: true,
  default: {
    single: jest.fn(() => passthrough),
  },
}));

jest.mock('../../src/services/permissionsService.js', () => ({
  __esModule: true,
  permissionsService: {
    getAllPermissions: jest.fn(),
    getRolePermissions: jest.fn(),
    updateRolePermissions: jest.fn(),
    addPermission: jest.fn(),
    removePermission: jest.fn(),
  },
}));

import usersRouter from '../../src/routes/users.js';
import authRouter from '../../src/routes/auth.js';
import rolesRouter from '../../src/routes/roles.js';
import notificationsRouter from '../../src/routes/notifications.js';
import avatarsRouter from '../../src/routes/avatars.js';
import adminPermissionsRouter from '../../src/routes/admin-permissions.js';

function hasRoute(router, method, path) {
  return router.stack.some((layer) =>
    layer.route && layer.route.path === path && layer.route.methods[method]
  );
}

describe('Routes registration', () => {
  it('registers expected users routes', () => {
    expect(hasRoute(usersRouter, 'get', '/profile')).toBe(true);
    expect(hasRoute(usersRouter, 'put', '/profile')).toBe(true);
    expect(hasRoute(usersRouter, 'post', '/change-password')).toBe(true);
    expect(hasRoute(usersRouter, 'get', '/profile-with-stats')).toBe(true);
    expect(hasRoute(usersRouter, 'get', '/')).toBe(true);
    expect(hasRoute(usersRouter, 'get', '/:id')).toBe(true);
    expect(hasRoute(usersRouter, 'put', '/:id')).toBe(true);
    expect(hasRoute(usersRouter, 'delete', '/:id')).toBe(true);
    expect(hasRoute(usersRouter, 'get', '/:id/stats')).toBe(true);
  });

  it('registers expected auth routes', () => {
    expect(hasRoute(authRouter, 'post', '/register')).toBe(true);
    expect(hasRoute(authRouter, 'post', '/login')).toBe(true);
    expect(hasRoute(authRouter, 'get', '/profile')).toBe(true);
    expect(hasRoute(authRouter, 'post', '/refresh')).toBe(true);
    expect(hasRoute(authRouter, 'post', '/logout')).toBe(true);
    expect(hasRoute(authRouter, 'post', '/logout-all')).toBe(true);
    expect(hasRoute(authRouter, 'post', '/forgot-password')).toBe(true);
    expect(hasRoute(authRouter, 'post', '/reset-password')).toBe(true);
    expect(hasRoute(authRouter, 'post', '/activate')).toBe(true);
  });

  it('registers expected roles routes', () => {
    expect(hasRoute(rolesRouter, 'get', '/users/:id')).toBe(true);
    expect(hasRoute(rolesRouter, 'post', '/users/:id')).toBe(true);
    expect(hasRoute(rolesRouter, 'delete', '/users/:id/:roleId')).toBe(true);
  });

  it('registers expected notifications routes', () => {
    expect(hasRoute(notificationsRouter, 'get', '/')).toBe(true);
    expect(hasRoute(notificationsRouter, 'get', '/unread-count')).toBe(true);
    expect(hasRoute(notificationsRouter, 'put', '/:id/read')).toBe(true);
    expect(hasRoute(notificationsRouter, 'delete', '/:id')).toBe(true);
  });

  it('registers expected avatars routes', () => {
    expect(hasRoute(avatarsRouter, 'post', '/upload')).toBe(true);
    expect(hasRoute(avatarsRouter, 'get', '/:userId')).toBe(true);
    expect(hasRoute(avatarsRouter, 'delete', '/')).toBe(true);
  });

  it('registers expected admin permissions routes', () => {
    expect(hasRoute(adminPermissionsRouter, 'get', '/')).toBe(true);
    expect(hasRoute(adminPermissionsRouter, 'get', '/:role')).toBe(true);
    expect(hasRoute(adminPermissionsRouter, 'put', '/:role')).toBe(true);
    expect(hasRoute(adminPermissionsRouter, 'post', '/:role')).toBe(true);
    expect(hasRoute(adminPermissionsRouter, 'delete', '/:role/:permission')).toBe(true);
  });
});
