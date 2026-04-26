import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '..', '..', '.env')
];
for (const p of candidates) {
  try {
    dotenv.config({ path: p });
  } catch (_) {}
}

const toInteger = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toMinutesMs = (value, fallbackMinutes) => {
  const parsed = parseInt(value, 10);
  const minutes = Number.isNaN(parsed) ? fallbackMinutes : parsed;
  return minutes * 60 * 1000;
};

let dbConfigCache = null;
let dbConfigPromise = null;

const loadDbConfig = async () => {
  if (dbConfigCache) return dbConfigCache;
  if (dbConfigPromise) return dbConfigPromise;

  dbConfigPromise = (async () => {
    try {
      const { default: pool } = await import('../repositories/configuration.repository.js');
      const { ConfigurationRepository } = await import('../repositories/configuration.repository.js');
      const rows = await ConfigurationRepository.getAll();
      const config = {};
      rows.forEach(row => {
        switch (row.type) {
          case 'number':
            config[row.cle] = parseFloat(row.valeur);
            break;
          case 'boolean':
            config[row.cle] = row.valeur === 'true';
            break;
          case 'json':
            try {
              config[row.cle] = JSON.parse(row.valeur);
            } catch {
              config[row.cle] = row.valeur;
            }
            break;
          default:
            config[row.cle] = row.valeur;
        }
      });
      dbConfigCache = config;
      return config;
    } catch (_) {
      return {};
    }
  })();

  return dbConfigPromise;
};

const getDbConfig = (key, fallback) => {
  if (dbConfigCache && dbConfigCache[key] !== undefined) {
    return dbConfigCache[key];
  }
  return fallback;
};

const env = {
  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  },
  get port() {
    return toInteger(process.env.PORT, 3010);
  },
  get databaseUrl() {
    return process.env.DATABASE_URL;
  },
  rateLimit: {
    get windowMs() {
      return getDbConfig('rate_limit.window_ms', toInteger(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000));
    },
    get maxRequests() {
      return getDbConfig('rate_limit.max_requests', toInteger(process.env.RATE_LIMIT_REQUESTS, 100));
    },
    get loginWindowMs() {
      return getDbConfig('rate_limit.auth_window_ms', 15 * 60 * 1000);
    },
    get loginMaxAttempts() {
      return getDbConfig('rate_limit.auth_max_attempts', 5);
    },
    get passwordResetWindowMs() {
      const dbMinutes = getDbConfig('security.lockout_duration_minutes', undefined);
      if (dbMinutes !== undefined) {
        return toMinutesMs(dbMinutes, 60);
      }
      return toMinutesMs(process.env.RATE_LIMIT_PASSWORD_RESET_MINUTES, 60);
    },
    get passwordResetMaxAttempts() {
      return getDbConfig('security.max_login_attempts', 3);
    }
  },
  jwt: {
    get secret() {
      return process.env.JWT_SECRET;
    },
    get expiresIn() {
      return getDbConfig('jwt.access_token_expiration', process.env.JWT_EXPIRES_IN || '24h');
    },
    get refreshSecret() {
      return process.env.JWT_REFRESH_SECRET;
    },
    get refreshExpiresIn() {
      return getDbConfig('jwt.refresh_token_expiration', process.env.JWT_REFRESH_EXPIRES_IN || '168h');
    }
  },
  security: {
    get bcryptRounds() {
      return getDbConfig('security.bcrypt_rounds', toInteger(process.env.BCRYPT_ROUNDS, 10));
    }
  },
  session: {
    get maxConcurrentSessions() {
      return getDbConfig('session.max_concurrent_sessions', 3);
    },
    get tokenExpirationHours() {
      return getDbConfig('session.token_expiration_hours', 168);
    }
  },
  upload: {
    get maxFileSizeMb() {
      return getDbConfig('upload.max_file_size_mb', 5);
    },
    get maxFileSizeBytes() {
      return getDbConfig('upload.max_file_size_mb', 5) * 1024 * 1024;
    },
    get allowedExtensions() {
      return getDbConfig('upload.allowed_extensions', ['jpg', 'jpeg', 'png', 'webp']);
    },
    get maxFilesPerRequest() {
      return getDbConfig('upload.max_files_per_request', 5);
    }
  },
  smtp: {
    get host() {
      return process.env.SMTP_HOST || null;
    },
    get port() {
      return toInteger(process.env.SMTP_PORT, 587);
    },
    get secure() {
      return process.env.SMTP_SECURE === 'true';
    },
    get user() {
      return process.env.SMTP_USER || null;
    },
    get pass() {
      return process.env.SMTP_PASS || null;
    },
    get from() {
      return process.env.SMTP_FROM || '"EcoTrack" <noreply@ecotrack.fr>';
    }
  },
  get appUrl() {
    return process.env.APP_URL || 'http://localhost:5173';
  },
  async refreshDbConfig() {
    dbConfigCache = null;
    dbConfigPromise = null;
    await loadDbConfig();
    return dbConfigCache;
  }
};

export default env;
export { loadDbConfig };

export const validateEnv = () => {
  const missing = [];

  if (!env.jwt.secret) missing.push('JWT_SECRET');
  if (!env.jwt.refreshSecret) missing.push('JWT_REFRESH_SECRET');
  if (!env.databaseUrl) missing.push('DATABASE_URL');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
