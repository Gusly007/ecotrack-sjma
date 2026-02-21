import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import cors from 'cors';
import morgan from 'morgan';
import roleRoutes from './routes/roles.js';
import notificationRoutes from './routes/notifications.js';
import avatarRoutes from './routes/avatars.js';
import { errorHandler } from './middleware/errorHandler.js';
import { publicLimiter } from './config/rateLimit.js';
import pool, { ensureAuthTables } from './config/database.js';
import path from 'path';
import env from './config/env.js';
import { validateEnv } from './config/env.js';
import helmet from 'helmet';
import logger from './utils/logger.js';
import client from 'prom-client';

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

app.use(helmet({
  // Swagger UI can break with strict CSP in dev; keep it simple for now.
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: env.nodeEnv === 'production' ? undefined : false
}));

app.use(cors());
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

// Health check DB
app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'down', error: err.message });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
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
app.use('/users', userRoutes);
app.use('/users/avatar', avatarRoutes);
app.use('/admin/roles', roleRoutes);
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

const server = app.listen(env.port, () => {
  logger.info({ port: env.port }, 'Service users ready');
  logger.info({ url: `http://localhost:${env.port}/api-docs` }, 'Swagger docs ready');
});

process.on('SIGINT', async () => {
  logger.info('Shutting down service users');
  await pool.end();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;