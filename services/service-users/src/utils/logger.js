import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      service: 'service-users',
      environment: process.env.NODE_ENV || 'development'
    }
  },
  isProduction || isTest
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

export default logger;
export { logger };
