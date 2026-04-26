const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const http = require('http');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const logger = require('./src/utils/logger');
const client = require('prom-client');
const cacheService = require('./src/services/cacheService');
const centralizedLogging = require('./src/services/centralizedLogging');
const kafkaProducer = require('./kafkaProducer');
const errorHandler = require('./src/middleware/error-handler');
const requestLogger = require('./src/middleware/request-logger');
const config = require('./src/config/config');
const di = require('./src/container-di');
const iotRoutes = require('./src/routes/iot.route');

const isIntegrationSmoke = process.env.INTEGRATION_SMOKE === 'true';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const app = express();
const server = http.createServer(app);

iotRoutes.setController(di.iotController);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(cors());

// Rate limiting middleware for IoT routes (must be declared before use)
const iotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard'
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoTrack IoT Service API',
      version: '1.0.0',
      description: 'API pour la réception et le traitement des données capteurs IoT'
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api`,
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            details: { type: 'object' },
            timestamp: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            data: { type: 'object' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

let swaggerSpec;
try {
  swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} catch (err) {
  console.error('Swagger initialization failed:', err.message);
  app.get('/api-docs', (req, res) => {
    res.json({ message: 'API docs temporarily unavailable' });
  });
}

app.get('/api', iotLimiter, (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur EcoTrack IoT Service API',
    version: '1.0.0',
    endpoints: {
      documentation: '/api-docs',
      health: '/health',
      measurements: '/api/iot/measurements',
      sensors: '/api/iot/sensors',
      alerts: '/api/iot/alerts',
      stats: '/api/iot/stats',
      simulate: '/api/iot/simulate'
    }
  });
});

app.use('/api', iotLimiter, iotRoutes);

app.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    services: {
      api: 'healthy',
      mqtt: 'unknown',
      database: 'unknown'
    }
  };

  if (isIntegrationSmoke) {
    healthcheck.services.database = 'skipped';
    healthcheck.services.mqtt = 'skipped';
  } else {
    try {
      const { pool } = require('./src/db/connexion');
      await pool.query('SELECT 1');
      healthcheck.services.database = 'healthy';
    } catch (error) {
      healthcheck.status = 'DEGRADED';
      healthcheck.services.database = 'unhealthy';
    }

    healthcheck.services.mqtt = di.mqttBroker.getAedes() ? 'healthy' : 'unavailable';
  }

  const statusCode = healthcheck.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthcheck);
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Route non trouvée',
    path: req.path
  });
});

app.use(errorHandler);

async function startServer() {
  if (isIntegrationSmoke) {
    const smokeServer = app.listen(config.PORT, () => {
      logger.info({
        port: config.PORT,
        mqttPort: config.MQTT.port,
        env: config.NODE_ENV,
        smoke: true
      }, `Service IoT started on port ${config.PORT}`);
    });

    return smokeServer;
  }

  const { testConnection } = require('./src/db/connexion');

  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.error('Failed to connect to PostgreSQL. Retrying in 5s...');
    setTimeout(startServer, 5000);
    return;
  }

  try {
    await cacheService.connect();
    logger.info('Redis cache connected');
  } catch (err) {
    logger.warn({ error: err.message }, 'Redis cache connection failed, continuing without');
  }

  try {
    await di.mqttBroker.start();
    logger.info({ mqttPort: config.MQTT.port }, 'MQTT Broker started');
  } catch (err) {
    logger.error({ error: err.message }, 'Failed to start MQTT Broker');
  }

  try {
    await kafkaProducer.connect();
    logger.info('Kafka producer connected');
  } catch (err) {
    logger.warn({ error: err.message }, 'Kafka producer connection failed, continuing without');
  }

  setInterval(async () => {
    try {
      await di.alertService.checkSilentSensors();
    } catch (err) {
      logger.error({ error: err.message }, 'Error checking silent sensors');
    }
  }, 60 * 60 * 1000);

  const liveServer = app.listen(config.PORT, () => {
    logger.info({
      port: config.PORT,
      mqttPort: config.MQTT.port,
      env: config.NODE_ENV
    }, `Service IoT started on port ${config.PORT}`);
  });

  centralizedLogging.connect().then(() => {
    logger.info('Centralized logging initialized');
  }).catch(err => {
    logger.warn({ err: err.message }, 'Centralized logging connection failed, continuing without');
  });

  process.on('SIGINT', async () => {
    logger.info('Shutting down service IoT');
    await kafkaProducer.disconnect();
    await cacheService.close();
    liveServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', async () => {
    logger.info('Shutting down service IoT (SIGTERM)');
    await kafkaProducer.disconnect();
    await cacheService.close();
    liveServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

if (process.env.DISABLE_AUTO_START !== 'true') {
  startServer();
}

module.exports = app;
