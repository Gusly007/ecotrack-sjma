import pool from '../config/database.js';

const parseValue = (valeur, type) => {
    switch (type) {
        case 'number':
            return parseFloat(valeur);
        case 'boolean':
            return valeur === 'true';
        default:
            return valeur;
    }
};

export const EnvironmentalConstantsRepository = {
    async getAll() {
        const result = await pool.query(
            'SELECT * FROM environmental_constants WHERE est_actif = true ORDER BY cle'
        );
        return result.rows;
    },

    async getByKey(cle) {
        const result = await pool.query(
            'SELECT * FROM environmental_constants WHERE cle = $1 AND est_actif = true',
            [cle]
        );
        return result.rows[0] || null;
    },

    async getMultiple(keys) {
        if (!keys || keys.length === 0) return {};
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const result = await pool.query(
            `SELECT cle, valeur, type FROM environmental_constants WHERE cle IN (${placeholders}) AND est_actif = true`,
            keys
        );
        const constants = {};
        result.rows.forEach(row => {
            constants[row.cle] = parseValue(row.valeur, row.type);
        });
        return constants;
    },

    async getAllAsMap() {
        const rows = await this.getAll();
        const constants = {};
        rows.forEach(row => {
            constants[row.cle] = parseValue(row.valeur, row.type);
        });
        return constants;
    },

    async update(cle, valeur) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const result = await client.query(
                `UPDATE environmental_constants 
                 SET valeur = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE cle = $2 AND est_modifiable = true AND est_actif = true
                 RETURNING *`,
                [String(valeur), cle]
            );
            
            await client.query('COMMIT');
            return result.rows[0] || null;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
};

export default EnvironmentalConstantsRepository;
