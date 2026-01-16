import { rolePermissions, hasPermission } from '../../src/utils/permissions.js';

describe('utils/permissions', () => {
	it('defines baseline permissions per role', () => {
		expect(rolePermissions.CITOYEN).toEqual(
			expect.arrayContaining(['signaler:create', 'profile:update'])
		);
		expect(rolePermissions.AGENT).toEqual(
			expect.arrayContaining(['collecte:create'])
		);
		expect(rolePermissions.ADMIN).toEqual(['*']);
	});

	it('returns true when role contains the permission', () => {
		expect(hasPermission('CITOYEN', 'signaler:read')).toBe(true);
		expect(hasPermission('GESTIONNAIRE', 'users:read')).toBe(true);
	});

	it('returns false when permission missing for role', () => {
		expect(hasPermission('CITOYEN', 'users:read')).toBe(false);
	});

	it('grants every permission for ADMIN wildcard', () => {
		expect(hasPermission('ADMIN', 'any:permission')).toBe(true);
	});

	it('returns false for unknown roles', () => {
		expect(hasPermission('UNKNOWN', 'signaler:read')).toBe(false);
	});
});
