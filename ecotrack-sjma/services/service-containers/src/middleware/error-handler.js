/**
 * Middleware de gestion centralisée des erreurs
 */
const ApiResponse = require('../utils/api-response');
const ApiError = require('../utils/api-error');
const logger = require('../utils/logger');
const nodeEnv = process.env.NODE_ENV;
const hasJest = typeof globalThis !== 'undefined' && !!globalThis.jest;
const isTest = nodeEnv === 'test' || nodeEnv === undefined || process.env.JEST_WORKER_ID !== undefined || hasJest;

const errorHandler = (err, req, res, next) => {
  if (isTest) {
    console.error(' Error:', {
      message: err.message,
      statusCode: err.statusCode || 500,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  } else {
    logger.error({
      message: err.message,
      statusCode: err.statusCode || 500,
      stack: err.stack,
      path: req.path,
      method: req.method
    }, 'Request error');
  }

  // Erreur personnalisée
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(
      ApiResponse.error(err.statusCode, err.message, err.details)
    );
  }

  // Erreur de validation de base de données
  if (err.code === '23505') {
    return res.status(409).json(
      ApiResponse.error(409, 'Violation de contrainte unique', err.detail)
    );
  }

  if (err.code === '23503') {
    return res.status(409).json(
      ApiResponse.error(409, 'Violation de contrainte de clé étrangère', err.detail)
    );
  }

  // Erreur par défaut
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur serveur interne';

  return res.status(statusCode).json(
    ApiResponse.error(statusCode, message)
  );
};

module.exports = errorHandler;
