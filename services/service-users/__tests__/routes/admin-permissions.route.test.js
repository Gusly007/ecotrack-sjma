const passthrough = (req, res, next) => next();

jest.mock('../../src/middleware/auth.js', () => ({
  __esModule: true,
  authenticateToken: passthrough,
  authorizeRole: jest.fn(() => passthrough),
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

import router from '../../src/routes/admin-permissions.js';
import { permissionsService } from '../../src/services/permissionsService.js';

function getHandler(method, path) {
  const layer = router.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('admin-permissions inline handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET / returns all permissions', async () => {
    permissionsService.getAllPermissions.mockResolvedValue(['a:read']);

    const handler = getHandler('get', '/');
    const res = mockRes();
    await handler({}, res);

    expect(res.json).toHaveBeenCalledWith(['a:read']);
  });

  it('GET /:role returns permissions for role', async () => {
    permissionsService.getRolePermissions.mockResolvedValue(['users:read']);

    const handler = getHandler('get', '/:role');
    const req = { params: { role: 'ADMIN' } };
    const res = mockRes();
    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith({ role: 'ADMIN', permissions: ['users:read'] });
  });

  it('PUT /:role validates permissions array', async () => {
    const handler = getHandler('put', '/:role');

    const resInvalid = mockRes();
    await handler({ params: { role: 'ADMIN' }, body: { permissions: 'x' } }, resInvalid);
    expect(resInvalid.status).toHaveBeenCalledWith(400);

    const resOk = mockRes();
    await handler({ params: { role: 'ADMIN' }, body: { permissions: ['x'] } }, resOk);
    expect(permissionsService.updateRolePermissions).toHaveBeenCalledWith('ADMIN', ['x']);
    expect(resOk.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('POST /:role validates permission field', async () => {
    const handler = getHandler('post', '/:role');

    const resInvalid = mockRes();
    await handler({ params: { role: 'ADMIN' }, body: {} }, resInvalid);
    expect(resInvalid.status).toHaveBeenCalledWith(400);

    const resOk = mockRes();
    await handler({ params: { role: 'ADMIN' }, body: { permission: 'users:read' } }, resOk);
    expect(permissionsService.addPermission).toHaveBeenCalledWith('ADMIN', 'users:read');
    expect(resOk.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('DELETE /:role/:permission removes permission', async () => {
    const handler = getHandler('delete', '/:role/:permission');
    const req = { params: { role: 'ADMIN', permission: 'users:read' } };
    const res = mockRes();
    await handler(req, res);

    expect(permissionsService.removePermission).toHaveBeenCalledWith('ADMIN', 'users:read');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 500 on service errors', async () => {
    permissionsService.getAllPermissions.mockRejectedValue(new Error('boom'));

    const handler = getHandler('get', '/');
    const res = mockRes();
    await handler({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'boom' });
  });
});
