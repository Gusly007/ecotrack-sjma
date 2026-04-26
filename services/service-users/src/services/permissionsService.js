import { permissionsRepository } from '../repositories/permissionsRepository.js';
import { rolePermissions } from '../utils/permissions.js';

export const permissionsService = {
    async getAllPermissions() {
        const rows = await permissionsRepository.findAll();
        
        const permissions = {};
        for (const row of rows) {
            if (!permissions[row.role]) {
                permissions[row.role] = [];
            }
            if (row.is_active) {
                permissions[row.role].push(row.permission);
            }
        }
        return permissions;
    },

    async getRolePermissions(role) {
        return await permissionsRepository.findActiveByRole(role);
    },

    async updateRolePermissions(role, permissions) {
        const client = await permissionsRepository.deleteAllByRole(role);
        
        for (const perm of permissions) {
            await permissionsRepository.create(role, perm);
        }
        
        return { success: true };
    },

    async addPermission(role, permission) {
        const existing = await permissionsRepository.findByRoleAndPermission(role, permission);
        
        if (existing) {
            return await permissionsRepository.updateStatus(role, permission, true);
        }
        
        return await permissionsRepository.create(role, permission);
    },

    async removePermission(role, permission) {
        return await permissionsRepository.updateStatus(role, permission, false);
    },

    async initializeDefaultPermissions() {
        const permissionsToCreate = [];
        
        for (const [role, perms] of Object.entries(rolePermissions)) {
            for (const perm of perms) {
                permissionsToCreate.push({ role, permission: perm });
            }
        }
        
        await permissionsRepository.createMany(permissionsToCreate);
    },

    async getPermissionsMatrix() {
        const dbPermissions = await this.getAllPermissions();
        
        const matrix = {};
        for (const role of ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN']) {
            matrix[role] = dbPermissions[role] || rolePermissions[role] || [];
        }
        
        return matrix;
    }
};
