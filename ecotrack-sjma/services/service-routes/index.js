const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./src/utils/logger');
const config = require('./src/config/config');
const errorHandler = require('./src/middleware/error-handler');
const requestLogger = require('./src/middleware/request-logger');
const { publicLimiter } = require('./src/middleware/rateLimit');
const { controllersMiddleware } = require('./src/di');
const { testConnection } = require('./src/db/connexion');
const { pool } = require('./src/db/connexion');
const cacheService = require('./src/services/cacheService');

const client = require('prom-client');
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
const isIntegrationSmoke = process.env.INTEGRATION_SMOKE === 'true';

// ========== MIDDLEWARE ==========
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard'
});
app.use('/tournees/', limiter);

app.use(controllersMiddleware);

// ========== SWAGGER ==========
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoTrack Routes API',
      version: '1.0.0',
      description: 'API de gestion des tournées de collecte - Système de Tournées EcoTrack'
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api/routes`,
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
            timestamp: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ========== ROUTES ==========
const tourneeRoutes = require('./src/routes/tournee.route');
const vehiculeRoutes = require('./src/routes/vehicule.route');
const collecteRoutes = require('./src/routes/collecte.route');
const statsRoutes = require('./src/routes/stats.route');
const signalementRoutes = require('./src/routes/signalement.route');

// Servir les PDF générés
const reportsDir = process.env.REPORTS_DIR || './reports';
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
app.use('/reports', express.static(reportsDir));

app.use('/api/routes', publicLimiter, tourneeRoutes);
app.use('/api/routes', publicLimiter, vehiculeRoutes);
app.use('/api/routes', publicLimiter, collecteRoutes);
app.use('/api/routes', publicLimiter, statsRoutes);
app.use('/api/routes', publicLimiter, signalementRoutes);

// Root info
app.get('/api/routes', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur EcoTrack Routes API',
    version: '1.0.0',
    endpoints: {
      documentation: '/api-docs',
      health: '/health',
      metrics: '/metrics',
      tournees: '/api/routes/tournees',
      vehicules: '/api/routes/vehicules',
      optimize: '/api/routes/optimize',
      stats: '/api/routes/stats/dashboard'
    }
  });
});

// ========== HEALTH CHECK ==========
app.get('/health', limiter, async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    services: {
      api: 'healthy',
      database: 'unknown'
    }
  };

  if (isIntegrationSmoke) {
    health.services.database = 'skipped';
  } else {
    try {
      await pool.query('SELECT 1');
      health.services.database = 'healthy';
    } catch (err) {
      health.status = 'DEGRADED';
      health.services.database = 'unhealthy';
    }
  }

  res.status(health.status === 'OK' ? 200 : 503).json(health);
});

// ========== METRICS ==========
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

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

// ========== 404 ==========
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Route non trouvée',
    path: req.path
  });
});

// ========== ERROR HANDLER ==========
app.use(errorHandler);

// ========== START ==========
const port = config.PORT;
app.listen(port, async () => {
  logger.info({ port }, 'EcoTrack Routes API ready');
  logger.info({ url: `http://localhost:${port}/api/routes` }, 'API base URL');
  logger.info({ url: `http://localhost:${port}/api-docs` }, 'Swagger docs ready');
  logger.info({ env: config.NODE_ENV }, 'Environment');
  await testConnection();
  
  // Initialize Redis cache
  await cacheService.connect().then(() => {
    logger.info('Redis cache initialized');
  }).catch(err => {
    logger.warn({ err: err.message }, 'Redis connection failed, continuing without cache');
  });
});

module.exports = app;
