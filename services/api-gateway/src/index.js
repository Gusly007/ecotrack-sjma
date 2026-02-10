import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import { unifiedSwaggerSpec, swaggerOptions } from './swagger-config.js';

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
    status: 'pending',
    routes: [{ mountPath: '/api/gamification' }]
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

const globalRateLimit = rateLimit({
  windowMs: parseInt(process.env.GATEWAY_RATE_WINDOW_MS, 10) || 60 * 1000,
  max: parseInt(process.env.GATEWAY_RATE_MAX, 10) || 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
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
    console.error('❌ Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Upstream service unavailable' });
    }
  }
});

app.use(cors());
app.use(globalRateLimit);

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

app.get('/health', (req, res) => {
  const serviceStatus = Object.fromEntries(
    Object.entries(services).map(([key, svc]) => [key, { status: svc.status, target: svc.baseUrl || 'pending' }])
  );

  res.json({
    status: 'ok',
    gateway: 'multi-service (users ready, others pending)',
    services: serviceStatus,
    timestamp: new Date().toISOString()
  });
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

app.use((err, req, res, next) => {
  console.error('❌ Gateway error:', err.message);
  res.status(500).json({ error: 'Gateway error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(gatewayPort, () => {
  console.log(`🚪 API Gateway ready on port ${gatewayPort}`);
  console.table(
    Object.entries(services).map(([key, svc]) => ({
      service: key,
      status: svc.status,
      target: svc.baseUrl || 'pending'
    }))
  );
});

process.on('SIGINT', () => {
  console.log('\n⛔ Shutting down gateway...');
  server.close(() => {
    console.log('✓ Gateway closed');
    process.exit(0);
  });
});

export default app;
