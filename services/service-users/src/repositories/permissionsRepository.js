import pool from '../config/database.js';

export const permissionsRepository = {
    async findAll() {
        const result = await pool.query(`
            SELECT role, permission, is_active, created_at, updated_at
            FROM permissions_config
            ORDER BY role, permission
        `);
        return result.rows;
    },

    async findByRole(role) {
        const result = await pool.query(`
            SELECT permission, is_active
            FROM permissions_config
            WHERE role = $1
            ORDER BY permission
        `, [role]);
        return result.rows;
    },

    async findActiveByRole(role) {
        const result = await pool.query(`
            SELECT permission
            FROM permissions_config
            WHERE role = $1 AND is_active = true
        `, [role]);
        return result.rows.map(r => r.permission);
    },

    async findByRoleAndPermission(role, permission) {
        const result = await pool.query(`
            SELECT id, role, permission, is_active
            FROM permissions_config
            WHERE role = $1 AND permission = $2
        `, [role, permission]);
        return result.rows[0];
    },

    async create(role, permission) {
        const result = await pool.query(`
            INSERT INTO permissions_config (role, permission, is_active)
            VALUES ($1, $2, true)
            ON CONFLICT (role, permission) DO UPDATE SET is_active = true, updated_at = NOW()
            RETURNING id, role, permission, is_active
        `, [role, permission]);
        return result.rows[0];
    },

    async updateStatus(role, permission, isActive) {
        const result = await pool.query(`
            UPDATE permissions_config
            SET is_active = $1, updated_at = NOW()
            WHERE role = $2 AND permission = $3
            RETURNING id, role, permission, is_active
        `, [isActive, role, permission]);
        return result.rows[0];
    },

    async delete(role, permission) {
        await pool.query(`
            DELETE FROM permissions_config
            WHERE role = $1 AND permission = $2
        `, [role, permission]);
    },

    async deleteAllByRole(role) {
        await pool.query(`
            DELETE FROM permissions_config
            WHERE role = $1
        `, [role]);
    },

    async createMany(permissions) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            for (const { role, permission } of permissions) {
                await client.query(`
                    INSERT INTO permissions_config (role, permission, is_active)
                    VALUES ($1, $2, true)
                    ON CONFLICT (role, permission) DO NOTHING
                `, [role, permission]);
            }
            
            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};
