/**
 * @param {import('pg').Client} pgm
 */
exports.up = (pgm) => {
    pgm.createTable('permissions_config', {
        id: { type: 'SERIAL', primaryKey: true },
        role: { type: 'VARCHAR(20)', notNull: true },
        permission: { type: 'VARCHAR(50)', notNull: true },
        is_active: { type: 'BOOLEAN', default: true },
        created_at: { type: 'TIMESTAMP', default: 'NOW()' },
        updated_at: { type: 'TIMESTAMP', default: 'NOW()' }
    }, {
        constraints: {
            unique: ['role', 'permission']
        }
    });

    pgm.createIndex('permissions_config', 'role');
    pgm.createIndex('permissions_config', ['role', 'is_active']);
};

/**
 * @param {import('pg').Client} pgm
 */
exports.down = (pgm) => {
    pgm.dropTable('permissions_config');
};
