'use strict';

const rateLimit = require('express-rate-limit');

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const MAX       = parseInt(process.env.RATE_LIMIT_MAX)        || 100;

const skipSystemEndpoints = (req) =>
  req.path === '/health' || req.path === '/metrics';

const keyByUser = (req) => req.user?.id?.toString() || req.ip;

const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX,
  message: {
    success: false,
    statusCode: 429,
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
    retryAfter: Math.ceil(WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByUser,
  skip: skipSystemEndpoints
});

// Used on write operations (POST / PUT / PATCH / DELETE)
const writeLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 30,
  message: {
    success: false,
    statusCode: 429,
    message: "Trop d'opérations d'écriture. Limite : 30/min.",
    retryAfter: Math.ceil(WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByUser
});

module.exports = { generalLimiter, writeLimiter };
