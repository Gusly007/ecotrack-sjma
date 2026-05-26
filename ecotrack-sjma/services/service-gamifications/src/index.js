// Rôle du fichier : point d'entrée Express, routes et gestion d'erreurs.
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import client from 'prom-client';
import swaggerUi from 'swagger-ui-express';
import pool, { ensureGamificationTables } from './config/database.js';
import env, { validateEnv } from './config/env.js';
import { publicLimiter } from './config/rateLimit.js';
import swaggerSpec from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import actionsRoutes from './routes/actions.js';
import badgesRoutes from './routes/badges.js';
import classementRoutes from './routes/classement.js';
import defisRoutes from './routes/defis.js';
import notificationsRoutes from './routes/notifications.js';
import statsRoutes from './routes/stats.js';
import centralizedLogging from './services/centralizedLogging.js';
import logger from './utils/logger.js';

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

app.set('trust proxy', 1);

if (env.nodeEnv !== 'test') {
  // En prod/dev, on s'assure que la config et les tables sont prêtes.
  validateEnv();
  await ensureGamificationTables();
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: env.nodeEnv === 'production' ? undefined : false
  })
);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Populate req.user from gateway-forwarded headers (x-user-id / x-user-role).
// Sans cette ligne, requirePermission renvoie 401 sur toute requête —
// y compris l'appel interne service-routes → service-gamifications
// (gamificationClient) après création d'un signalement, et les calls
// /api/V1/gamification/* depuis le mobile citoyen.
app.use((req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  if (userId && userRole) {
    req.user = { id: parseInt(userId, 10), role: userRole };
  }
  next();
});
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      logger.info({ type: 'access', message: message.trim() }, 'HTTP request');
    }
  }
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gamifications' });
});

// Health check DB
app.get('/health/db', publicLimiter, async (req, res) => {
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
    
    // Log to centralized_logs
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warning' : 'info';
    const action = req.method.toLowerCase();
    centralizedLogging.log({
      level,
      action,
      service: 'service-gamifications',
      message: `${req.method} ${req.path} - ${res.statusCode}`,
      metadata: { route, duration, statusCode: res.statusCode },
      userId: req.user?.id || req.headers['x-user-id'],
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => {});
  });
  next();
});

app.use('/actions', actionsRoutes);
app.use('/badges', badgesRoutes);
app.use('/defis', defisRoutes);
app.use('/classement', publicLimiter, classementRoutes);
app.use('/notifications', publicLimiter, notificationsRoutes);
app.use('/', statsRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Handler d'erreurs
app.use(errorHandler);

// 404 (si aucune route n'a matché)
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

let server;
if (env.nodeEnv !== 'test') {
  server = app.listen(env.port, () => {
    logger.info({ port: env.port }, 'Service gamification ready');
  });

  // Initialize centralized logging
  centralizedLogging.connect().then(() => {
    logger.info('Centralized logging initialized');
  }).catch(err => {
    logger.warn({ err: err.message }, 'Centralized logging connection failed, continuing without');
  });

  process.on('SIGINT', async () => {
    logger.info('Shutting down service gamification');
    await pool.end();
    server.close(() => {
      logger.info('Service gamification stopped');
      process.exit(0);
    });
  });
}

export default app;
