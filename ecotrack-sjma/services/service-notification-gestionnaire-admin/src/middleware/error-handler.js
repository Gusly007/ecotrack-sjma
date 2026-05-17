'use strict';

const ApiError = require('../utils/api-error');
const ApiResponse = require('../utils/api-response');
const logger = require('../utils/logger');

const nodeEnv = process.env.NODE_ENV;
const hasJest = typeof globalThis !== 'undefined' && !!globalThis.jest;
const isTest =
  nodeEnv === 'test' ||
  nodeEnv === undefined ||
  process.env.JEST_WORKER_ID !== undefined ||
  hasJest;

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const meta = {
    message: err.message,
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    stack: err.stack
  };

  if (isTest) {
    console.error('Error:', meta);
  } else {
    logger.error(meta, 'Request error');
  }

  // ── Erreur métier explicite ──────────────────────────────────
  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json(ApiResponse.error(err.statusCode, err.message, err.details));
  }

  // ── Contrainte unique PostgreSQL ─────────────────────────────
  if (err.code === '23505') {
    return res
      .status(409)
      .json(ApiResponse.error(409, 'Violation de contrainte unique', err.detail));
  }

  // ── Clé étrangère PostgreSQL ─────────────────────────────────
  if (err.code === '23503') {
    return res
      .status(409)
      .json(
        ApiResponse.error(409, 'Violation de contrainte de clé étrangère', err.detail)
      );
  }

  // ── Erreur CORS ──────────────────────────────────────────────
  if (err.message && err.message.startsWith('Origine non autorisée')) {
    return res.status(403).json(ApiResponse.error(403, err.message));
  }

  // ── Fallback ─────────────────────────────────────────────────
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? 'Erreur serveur interne' : err.message || 'Erreur inconnue';

  return res.status(statusCode).json(ApiResponse.error(statusCode, message));
};

module.exports = errorHandler;
