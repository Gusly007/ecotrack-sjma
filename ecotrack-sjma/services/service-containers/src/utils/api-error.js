/**
 * Classe personnalisée pour les erreurs API
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
