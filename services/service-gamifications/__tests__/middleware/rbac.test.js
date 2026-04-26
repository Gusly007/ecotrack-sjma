import { jest } from '@jest/globals';

import { requirePermission, requirePermissions } from '../../src/middleware/rbac.js';

describe('RBAC middleware', () => {
  const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  });

  it('requirePermission returns 401 when unauthenticated', () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    requirePermission('badges:read')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('requirePermission returns 403 when role has no permission', () => {
    const req = { user: { role: 'CITOYEN' } };
    const res = makeRes();
    const next = jest.fn();

    requirePermission('badges:create')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('requirePermission allows role with exact permission', () => {
    const req = { user: { role: 'CITOYEN' } };
    const res = makeRes();
    const next = jest.fn();

    requirePermission('badges:read')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('requirePermission allows admin wildcard permission', () => {
    const req = { user: { role: 'ADMIN' } };
    const res = makeRes();
    const next = jest.fn();

    requirePermission('totally:unknown')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('requirePermission denies unknown role', () => {
    const req = { user: { role: 'UNKNOWN' } };
    const res = makeRes();
    const next = jest.fn();

    requirePermission('badges:read')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('requirePermissions returns 401 when unauthenticated', () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    requirePermissions(['defis:read', 'badges:read'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('requirePermissions allows when at least one permission matches', () => {
    const req = { user: { role: 'CITOYEN' } };
    const res = makeRes();
    const next = jest.fn();

    requirePermissions(['defis:create', 'badges:read'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('requirePermissions returns 403 when none match', () => {
    const req = { user: { role: 'AGENT' } };
    const res = makeRes();
    const next = jest.fn();

    requirePermissions(['defis:create', 'badges:create'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Insufficient permissions',
        role: 'AGENT'
      })
    );
  });

  it('requirePermissions supports wildcard admin', () => {
    const req = { user: { role: 'ADMIN' } };
    const res = makeRes();
    const next = jest.fn();

    requirePermissions(['x:y', 'a:b'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
