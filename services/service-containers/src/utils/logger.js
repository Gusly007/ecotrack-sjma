const pino = require('pino');

const nodeEnv = process.env.NODE_ENV;
const hasJest = typeof globalThis !== 'undefined' && !!globalThis.jest;
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test' || nodeEnv === undefined || process.env.JEST_WORKER_ID !== undefined || hasJest;

if (isTest) {
  module.exports = console;
  module.exports.logger = console;
} else {
  const logger = pino(
    {
      level: process.env.LOG_LEVEL || 'info',
      base: {
        service: 'service-containers',
        environment: process.env.NODE_ENV || 'development'
      }
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
  module.exports.logger = logger;
}
