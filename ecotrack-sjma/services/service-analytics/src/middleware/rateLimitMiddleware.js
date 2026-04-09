const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Limiter général pour toutes les APIs
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requêtes par IP (augmenté)
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later'
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter strict pour les rapports (coûteux)
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 50, // 50 rapports par heure (augmenté)
  message: {
    success: false,
    error: 'Report generation limit reached, please try again in an hour'
  }
});

// Limiter ML (calculs intensifs)
const mlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500 // Augmenté
});

module.exports = {
  generalLimiter,
  reportLimiter,
  mlLimiter
};