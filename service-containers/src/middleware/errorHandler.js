/**
 * Middleware de gestion centralisée des erreurs
 */
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

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
