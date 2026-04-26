import rateLimit from 'express-rate-limit';
import env from './env.js';

const localhostIps = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const isLocalDevBypassEnabled = () => {
  if (process.env.RATE_LIMIT_BYPASS_LOCAL === 'true') return true;
  if (process.env.RATE_LIMIT_BYPASS_LOCAL === 'false') return false;
  return env.nodeEnv === 'development';
};

const hasLocalhostHostHeader = (req) => {
  const host = (req.headers?.host || '').toLowerCase();
  const forwardedHost = (req.headers?.['x-forwarded-host'] || '').toLowerCase();
  return host.includes('localhost') || host.includes('127.0.0.1') || forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1');
};

const shouldSkipRateLimit = (req) => {
  if (!isLocalDevBypassEnabled()) return false;
  if (env.nodeEnv === 'development') return true;
  return localhostIps.has(req.ip) || hasLocalhostHostHeader(req);
};

/**
 * Rate limiter pour les endpoints publics (100 req/min)
 */
export const publicLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit
});

/**
 * Rate limiter strict pour login (5 tentatives/15 min)
 */
export const loginLimiter = rateLimit({
  windowMs: env.rateLimit.loginWindowMs,
  max: env.rateLimit.loginMaxAttempts,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
  skip: shouldSkipRateLimit
});

/**
 * Rate limiter pour password reset (3 tentatives/heure)
 */
export const passwordResetLimiter = rateLimit({
  windowMs: env.rateLimit.passwordResetWindowMs,
  max: env.rateLimit.passwordResetMaxAttempts,
  message: 'Too many password reset attempts',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit
});
