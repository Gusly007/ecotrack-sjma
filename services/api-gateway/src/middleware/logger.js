import morgan from 'morgan';
import pino from 'pino';

const nodeEnv = process.env.NODE_ENV;
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test' || nodeEnv === undefined || process.env.JEST_WORKER_ID !== undefined;

const logger = isTest
  ? console
  : pino(
      {
        level: process.env.LOG_LEVEL || 'info',
        base: {
          service: 'api-gateway',
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

const morganFormat = ':method :url :status :response-time ms - :res[content-length] - :remote-addr';

export const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message) => {
      logger.info({ type: 'access', message: message.trim() }, 'HTTP request');
    }
  }
});

export const detailedRequestLogger = (req, res, next) => {
  const start = Date.now();

  logger.info({
    type: 'request_start',
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || 'anonymous'
  }, 'Request started');

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      type: 'request_complete',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id || 'anonymous',
      contentLength: res.get('content-length')
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Server error response');
      return;
    }
    if (res.statusCode >= 400) {
      logger.warn(logData, 'Client error response');
      return;
    }
    logger.info(logData, 'Request completed');
  });

  next();
};

export const errorLogger = (err, req, res, next) => {
  logger.error({
    type: 'error',
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id || 'anonymous',
    ip: req.ip || req.connection.remoteAddress
  }, 'Error occurred');

  next(err);
};

export const securityLogger = (event, details) => {
  logger.warn({
    type: 'security',
    event,
    ...details,
    timestamp: new Date().toISOString()
  }, 'Security event');
};

export { logger };
export default logger;
