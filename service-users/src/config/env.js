import dotenv from 'dotenv';
import path from 'path';

// Load .env robustly without using import.meta (keeps Jest happy)
dotenv.config(); // current working directory
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '..', '..', '.env')
];
for (const p of candidates) {
  try {
    dotenv.config({ path: p });
  } catch (_) {
    // ignore
  }
}

// Helpers to parse integers with fallback values in case of failure (e.g. env vars not set)
const toInteger = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
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
      return toInteger(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000);
    },
    get maxRequests() {
      return toInteger(process.env.RATE_LIMIT_REQUESTS, 100);
    },
    get loginWindowMs() {
      return 15 * 60 * 1000;
    },
    get loginMaxAttempts() {
      return 5;
    },
    get passwordResetWindowMs() {
      return 60 * 60 * 1000;
    },
    get passwordResetMaxAttempts() {
      return 3;
    }
  },
  jwt: {
    get secret() {
      return process.env.JWT_SECRET;
    },
    get expiresIn() {
      return process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRY || '24h';
    },
    get refreshSecret() {
      return process.env.JWT_REFRESH_SECRET;
    },
    get refreshExpiresIn() {
      return process.env.JWT_REFRESH_EXPIRES_IN || process.env.REFRESH_TOKEN_EXPIRY || '7d';
    }
  },
  security: {
    get bcryptRounds() {
      return toInteger(process.env.BCRYPT_ROUNDS, 10);
    }
  }
};

export default env;

export const validateEnv = () => {
  const missing = [];

  if (!env.jwt.secret) missing.push('JWT_SECRET');
  if (!env.jwt.refreshSecret) missing.push('JWT_REFRESH_SECRET');
  if (!env.databaseUrl) missing.push('DATABASE_URL');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
