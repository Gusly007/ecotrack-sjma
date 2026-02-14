// ============================================================================
// HEALTHCHECK - SERVICE CONTAINERS
// ============================================================================
// Script de healthcheck pour Docker
// Vérifie que le service répond correctement
// ============================================================================

const http = require('http');
const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';
const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'service-containers-healthcheck' }
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

const options = {
  host: 'localhost',
  port: process.env.APP_PORT || 3011,
  path: '/health',
  timeout: 2000
};

const healthCheck = http.request(options, (res) => {
  logger.info({ statusCode: res.statusCode }, 'Health check response');
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

healthCheck.on('error', (err) => {
  logger.error({ error: err.message }, 'Health check error');
  process.exit(1);
});

healthCheck.end();
