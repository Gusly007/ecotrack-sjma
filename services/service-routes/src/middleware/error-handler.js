const ApiResponse = require('../utils/api-response');
const ApiError = require('../utils/api-error');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack,
    path: req.path,
    method: req.method
  }, 'Request error');

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(
      ApiResponse.error(err.statusCode, err.message, err.details)
    );
  }

  // Violation de contrainte unique
  if (err.code === '23505') {
    return res.status(409).json(
      ApiResponse.error(409, 'Violation de contrainte unique', err.detail)
    );
  }

  // Violation de clé étrangère
  if (err.code === '23503') {
    return res.status(409).json(
      ApiResponse.error(409, 'Violation de contrainte de clé étrangère', err.detail)
    );
  }

  // Violation de contrainte CHECK
  if (err.code === '23514') {
    return res.status(400).json(
      ApiResponse.error(400, 'Violation de contrainte de validation', err.detail)
    );
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur serveur interne';

  return res.status(statusCode).json(
    ApiResponse.error(statusCode, message)
  );
};

module.exports = errorHandler;
