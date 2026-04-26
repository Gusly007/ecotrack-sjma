const pino = require('pino');
const config = require('../config/config');

const isProduction = config.NODE_ENV === 'production';

const logger = pino(
  {
    level: config.LOG_LEVEL || 'info',
    base: { service: 'service-routes' }
  },
  isProduction
    ? undefined
    : pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      })
);

module.exports = logger;
