import { 
    rolePermissions, 
    hasPermission, 
    INTERFACE_BY_ROLE,
    getInterfaceType,
    isMobileRole,
    isDesktopRole 
} from '../../src/utils/permissions.js';

describe('utils/permissions', () => {
    describe('rolePermissions', () => {
        it('defines baseline permissions per role - CITOYEN', () => {
            expect(rolePermissions.CITOYEN).toEqual(
                expect.arrayContaining(['signaler:create', 'signaler:read'])
            );
        });

        it('defines baseline permissions per role - AGENT', () => {
            expect(rolePermissions.AGENT).toEqual(
                expect.arrayContaining(['signaler:create', 'signaler:read', 'signaler:update'])
            );
        });

        it('defines baseline permissions per role - GESTIONNAIRE', () => {
            expect(rolePermissions.GESTIONNAIRE).toEqual(
                expect.arrayContaining(['zone:create', 'zone:read', 'zone:update'])
            );
        });

        it('defines ADMIN with wildcard', () => {
            expect(rolePermissions.ADMIN).toEqual(['*']);
        });
    });

    describe('hasPermission', () => {
        it('returns true when role contains the permission', () => {
            expect(hasPermission('CITOYEN', 'signaler:read')).toBe(true);
            expect(hasPermission('GESTIONNAIRE', 'zone:create')).toBe(true);
        });

        it('returns false when permission missing for role', () => {
            expect(hasPermission('CITOYEN', 'zone:create')).toBe(false);
            expect(hasPermission('AGENT', 'zone:create')).toBe(false);
        });

        it('grants every permission for ADMIN wildcard', () => {
            expect(hasPermission('ADMIN', 'any:permission')).toBe(true);
            expect(hasPermission('ADMIN', 'users:delete')).toBe(true);
            expect(hasPermission('ADMIN', 'config:update')).toBe(true);
        });

        it('returns false for unknown roles', () => {
            expect(hasPermission('UNKNOWN', 'signaler:read')).toBe(false);
        });
    });

    describe('INTERFACE_BY_ROLE', () => {
        it('maps CITOYEN to mobile', () => {
            expect(INTERFACE_BY_ROLE.CITOYEN).toBe('mobile');
        });

        it('maps AGENT to mobile', () => {
            expect(INTERFACE_BY_ROLE.AGENT).toBe('mobile');
        });

        it('maps GESTIONNAIRE to desktop', () => {
            expect(INTERFACE_BY_ROLE.GESTIONNAIRE).toBe('desktop');
        });

        it('maps ADMIN to desktop', () => {
            expect(INTERFACE_BY_ROLE.ADMIN).toBe('desktop');
        });
    });

    describe('getInterfaceType', () => {
        it('returns mobile for CITOYEN', () => {
            expect(getInterfaceType('CITOYEN')).toBe('mobile');
        });

        it('returns mobile for AGENT', () => {
            expect(getInterfaceType('AGENT')).toBe('mobile');
        });

        it('returns desktop for GESTIONNAIRE', () => {
            expect(getInterfaceType('GESTIONNAIRE')).toBe('desktop');
        });

        it('returns desktop for ADMIN', () => {
            expect(getInterfaceType('ADMIN')).toBe('desktop');
        });

        it('returns mobile for unknown roles', () => {
            expect(getInterfaceType('UNKNOWN')).toBe('mobile');
        });
    });

    describe('isMobileRole', () => {
        it('returns true for CITOYEN', () => {
            expect(isMobileRole('CITOYEN')).toBe(true);
        });

        it('returns true for AGENT', () => {
            expect(isMobileRole('AGENT')).toBe(true);
        });

        it('returns false for GESTIONNAIRE', () => {
            expect(isMobileRole('GESTIONNAIRE')).toBe(false);
        });

        it('returns false for ADMIN', () => {
            expect(isMobileRole('ADMIN')).toBe(false);
        });
    });

    describe('isDesktopRole', () => {
        it('returns true for GESTIONNAIRE', () => {
            expect(isDesktopRole('GESTIONNAIRE')).toBe(true);
        });

        it('returns true for ADMIN', () => {
            expect(isDesktopRole('ADMIN')).toBe(true);
        });

        it('returns false for CITOYEN', () => {
            expect(isDesktopRole('CITOYEN')).toBe(false);
        });

        it('returns false for AGENT', () => {
            expect(isDesktopRole('AGENT')).toBe(false);
        });
    });
});
