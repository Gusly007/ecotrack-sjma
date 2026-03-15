const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Limiter général pour toutes les APIs
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
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
  }
});

// Limiter strict pour les rapports (coûteux)
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 rapports par heure
  message: {
    success: false,
    error: 'Report generation limit reached, please try again in an hour'
  }
});

// Limiter ML (calculs intensifs)
const mlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50
});

module.exports = {
  generalLimiter,
  reportLimiter,
  mlLimiter
};