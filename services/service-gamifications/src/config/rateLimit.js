import rateLimit from 'express-rate-limit';

// Limite stricte pour les endpoints publics (classement, notifications)
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requêtes par minute par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.'
  }
});
