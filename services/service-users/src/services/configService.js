import { ConfigurationRepository } from '../repositories/configuration.repository.js';

let configCache = new Map();
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000;

const parseValue = (valeur, type) => {
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
};

const getFromDb = async (key) => {
    const row = await ConfigurationRepository.getByKey(key);
    if (row) {
        return parseValue(row.valeur, row.type);
    }
    return null;
};

export const ConfigService = {
    async get(key, useCache = true) {
        const now = Date.now();
        if (useCache && configCache.has(key) && (now - cacheTimestamp) < CACHE_TTL_MS) {
            return configCache.get(key);
        }
        const value = await getFromDb(key);
        if (value !== null) {
            configCache.set(key, value);
            cacheTimestamp = now;
        }
        return value;
    },

    async getMultiple(keys) {
        return ConfigurationRepository.getMultiple(keys);
    },

    async getByCategory(categorie) {
        const rows = await ConfigurationRepository.getByCategory(categorie);
        const config = {};
        rows.forEach(row => {
            config[row.cle] = parseValue(row.valeur, row.type);
        });
        return config;
    },

    async set(key, value, description = null) {
        const row = await ConfigurationRepository.update(key, { valeur: String(value), description });
        if (row) {
            configCache.delete(key);
            cacheTimestamp = 0;
        }
        return row;
    },

    async getAll() {
        const rows = await ConfigurationRepository.getAll();
        const config = {};
        rows.forEach(row => {
            config[row.cle] = {
                value: parseValue(row.valeur, row.type),
                type: row.type,
                description: row.description,
                categorie: row.categorie,
                modifiable: row.est_modifiable,
                updatedAt: row.updated_at
            };
        });
        return config;
    },

    async invalidateCache() {
        configCache.clear();
        cacheTimestamp = 0;
    },

    async getJwtConfig() {
        return {
            accessTokenExpiration: await this.get('jwt.access_token_expiration') || '24h',
            refreshTokenExpiration: await this.get('jwt.refresh_token_expiration') || '168h'
        };
    },

    async getSecurityConfig() {
        return {
            bcryptRounds: await this.get('security.bcrypt_rounds') || 10,
            maxLoginAttempts: await this.get('security.max_login_attempts') || 5,
            lockoutDurationMinutes: await this.get('security.lockout_duration_minutes') || 15
        };
    },

    async getSessionConfig() {
        return {
            maxConcurrentSessions: await this.get('session.max_concurrent_sessions') || 3,
            tokenExpirationHours: await this.get('session.token_expiration_hours') || 168
        };
    },

    async getRateLimitConfig() {
        return {
            windowMs: await this.get('rate_limit.window_ms') || 60000,
            maxRequests: await this.get('rate_limit.max_requests') || 100,
            authWindowMs: await this.get('rate_limit.auth_window_ms') || 900000,
            authMaxAttempts: await this.get('rate_limit.auth_max_attempts') || 5
        };
    },

    async getUploadConfig() {
        return {
            maxFileSizeMb: await this.get('upload.max_file_size_mb') || 5,
            allowedExtensions: await this.get('upload.allowed_extensions') || ['jpg', 'jpeg', 'png', 'webp'],
            maxFilesPerRequest: await this.get('upload.max_files_per_request') || 5
        };
    }
};

export default ConfigService;
