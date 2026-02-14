import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import { unifiedSwaggerSpec, swaggerOptions } from './swagger-config.js';
import { jwtValidationMiddleware } from './middleware/auth.js';
import { requestLogger, detailedRequestLogger, errorLogger, logger } from './middleware/logger.js';
import healthCheckService from './services/healthCheck.js';

dotenv.config();

const app = express();
/**
 * API Gateway for EcoTrack microservices
 * @type {number}
 * @default 3000
 * @constant {number} gatewayPort - Port on which the API Gateway listens
 * @description
 * The API Gateway routes requests to various microservices including:
 * - Users Service
 * - Containers Service
 * - Routes & Planning Service
 * - Gamification Service
 * - Analytics Service
 * - IoT Service
 *
 * Each service can be in different states (ready, pending) and has its own set of routes.
 * The gateway also provides a unified health check endpoint and API documentation overview.
 * @example
 * // Start the gateway
 * node api-gateway/src/index.js
 * // Access the gateway at http://localhost:3000
 * // Access the health check at http://localhost:3000/health
 * // Access the API docs overview at http://localhost:3000/api-docs
 */
const gatewayPort = parseInt(process.env.GATEWAY_PORT, 10) || 3000

const services = {
  users: {
    displayName: 'Users Service',
    status: 'ready',
    port: parseInt(process.env.USERS_PORT, 10) || 3010,
    baseUrl: process.env.USERS_SERVICE_URL,
    swaggerPath: '/api-docs',
    routes: [
      { mountPath: '/auth' },
      { mountPath: '/users' },
      { mountPath: '/notifications' },
      { mountPath: '/admin/roles' },
      { mountPath: '/avatars' },
      { mountPath: '/api/users', rewrite: (path) => path.replace(/^\/api\/users/, '/users') }
    ]
  },
  containers: {
    displayName: 'Containers Service',
    status: 'ready',
    port: parseInt(process.env.CONTAINERS_PORT, 10) || 3011,
    baseUrl: process.env.CONTAINERS_SERVICE_URL,
    swaggerPath: '/api-docs',
    routes: [
      { mountPath: '/api/containers' },
      { mountPath: '/api/zones' },
      { mountPath: '/api/typecontainers' },
      { mountPath: '/api/stats' }
    ]
  },
  routes: {
    displayName: 'Routes & Planning Service',
    status: 'pending',
    routes: [{ mountPath: '/api/routes' }]
  },
  gamification: {
    displayName: 'Gamification Service',
    status: 'ready',
    port: parseInt(process.env.GAMIFICATIONS_PORT, 10) || 3014,
    baseUrl: process.env.GAMIFICATIONS_SERVICE_URL,
    swaggerPath: '/api-docs',
    routes: [
      { mountPath: '/api/gamification/actions', rewrite: (path) => path.replace(/^\/api\/gamification/, '') },
      { mountPath: '/api/gamification/badges', rewrite: (path) => path.replace(/^\/api\/gamification/, '') },
      { mountPath: '/api/gamification/defis', rewrite: (path) => path.replace(/^\/api\/gamification/, '') },
      { mountPath: '/api/gamification/classement', rewrite: (path) => path.replace(/^\/api\/gamification/, '') },
      { mountPath: '/api/gamification/notifications', rewrite: (path) => path.replace(/^\/api\/gamification/, '') },
      { mountPath: '/api/gamification/stats', rewrite: (path) => path.replace(/^\/api\/gamification\/stats/, '') }
    ]
  },
  analytics: {
    displayName: 'Analytics Service',
    status: 'pending',
    routes: [{ mountPath: '/api/analytics' }]
  },
  iot: {
    displayName: 'IoT Service',
    status: 'pending',
    routes: [{ mountPath: '/api/iot' }]
  }
};

Object.values(services).forEach((svc) => {
  if (!svc.baseUrl && svc.port) {
    svc.baseUrl = `http://localhost:${svc.port}`;
  }
});

// Enregistrer les services pour le health check
Object.entries(services).forEach(([key, svc]) => {
  if (svc.baseUrl) {
    healthCheckService.registerService(key, {
      displayName: svc.displayName,
      baseUrl: svc.baseUrl,
      healthEndpoint: '/health'
    });
  }
});

const globalRateLimit = rateLimit({
  windowMs: parseInt(process.env.GATEWAY_RATE_WINDOW_MS, 10) || 60 * 1000,
  max: parseInt(process.env.GATEWAY_RATE_MAX, 10) || 100,
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: Math.ceil((parseInt(process.env.GATEWAY_RATE_WINDOW_MS, 10) || 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Logging des rate limit hits
  handler: (req, res, next, options) => {
    logger.warn({ ip: req.ip }, 'Rate limit exceeded');
    res.status(429).json(options.message);
  }
});

const createProxy = (target, pathRewrite) => createProxyMiddleware({
  target,
  changeOrigin: true,
  proxyTimeout: 10_000,
  pathRewrite: (path, req) => {
    // When mounted under a path (e.g. app.use('/auth', proxy)), Express removes the
    // mount prefix from req.url. Re-add it so upstream receives the expected paths.
    const fullPath = `${req.baseUrl || ''}${path}`;

    if (typeof pathRewrite === 'function') {
      // Support simple (path) => string rewrites used in this gateway.
      return pathRewrite.length >= 2 ? pathRewrite(fullPath, req) : pathRewrite(fullPath);
    }

    return fullPath;
  },
  // Best-effort fix for body forwarding when other middleware consumed it.
  onProxyReq: fixRequestBody,
  onError: (err, req, res) => {
    logger.error({ error: err.message }, 'Proxy error');
    if (!res.headersSent) {
      res.status(502).json({ error: 'Upstream service unavailable' });
    }
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// =========================================================================
// SÉCURITÉ
// =========================================================================
// Headers de sécurité Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false // Désactivé pour Swagger UI
}));

// Rate limiting global
app.use(globalRateLimit);

// =========================================================================
// LOGGING
// =========================================================================
app.use(requestLogger);
app.use(detailedRequestLogger);

// =========================================================================
// AUTHENTIFICATION
// =========================================================================
// Validation JWT sur toutes les routes (sauf publiques)
app.use(jwtValidationMiddleware);

// =========================================================================
// DOCUMENTATION API UNIFIÉE
// =========================================================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(unifiedSwaggerSpec, swaggerOptions));

// Documentation individuelle des services (proxies)
// Conservés pour accès direct aux specs détaillées
Object.entries(services).forEach(([key, svc]) => {
  if (svc.status === 'ready' && svc.swaggerPath) {
    const docsMount = `/docs/${key}`;
    svc.swaggerGatewayPath = docsMount;
    app.use(
      docsMount,
      createProxy(svc.baseUrl, () => svc.swaggerPath)
    );
  }
});

// =========================================================================
// HEALTH CHECKS
// =========================================================================

// Health check basique
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    gateway: 'up',
    timestamp: new Date().toISOString()
  });
});

// Health check détaillé avec vérification des services
app.get('/health/detailed', async (req, res) => {
  try {
    const status = await healthCheckService.getOverallStatus();
    
    // Déterminer le code de statut HTTP
    let statusCode = 200;
    if (status.status === 'unhealthy') {
      statusCode = 503;
    } else if (status.status === 'degraded') {
      statusCode = 200; // Toujours 200 mais avec warning
    }
    
    res.status(statusCode).json(status);
  } catch (err) {
    logger.error({ error: err.message }, 'Health check error');
    res.status(500).json({
      status: 'error',
      error: 'Failed to perform health check',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check d'un service spécifique
app.get('/health/:service', async (req, res) => {
  const { service } = req.params;
  
  try {
    const result = await healthCheckService.checkService(service);
    
    if (!result) {
      return res.status(404).json({
        error: 'Service not found',
        availableServices: Array.from(healthCheckService.services.keys())
      });
    }
    
    const statusCode = result.status === 'down' ? 503 : 200;
    res.status(statusCode).json(result);
  } catch (err) {
    res.status(500).json({
      error: 'Health check failed',
      message: err.message
    });
  }
});

Object.entries(services).forEach(([key, svc]) => {
  if (!svc.routes) {
    return;
  }

  if (svc.status === 'ready' && svc.baseUrl) {
    svc.routes.forEach(({ mountPath, rewrite }) => {
      app.use(mountPath, createProxy(svc.baseUrl, rewrite));
    });
  } else {
    svc.routes.forEach(({ mountPath }) => {
      app.use(mountPath, (req, res) => {
        res.status(501).json({
          error: `${svc.displayName} non disponible pour le moment`,
          status: svc.status
        });
      });
    });
  }
});

app.get('/api-overview', (req, res) => {
  const baseUrl = `http://localhost:${gatewayPort}`;

  const docs = Object.entries(services).map(([key, svc]) => ({
    key,
    name: svc.displayName,
    status: svc.status,
    routes: svc.routes?.map((r) => r.mountPath) || [],
    docsUrl: svc.swaggerGatewayPath ? `${baseUrl}${svc.swaggerGatewayPath}` : null
  }));

  res.json({
    message: 'Documentation unifiée disponible sur /api-docs',
    unifiedDocs: `${baseUrl}/api-docs`,
    gatewayBaseUrl: baseUrl,
    services: docs
  });
});

app.use(errorLogger);

app.use((err, req, res, next) => {
  logger.error({ error: err.message }, 'Gateway error');
  
  // Ne pas exposser les détails de l'erreur en production
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(err.status || 500).json({ 
    error: isProduction ? 'Internal server error' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(gatewayPort, () => {
  logger.info({ port: gatewayPort }, 'API Gateway ready');
  console.table(
    Object.entries(services).map(([key, svc]) => ({
      service: key,
      status: svc.status,
      target: svc.baseUrl || 'pending'
    }))
  );
});

process.on('SIGINT', () => {
  logger.info('Shutting down gateway');
  server.close(() => {
    logger.info('Gateway closed');
    process.exit(0);
  });
});

export default app;
