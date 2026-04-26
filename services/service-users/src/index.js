import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import roleRoutes from './routes/roles.js';
import notificationRoutes from './routes/notifications.js';
import avatarRoutes from './routes/avatars.js';
import adminConfigRoutes from './routes/admin-config.js';
import adminEnvironmentalConstantsRoutes from './routes/admin-environmental-constants.js';
import adminAgentPerformanceRoutes from './routes/admin-agent-performance.js';
import { errorHandler } from './middleware/errorHandler.js';
import { publicLimiter } from './config/rateLimit.js';
import pool, { ensureAuthTables } from './config/database.js';
import path from 'path';
import env, { loadDbConfig } from './config/env.js';
import { validateEnv } from './config/env.js';
import helmet from 'helmet';
import logger from './utils/logger.js';
import client from 'prom-client';
import cacheService from './services/cacheService.js';
import kafkaNotificationConsumer from './services/kafkaNotificationConsumer.js';

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

// Needed when running behind a reverse proxy / API Gateway
app.set('trust proxy', 1);

if (env.nodeEnv !== 'test') {
  validateEnv();
}

if (env.nodeEnv !== 'test') {
  // Ensure minimal auth tables + sequences exist before serving requests.
  await ensureAuthTables();
}

// Initialize Redis cache (non-blocking; service starts even if Redis is unavailable)
if (env.nodeEnv !== 'test') {
  cacheService.connect().catch(err => {
    logger.warn({ err: err.message }, 'Redis connection failed during startup; continuing without cache');
  });
}

// Load configurations from database
if (env.nodeEnv !== 'test') {
  await loadDbConfig();
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: env.nodeEnv === 'production' ? undefined : false
}));

app.use(cors());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard'
});
app.use('/auth/', apiLimiter);
app.use('/users/', apiLimiter);

app.use(express.json());
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      logger.info({ type: 'access', message: message.trim() }, 'HTTP request');
    }
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'users' });
});

// Health check DB - with rate limiting
app.get('/health/db', apiLimiter, async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'down', error: err.message });
  }
});

// Metrics endpoint - with rate limiting
app.get('/metrics', apiLimiter, async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Metrics middleware
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

// Routes
app.use('/auth', publicLimiter, authRoutes);
app.use('/users', publicLimiter, userRoutes);
app.use('/users/avatar', avatarRoutes);
app.use('/admin/roles', roleRoutes);
app.use('/admin/config', adminConfigRoutes);
app.use('/admin/environmental-constants', adminEnvironmentalConstantsRoutes);
app.use('/admin/agent-performance', adminAgentPerformanceRoutes);
app.use('/notifications', notificationRoutes);

// Servir les avatars en tant que fichiers statiques
app.use('/avatars', express.static(path.join(process.cwd(), 'storage/avatars')));

// Route for Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling (must be last)
app.use(errorHandler);

// Only start server if not in test mode
if (env.nodeEnv !== 'test') {
  const server = app.listen(env.port, () => {
    logger.info({ port: env.port }, 'Service users ready');
    logger.info({ url: `http://localhost:${env.port}/api-docs` }, 'Swagger docs ready');

    kafkaNotificationConsumer.onAlert(async (alert, meta) => {
      logger.warn({ topic: meta.topic, alertId: alert?.id_alerte, containerId: alert?.id_conteneur }, 'Kafka alert received by users service');
    });

    kafkaNotificationConsumer.onNotification(async (payload, meta) => {
      logger.info({ topic: meta.topic, payloadType: payload?.type }, 'Kafka notification received by users service');
    });

    kafkaNotificationConsumer.connect().catch((err) => {
      logger.warn({ err: err.message }, 'Kafka consumer startup failed, continuing without');
    });
  });

  process.on('SIGINT', async () => {
    logger.info('Shutting down service users');
    await kafkaNotificationConsumer.disconnect();
    await pool.end();
    await cacheService.close();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', async () => {
    logger.info('Shutting down service users (SIGTERM)');
    await kafkaNotificationConsumer.disconnect();
    await pool.end();
    await cacheService.close();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

export default app;