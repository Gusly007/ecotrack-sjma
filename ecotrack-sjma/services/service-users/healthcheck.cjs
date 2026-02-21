const http = require('http');
const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';
const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'service-users-healthcheck' }
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
  hostname: 'localhost',
  port: 3010,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else if (res.statusCode === 503) {
    logger.error('Health check failed: Service Unavailable (503)');
    process.exit(1);
  } else {
    logger.error({ statusCode: res.statusCode }, 'Health check failed');
    process.exit(1);
  }
});

req.on('error', (err) => {
  logger.error({ error: err.message }, 'Health check error');
  process.exit(1);
});

req.on('timeout', () => {
  logger.error('Health check timeout');
  req.destroy();
  process.exit(1);
});

req.end();
