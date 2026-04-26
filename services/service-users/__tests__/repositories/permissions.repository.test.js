/**
 * Tests Unitaires - PermissionsRepository
 */

import { permissionsRepository } from '../../src/repositories/permissionsRepository.js';

jest.mock('../../src/config/database.js', () => ({
    query: jest.fn(),
    connect: jest.fn()
}));

import pool from '../../src/config/database.js';

describe('PermissionsRepository', () => {
    let mockConnect;

    beforeEach(() => {
        jest.clearAllMocks();
        pool.query.mockResolvedValue({ rows: [] });
        mockConnect = {
            query: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        };
        pool.connect.mockResolvedValue(mockConnect);
    });

    describe('findAll', () => {
        it('devrait retourner toutes les permissions', async () => {
            const mockRows = [
                { role: 'CITOYEN', permission: 'signaler:create', is_active: true },
                { role: 'CITOYEN', permission: 'signaler:read', is_active: true }
            ];
            pool.query.mockResolvedValue({ rows: mockRows });

            const result = await permissionsRepository.findAll();

            expect(result).toEqual(mockRows);
        });

        it('devrait retourner un tableau vide si aucune permission', async () => {
            pool.query.mockResolvedValue({ rows: [] });

            const result = await permissionsRepository.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('findByRole', () => {
        it('devrait retourner les permissions pour un rôle', async () => {
            const mockRows = [{ permission: 'signaler:create', is_active: true }];
            pool.query.mockResolvedValue({ rows: mockRows });

            const result = await permissionsRepository.findByRole('CITOYEN');

            expect(result).toEqual(mockRows);
        });
    });

    describe('findActiveByRole', () => {
        it('devrait retourner uniquement les permissions actives', async () => {
            pool.query.mockResolvedValue({ rows: [{ permission: 'signaler:create' }] });

            const result = await permissionsRepository.findActiveByRole('AGENT');

            expect(result).toEqual(['signaler:create']);
        });
    });

    describe('findByRoleAndPermission', () => {
        it('devrait retourner une permission spécifique', async () => {
            const mockRow = { id: 1, role: 'CITOYEN', permission: 'signaler:create' };
            pool.query.mockResolvedValue({ rows: [mockRow] });

            const result = await permissionsRepository.findByRoleAndPermission('CITOYEN', 'signaler:create');

            expect(result).toEqual(mockRow);
        });
    });

    describe('create', () => {
        it('devrait créer une permission', async () => {
            const mockRow = { id: 1, role: 'CITOYEN', permission: 'signaler:create', is_active: true };
            pool.query.mockResolvedValue({ rows: [mockRow] });

            const result = await permissionsRepository.create('CITOYEN', 'signaler:create');

            expect(result).toEqual(mockRow);
        });
    });

    describe('updateStatus', () => {
        it('devrait mettre à jour le statut', async () => {
            const mockRow = { id: 1, is_active: false };
            pool.query.mockResolvedValue({ rows: [mockRow] });

            const result = await permissionsRepository.updateStatus('CITOYEN', 'signaler:create', false);

            expect(result.is_active).toBe(false);
        });
    });

    describe('delete', () => {
        it('devrait supprimer une permission', async () => {
            pool.query.mockResolvedValue({});

            await permissionsRepository.delete('CITOYEN', 'signaler:create');

            expect(pool.query).toHaveBeenCalled();
        });
    });

    describe('deleteAllByRole', () => {
        it('devrait supprimer toutes les permissions dun rôle', async () => {
            pool.query.mockResolvedValue({});

            await permissionsRepository.deleteAllByRole('GESTIONNAIRE');

            expect(pool.query).toHaveBeenCalled();
        });
    });

    describe('createMany', () => {
        it('devrait créer plusieurs permissions en transaction', async () => {
            const permissions = [
                { role: 'CITOYEN', permission: 'signaler:create' },
                { role: 'CITOYEN', permission: 'signaler:read' }
            ];

            const result = await permissionsRepository.createMany(permissions);

            expect(mockConnect.query).toHaveBeenCalledWith('BEGIN');
            expect(mockConnect.release).toHaveBeenCalled();
            expect(result).toBe(true);
        });
    });
});
