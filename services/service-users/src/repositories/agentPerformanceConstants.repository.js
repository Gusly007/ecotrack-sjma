import pool from '../config/database.js';

let constantsCache = new Map();
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000;

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

export const AgentPerformanceConstantsRepository = {
    async getAll() {
        const result = await pool.query(
            'SELECT * FROM agent_performance_constants WHERE est_actif = true ORDER BY cle'
        );
        return result.rows;
    },

    async getByKey(cle) {
        const result = await pool.query(
            'SELECT * FROM agent_performance_constants WHERE cle = $1 AND est_actif = true',
            [cle]
        );
        return result.rows[0] || null;
    },

    async getMultiple(keys) {
        if (!keys || keys.length === 0) return {};
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const result = await pool.query(
            `SELECT cle, valeur, type FROM agent_performance_constants WHERE cle IN (${placeholders}) AND est_actif = true`,
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
        const result = await pool.query(
            `UPDATE agent_performance_constants 
             SET valeur = $1, updated_at = CURRENT_TIMESTAMP
             WHERE cle = $2 AND est_modifiable = true AND est_actif = true
             RETURNING *`,
            [String(valeur), cle]
        );
        return result.rows[0] || null;
    }
};

export const loadAgentPerformanceConstants = async () => {
    const now = Date.now();
    if (constantsCache.size > 0 && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return constantsCache;
    }
    try {
        const constants = await AgentPerformanceConstantsRepository.getAllAsMap();
        constantsCache = new Map(Object.entries(constants));
        cacheTimestamp = now;
        return constantsCache;
    } catch (err) {
        console.error('Failed to load agent performance constants:', err);
        return new Map();
    }
};

export const getAgentPerformanceConstant = async (key) => {
    const cache = await loadAgentPerformanceConstants();
    if (cache.has(key)) {
        return cache.get(key);
    }
    const row = await AgentPerformanceConstantsRepository.getByKey(key);
    if (row) {
        const value = parseValue(row.valeur, row.type);
        cache.set(key, value);
        return value;
    }
    return null;
};

export const invalidateAgentPerformanceConstantsCache = () => {
    constantsCache = new Map();
    cacheTimestamp = 0;
};

export default AgentPerformanceConstantsRepository;
