import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  
  logger.error({
    message: err?.message,
    code: err?.code,
    stack: isProd ? undefined : err?.stack,
    path: req.path,
    method: req.method
  }, 'Request error');

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Conflit : Ressource déjà existante.' });
  }
  
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Référence invalide : ressource liée non trouvée.' });
  }
  
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Validation échouée : contrainte non respectée.' });
  }

  if (err.status === 404 || err.message?.toLowerCase().includes('not found')) {
    return res.status(404).json({ error: err.message || 'Ressource non trouvée.' });
  }

  if (err.status === 403 || err.message?.toLowerCase().includes('access denied')) {
    return res.status(403).json({ error: 'Accès refusé.' });
  }

  if (err.status === 401 || err.message?.toLowerCase().includes('token') || err.message?.toLowerCase().includes('unauthorized')) {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }

  if (err.status === 400 || err.message?.toLowerCase().includes('validation')) {
    return res.status(400).json({ error: 'Données invalides.', details: err.details });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation échouée.', details: err.details });
  }

  if (err.status === 429) {
    return res.status(429).json({ error: 'Trop de requêtes. Veuillez réessayer plus tard.' });
  }

  if (!isProd && process.env.VERBOSE_ERRORS === '1') {
    return res.status(500).json({
      error: 'Erreur interne du serveur.',
      debug: {
        code: err?.code || null,
        error: err?.message || null
      }
    });
  }

  res.status(500).json({ error: 'Erreur interne du serveur.' });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export class AppError extends Error {
  constructor(message, status = 500, code = null, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}
