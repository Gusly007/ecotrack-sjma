import winston from 'winston';
import morgan from 'morgan';

/**
 * Configuration du logging pour l'API Gateway
 * Logs structurés en JSON pour centralisation
 */

// Configuration Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'api-gateway',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Logs console en développement
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : winston.format.json()
    })
  ]
});

// Ajouter fichier de logs en production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log' 
  }));
}

/**
 * Middleware Morgan personnalisé pour logger les requêtes HTTP
 */
const morganFormat = ':method :url :status :response-time ms - :res[content-length] - :remote-addr';

export const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message) => {
      logger.info('HTTP Request', {
        type: 'access',
        message: message.trim()
      });
    }
  }
});

/**
 * Middleware de logging détaillé des requêtes
 */
export const detailedRequestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log au début de la requête
  logger.info('Request started', {
    type: 'request_start',
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || 'anonymous'
  });

  // Intercepter la fin de la réponse
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const logData = {
      type: 'request_complete',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: duration,
      userId: req.user?.id || 'anonymous',
      contentLength: res.get('content-length')
    };

    // Log différent selon le statut
    if (res.statusCode >= 500) {
      logger.error('Server error response', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client error response', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

/**
 * Logger des erreurs
 */
export const errorLogger = (err, req, res, next) => {
  logger.error('Error occurred', {
    type: 'error',
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id || 'anonymous',
    ip: req.ip || req.connection.remoteAddress
  });
  
  next(err);
};

/**
 * Logger de sécurité (tentatives d'accès non autorisé, etc.)
 */
export const securityLogger = (event, details) => {
  logger.warn('Security event', {
    type: 'security',
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

export { logger };
export default logger;
