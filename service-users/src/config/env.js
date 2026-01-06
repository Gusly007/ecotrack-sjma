import dotenv from 'dotenv';

dotenv.config();

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
      return process.env.JWT_EXPIRES_IN || '24h';
    },
    get refreshSecret() {
      return process.env.JWT_REFRESH_SECRET;
    },
    get refreshExpiresIn() {
      return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    }
  },
  security: {
    get bcryptRounds() {
      return toInteger(process.env.BCRYPT_ROUNDS, 10);
    }
  }
};

export default env;
