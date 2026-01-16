/**
 * Middleware de logging des requêtes
 */
const requestLogger = (req, res, next) => {
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

module.exports = requestLogger;
