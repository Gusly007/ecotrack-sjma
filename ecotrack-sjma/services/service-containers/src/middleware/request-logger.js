const morgan = require('morgan');
const logger = require('../utils/logger');

const nodeEnv = process.env.NODE_ENV;
const hasJest = typeof globalThis !== 'undefined' && !!globalThis.jest;
const isTest = nodeEnv === 'test' || nodeEnv === undefined || process.env.JEST_WORKER_ID !== undefined || hasJest;

let requestLogger;

if (isTest) {
  requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 400 ? '⚠️ ' : '✅';

      console.log(
        `${logLevel} ${req.method} ${req.path} - ${res.statusCode} [${duration}ms]`
      );
    });

    next();
  };
} else {
  requestLogger = morgan('combined', {
    stream: {
      write: (message) => {
        logger.info({ type: 'access', message: message.trim() }, 'HTTP request');
      }
    }
  });
}

module.exports = requestLogger;
