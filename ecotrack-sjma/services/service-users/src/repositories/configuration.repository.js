import pool from '../config/database.js';

export const ConfigurationRepository = {
    async getAll() {
        const result = await pool.query(
            'SELECT * FROM configurations WHERE est_actif = true ORDER BY categorie, cle'
        );
        return result.rows;
    },

    async getByKey(cle) {
        const result = await pool.query(
            'SELECT * FROM configurations WHERE cle = $1 AND est_actif = true',
            [cle]
        );
        return result.rows[0] || null;
    },

    async getByCategory(categorie) {
        const result = await pool.query(
            'SELECT * FROM configurations WHERE categorie = $1 AND est_actif = true ORDER BY cle',
            [categorie]
        );
        return result.rows;
    },

    async getMultiple(keys) {
        if (!keys || keys.length === 0) return {};
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const result = await pool.query(
            `SELECT cle, valeur, type FROM configurations WHERE cle IN (${placeholders}) AND est_actif = true`,
            keys
        );
        const config = {};
        result.rows.forEach(row => {
            config[row.cle] = ConfigurationRepository.parseValue(row.valeur, row.type);
        });
        return config;
    },

    parseValue(valeur, type) {
        switch (type) {
            case 'number':
                return parseFloat(valeur);
            case 'boolean':
                return valeur === 'true';
            case 'json':
                try {
                    return JSON.parse(valeur);
                } catch {
                    return valeur;
                }
            default:
                return valeur;
        }
    },

    async update(cle, { valeur, description }) {
        const result = await pool.query(
            `UPDATE configurations 
             SET valeur = COALESCE($1, valeur),
                 description = COALESCE($2, description),
                 updated_at = CURRENT_TIMESTAMP
             WHERE cle = $3 AND est_modifiable = true AND est_actif = true
             RETURNING *`,
            [valeur, description, cle]
        );
        return result.rows[0] || null;
    },

    async create({ cle, valeur, type, description, categorie }) {
        const result = await pool.query(
            `INSERT INTO configurations (cle, valeur, type, description, categorie)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (cle) DO UPDATE SET
                valeur = EXCLUDED.valeur,
                type = EXCLUDED.type,
                description = EXCLUDED.description,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [cle, String(valeur), type || 'string', description, categorie || 'general']
        );
        return result.rows[0];
    },

    async deactivate(cle) {
        const result = await pool.query(
            'UPDATE configurations SET est_actif = false WHERE cle = $1 RETURNING *',
            [cle]
        );
        return result.rows[0] || null;
    },

    async getHistory(cle, limit = 50) {
        const result = await pool.query(
            `SELECT * FROM configurations 
             WHERE cle = $1 
             ORDER BY updated_at DESC 
             LIMIT $2`,
            [cle, limit]
        );
        return result.rows;
    }
};
