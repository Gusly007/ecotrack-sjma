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
 * le bypass de développement ne s'applique PLUS aux routes MFA ni au
 * login. En NODE_ENV=development, la limite de 5 tentatives par 15 min était
 * désactivée : un code TOTP à 6 chiffres restait brute-forçable en local, où
 * l'admin a justement l'id 1. Ces routes passent maintenant par le limiteur
 * durci ci-dessous, actif quel que soit l'environnement.
 */
const MFA_PROTECTED_PATHS = [
  '/auth/login',
  '/auth/login/mfa',
  '/auth/mfa/complete-setup',
  '/auth/mfa/regenerate',
  '/auth/mfa/verify',
];

const isMfaProtectedPath = (req) => {
  const path = (req.path || req.url || '').split('?')[0];
  return MFA_PROTECTED_PATHS.some((p) => path === p || path.endsWith(p));
};

const shouldSkipMfaRateLimit = (req) => isMfaProtectedPath(req) ? false : shouldSkipRateLimit(req);

/**
 * Rate limiter pour les endpoints publics (100 req/min)
 */
export const publicLimiter = rateLimit({
  windowMs: env.rateLimit?.windowMs ?? 60 * 1000,
  max: env.rateLimit?.maxRequests ?? 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit
});

/**
 * Rate limiter strict pour login (5 tentatives/15 min)
 */
export const loginLimiter = rateLimit({
  windowMs: env.rateLimit?.loginWindowMs ?? 15 * 60 * 1000,
  max: env.rateLimit?.loginMaxAttempts ?? 5,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
  skip: shouldSkipMfaRateLimit
});

/**
 * Rate limiter pour password reset (3 tentatives/heure)
 */
export const passwordResetLimiter = rateLimit({
  windowMs: env.rateLimit?.passwordResetWindowMs ?? 60 * 60 * 1000,
  max: env.rateLimit?.passwordResetMaxAttempts ?? 3,
  message: 'Too many password reset attempts',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit
});
