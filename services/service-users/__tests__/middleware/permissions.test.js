import { requirePermission, requirePermissions } from '../../src/middleware/permissions.js';
import { hasPermission } from '../../src/utils/permissions.js';

jest.mock('../../src/utils/permissions.js', () => ({
	__esModule: true,
	hasPermission: jest.fn(),
}));

const buildRes = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
};

describe('permissions middleware', () => {
	let next;

	beforeEach(() => {
		jest.clearAllMocks();
		next = jest.fn();
	});

	describe('requirePermission', () => {
		it('responds 401 when user missing', () => {
			const req = {};
			const res = buildRes();

			requirePermission('users:read')(req, res, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
			expect(next).not.toHaveBeenCalled();
			expect(hasPermission).not.toHaveBeenCalled();
		});

		it('responds 403 when permission denied', () => {
			const req = { user: { role: 'CITOYEN' } };
			const res = buildRes();
			hasPermission.mockReturnValue(false);

			requirePermission('users:read')(req, res, next);

			expect(hasPermission).toHaveBeenCalledWith('CITOYEN', 'users:read');
			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
			expect(next).not.toHaveBeenCalled();
		});

		it('calls next when permission granted', () => {
			const req = { user: { role: 'ADMIN' } };
			const res = buildRes();
			hasPermission.mockReturnValue(true);

			requirePermission('users:read')(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
			expect(res.status).not.toHaveBeenCalled();
		});
	});

	describe('requirePermissions', () => {
		it('responds 401 when user missing', () => {
			const req = {};
			const res = buildRes();

			requirePermissions(['users:read', 'users:write'])(req, res, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
			expect(hasPermission).not.toHaveBeenCalled();
		});

		it('responds 403 when user lacks every permission', () => {
			const req = { user: { role: 'CITOYEN' } };
			const res = buildRes();
			hasPermission.mockReturnValue(false);

			requirePermissions(['users:read', 'users:write'])(req, res, next);

			expect(hasPermission).toHaveBeenCalledTimes(2);
			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
			expect(next).not.toHaveBeenCalled();
		});

		it('calls next when user has at least one permission', () => {
			const req = { user: { role: 'GESTIONNAIRE' } };
			const res = buildRes();
			hasPermission
				.mockReturnValueOnce(false)
				.mockReturnValueOnce(true);

			requirePermissions(['users:delete', 'users:read'])(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
			expect(res.status).not.toHaveBeenCalled();
		});
	});
});
