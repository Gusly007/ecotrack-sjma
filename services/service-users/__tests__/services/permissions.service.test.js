/**
 * Tests Unitaires - PermissionsService
 */

import { permissionsService } from '../../src/services/permissionsService.js';
import { permissionsRepository } from '../../src/repositories/permissionsRepository.js';
import { rolePermissions } from '../../src/utils/permissions.js';

jest.mock('../../src/repositories/permissionsRepository.js');
jest.mock('../../src/utils/permissions.js', () => ({
    rolePermissions: {
        CITOYEN: ['signaler:create', 'signaler:read'],
        AGENT: ['signaler:create', 'signaler:read', 'signaler:update'],
        GESTIONNAIRE: ['signaler:create', 'signaler:read', 'zone:create'],
        ADMIN: ['*']
    }
}));

describe('PermissionsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllPermissions', () => {
        it('devrait retourner toutes les permissions groupées par rôle', async () => {
            const mockRows = [
                { role: 'CITOYEN', permission: 'signaler:create', is_active: true },
                { role: 'CITOYEN', permission: 'signaler:read', is_active: true },
                { role: 'AGENT', permission: 'signaler:read', is_active: true }
            ];
            permissionsRepository.findAll.mockResolvedValue(mockRows);

            const result = await permissionsService.getAllPermissions();

            expect(result).toEqual({
                CITOYEN: ['signaler:create', 'signaler:read'],
                AGENT: ['signaler:read']
            });
        });

        it('devrait ignorer les permissions inactives', async () => {
            const mockRows = [
                { role: 'CITOYEN', permission: 'signaler:create', is_active: true },
                { role: 'CITOYEN', permission: 'signaler:read', is_active: false }
            ];
            permissionsRepository.findAll.mockResolvedValue(mockRows);

            const result = await permissionsService.getAllPermissions();

            expect(result).toEqual({
                CITOYEN: ['signaler:create']
            });
        });

        it('devrait retourner un objet vide si aucune permission', async () => {
            permissionsRepository.findAll.mockResolvedValue([]);

            const result = await permissionsService.getAllPermissions();

            expect(result).toEqual({});
        });
    });

    describe('getRolePermissions', () => {
        it('devrait retourner les permissions actives dun rôle', async () => {
            const mockPermissions = ['signaler:create', 'signaler:read'];
            permissionsRepository.findActiveByRole.mockResolvedValue(mockPermissions);

            const result = await permissionsService.getRolePermissions('CITOYEN');

            expect(permissionsRepository.findActiveByRole).toHaveBeenCalledWith('CITOYEN');
            expect(result).toEqual(mockPermissions);
        });
    });

    describe('updateRolePermissions', () => {
        it('devrait supprimer et recréer les permissions dun rôle', async () => {
            permissionsRepository.deleteAllByRole.mockResolvedValue({});
            permissionsRepository.create.mockResolvedValue({});

            const newPermissions = ['signaler:create', 'signaler:read', 'tournee:create'];
            const result = await permissionsService.updateRolePermissions('GESTIONNAIRE', newPermissions);

            expect(permissionsRepository.deleteAllByRole).toHaveBeenCalledWith('GESTIONNAIRE');
            expect(permissionsRepository.create).toHaveBeenCalledTimes(3);
            expect(result).toEqual({ success: true });
        });

        it('devrait gérer un tableau de permissions vide', async () => {
            permissionsRepository.deleteAllByRole.mockResolvedValue({});

            const result = await permissionsService.updateRolePermissions('CITOYEN', []);

            expect(permissionsRepository.create).not.toHaveBeenCalled();
            expect(result).toEqual({ success: true });
        });
    });

    describe('addPermission', () => {
        it('devrait créer une nouvelle permission si elle nexiste pas', async () => {
            permissionsRepository.findByRoleAndPermission.mockResolvedValue(undefined);
            permissionsRepository.create.mockResolvedValue({ id: 1, role: 'CITOYEN', permission: 'zone:read', is_active: true });

            const result = await permissionsService.addPermission('CITOYEN', 'zone:read');

            expect(permissionsRepository.create).toHaveBeenCalledWith('CITOYEN', 'zone:read');
            expect(result.permission).toBe('zone:read');
        });

        it('devrait reactiver une permission désactivée', async () => {
            const existingPermission = { id: 1, role: 'CITOYEN', permission: 'signaler:create', is_active: false };
            permissionsRepository.findByRoleAndPermission.mockResolvedValue(existingPermission);
            permissionsRepository.updateStatus.mockResolvedValue({ ...existingPermission, is_active: true });

            const result = await permissionsService.addPermission('CITOYEN', 'signaler:create');

            expect(permissionsRepository.updateStatus).toHaveBeenCalledWith('CITOYEN', 'signaler:create', true);
            expect(result.is_active).toBe(true);
        });
    });

    describe('removePermission', () => {
        it('devrait désactiver une permission', async () => {
            permissionsRepository.updateStatus.mockResolvedValue({ id: 1, role: 'CITOYEN', permission: 'signaler:create', is_active: false });

            const result = await permissionsService.removePermission('CITOYEN', 'signaler:create');

            expect(permissionsRepository.updateStatus).toHaveBeenCalledWith('CITOYEN', 'signaler:create', false);
            expect(result.is_active).toBe(false);
        });
    });

    describe('initializeDefaultPermissions', () => {
        it('devrait créer toutes les permissions par défaut', async () => {
            permissionsRepository.createMany.mockResolvedValue(true);

            await permissionsService.initializeDefaultPermissions();

            expect(permissionsRepository.createMany).toHaveBeenCalled();
            const callArgs = permissionsRepository.createMany.mock.calls[0][0];
            expect(callArgs).toContainEqual({ role: 'CITOYEN', permission: 'signaler:create' });
            expect(callArgs).toContainEqual({ role: 'ADMIN', permission: '*' });
        });
    });

    describe('getPermissionsMatrix', () => {
        it('devrait retourner la matrice complète avec les rôles', async () => {
            const dbPermissions = {
                CITOYEN: ['signaler:create'],
                AGENT: ['signaler:create', 'signaler:read']
            };
            permissionsRepository.findAll.mockResolvedValue(
                Object.entries(dbPermissions).flatMap(([role, perms]) =>
                    perms.map(permission => ({ role, permission, is_active: true }))
                )
            );

            const result = await permissionsService.getPermissionsMatrix();

            expect(result).toHaveProperty('CITOYEN');
            expect(result).toHaveProperty('AGENT');
            expect(result).toHaveProperty('GESTIONNAIRE');
            expect(result).toHaveProperty('ADMIN');
        });

        it('devrait utiliser les permissions par défaut si la DB est vide', async () => {
            permissionsRepository.findAll.mockResolvedValue([]);

            const result = await permissionsService.getPermissionsMatrix();

            expect(result.CITOYEN).toEqual(['signaler:create', 'signaler:read']);
            expect(result.ADMIN).toEqual(['*']);
        });
    });
});
