import rateLimit from 'express-rate-limit';
import env from './env.js';

/**
 * Rate limiter pour les endpoints publics (100 req/min)
 */
export const publicLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter strict pour login (5 tentatives/15 min)
 */
export const loginLimiter = rateLimit({
  windowMs: env.rateLimit.loginWindowMs,
  max: env.rateLimit.loginMaxAttempts,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true
});

/**
 * Rate limiter pour password reset (3 tentatives/heure)
 */
export const passwordResetLimiter = rateLimit({
  windowMs: env.rateLimit.passwordResetWindowMs,
  max: env.rateLimit.passwordResetMaxAttempts,
  message: 'Too many password reset attempts'
});
