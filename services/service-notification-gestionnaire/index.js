'use strict';

require('dotenv').config();

const http    = require('http');
const express = require('express');
const helmet  = require('helmet');
const client  = require('prom-client');

const logger        = require('./src/utils/logger');
const corsMiddleware = require('./src/middleware/cors');
const requestLogger = require('./src/middleware/request-logger');
const errorHandler  = require('./src/middleware/error-handler');
const { generalLimiter } = require('./src/middleware/rateLimit');
const notificationRoutes = require('./src/routes/notification.route');

// ─── Prometheus ───────────────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// ─── App ──────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ─── Sécurité ─────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'", "'unsafe-inline'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ─── CORS ─────────────────────────────────────────────────────
app.use(corsMiddleware);

// ─── Parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Logger HTTP ──────────────────────────────────────────────
app.use(requestLogger);

// ─── Rate limiting ────────────────────────────────────────────
app.use(generalLimiter);

// ─── Métriques Prometheus (avant les routes) ──────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestsTotal.inc({ method: req.method, route, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, route, status: res.statusCode }, duration);
  });
  next();
});

// ─── Swagger ──────────────────────────────────────────────────
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi    = require('swagger-ui-express');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'EcoTrack — Notifications Gestionnaire API',
      version:     '1.0.0',
      description: 'API de gestion des notifications pour les gestionnaires de zones EcoTrack',
    },
    servers: [{ url: `http://localhost:${process.env.APP_PORT || 3016}/api` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Notification: {
          type: 'object',
          properties: {
            id_notification: { type: 'integer', example: 1 },
            id_utilisateur:  { type: 'integer', example: 42 },
            type:    { type: 'string', enum: ['ALERTE', 'TOURNEE', 'BADGE', 'SYSTEME'] },
            titre:   { type: 'string', example: 'Zone saturée' },
            corps:   { type: 'string', example: 'Le taux dépasse 90 % sur la zone Nord.' },
            est_lu:  { type: 'boolean', example: false },
            date_creation: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success:    { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 400 },
            message:    { type: 'string' },
            details:    { type: 'object', nullable: true },
            timestamp:  { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'EcoTrack — Notifications Gestionnaire API',
    version: '1.0.0',
    endpoints: {
      documentation: '/api-docs',
      health:        '/health',
      metrics:       '/metrics',
      notifications: '/api/notifications',
    },
  });
});

app.use('/api', notificationRoutes);

// ─── Health check ─────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const health = {
    status:    'OK',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: { api: 'healthy', database: 'unknown' },
  };

  try {
    const { pool } = require('./src/db/connexion');
    await pool.query('SELECT 1');
    health.services.database = 'healthy';
  } catch {
    health.status = 'DEGRADED';
    health.services.database = 'unhealthy';
  }

  res.status(health.status === 'OK' ? 200 : 503).json(health);
});

// ─── Metrics ──────────────────────────────────────────────────
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success:    false,
    statusCode: 404,
    message:    'Route non trouvée',
    path:       req.path,
  });
});

// ─── Error handler (doit être le dernier middleware) ──────────
app.use(errorHandler);

// ─── Démarrage ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  const PORT = Number(process.env.APP_PORT) || 3016;

  const { testConnection } = require('./src/db/connexion');
  const { createRedisClient } = require('./src/db/redis-client');
  const kafkaConsumer = require('./kafkaConsumer');

  server.listen(PORT, async () => {
    logger.info({ port: PORT }, 'Service notification-gestionnaire démarré');
    logger.info({ url: `http://localhost:${PORT}/api` },        'API base URL');
    logger.info({ url: `http://localhost:${PORT}/api-docs` },   'Swagger docs');
    logger.info({ url: `http://localhost:${PORT}/health` },     'Health check');
    logger.info({ env: process.env.NODE_ENV || 'development' }, 'Environnement');

    await testConnection();

    try {
      await createRedisClient();
      logger.info('Redis cache connecté');
    } catch (err) {
      logger.warn({ error: err.message }, 'Redis indisponible — cache désactivé');
    }

    try {
      await kafkaConsumer.connect();
      logger.info({ topics: ['ecotrack.alerts', 'ecotrack.signalements.nouveau'] }, 'Kafka Consumer démarré');
    } catch (err) {
      logger.warn({ error: err.message }, 'Kafka indisponible — notifications automatiques désactivées');
    }
  });

  // Arrêt propre
  const shutdown = async (signal) => {
    logger.info({ signal }, 'Arrêt du service...');
    await kafkaConsumer.disconnect();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

module.exports = { app, server };
