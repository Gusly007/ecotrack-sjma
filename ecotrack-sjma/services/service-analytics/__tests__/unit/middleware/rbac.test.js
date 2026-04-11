const { requirePermission, requirePermissions, hasPermission } = require('../../../src/middleware/rbac');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('rbac middleware', () => {
  test('hasPermission handles wildcard and missing roles', () => {
    expect(hasPermission('ADMIN', 'anything')).toBe(true);
    expect(hasPermission('AGENT', 'analytics:read')).toBe(true);
    expect(hasPermission('UNKNOWN', 'analytics:read')).toBe(false);
  });

  test('requirePermission handles auth and authorization', () => {
    const res = createRes();
    const next = jest.fn();

    requirePermission('analytics:read')({}, res, next);
    expect(res.status).toHaveBeenCalledWith(401);

    requirePermission('analytics:write')({ user: { role: 'AGENT' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions', required: 'analytics:write', role: 'AGENT' });

    requirePermission('analytics:read')({ user: { role: 'ADMIN' } }, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('requirePermissions accepts any allowed permission', () => {
    const res = createRes();
    const next = jest.fn();

    requirePermissions(['analytics:write', 'analytics:read'])({ user: { role: 'AGENT' } }, res, next);
    expect(next).toHaveBeenCalled();

    requirePermissions(['analytics:write'])({ user: { role: 'AGENT' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});



