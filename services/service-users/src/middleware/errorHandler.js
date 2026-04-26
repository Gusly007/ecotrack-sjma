import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err?.message,
    code: err?.code,
    stack: err?.stack,
    path: req.path,
    method: req.method
  }, 'Request error');
  
  if (err.status === 409) {
    return res.status(409).json({ error: 'Email already in use' });
  }
  
  if (err.status === 404) {
    return res.status(404).json({ error: err.message });
  }

  if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message || 'Requête invalide.' });
  }
  
  if (err.code === '23005' || err.code === '23505') {
    return res.status(409).json({ message: 'Conflit : Ressource déjà existante.' });
  }

  if (typeof err.message === 'string' && err.message.toLowerCase().includes('déjà existant')) {
    return res.status(409).json({ message: 'Conflit : Ressource déjà existante.' });
  }

  const message = typeof err?.message === 'string' ? err.message : '';
  const messageLower = message.toLowerCase();

   if (messageLower.includes('not found')) {
    return res.status(404).json({ message: err.message });
  }

    if (messageLower.includes('token')) {
    return res.status(400).json({ error: 'Token invalide ou expiré.' });
  }

    if (messageLower.includes('validation')) {
    return res.status(400).json({ error: 'Données invalides.' });
  }
  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  const verbose = process.env.VERBOSE_ERRORS === '1' && !isProd;
  if (verbose) {
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      debug: {
        code: err?.code || null,
        error: err?.message || null
      }
    });
  }

  res.status(500).json({ message: 'Erreur interne du serveur.' });
};


 export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
