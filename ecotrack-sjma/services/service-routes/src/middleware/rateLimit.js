const rateLimit = require('express-rate-limit');

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100;

const publicLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: {
    success: false,
    statusCode: 429,
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
    retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/metrics'
});

const tourneeLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 50,
  message: {
    success: false,
    statusCode: 429,
    message: 'Trop de requêtes sur les tournées.',
    retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip
});

const optimizeLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  message: {
    success: false,
    statusCode: 429,
    message: 'Trop de requêtes d\'optimisation. Limite: 10/min.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip
});

module.exports = {
  publicLimiter,
  tourneeLimiter,
  optimizeLimiter
};
