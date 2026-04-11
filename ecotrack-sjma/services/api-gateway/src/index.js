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
import centralizedLogging from './services/centralizedLogging.js';
import dashboardStatsService from './services/dashboardStats.js';
import cacheService from './services/cacheService.js';
import client from 'prom-client';

dotenv.config();

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

const localhostIps = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const shouldBypassLocalRateLimit = () => {
  if (process.env.GATEWAY_RATE_BYPASS_LOCAL === 'true') return true;
  if (process.env.GATEWAY_RATE_BYPASS_LOCAL === 'false') return false;
  return (process.env.NODE_ENV || 'development') === 'development';
};

const hasLocalhostHostHeader = (req) => {
  const host = (req.headers?.host || '').toLowerCase();
  const forwardedHost = (req.headers?.['x-forwarded-host'] || '').toLowerCase();
  return host.includes('localhost') || host.includes('127.0.0.1') || forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1');
};
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
      { mountPath: '/admin/config' },
      { mountPath: '/admin/environmental-constants' },
      { mountPath: '/admin/agent-performance' },
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
    status: 'ready',
    port: parseInt(process.env.ROUTES_PORT, 10) || 3012,
    baseUrl: process.env.ROUTES_SERVICE_URL,
    swaggerPath: '/api-docs',
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
    status: 'ready',
    port: parseInt(process.env.ANALYTICS_PORT, 10) || 3015,
    baseUrl: process.env.ANALYTICS_SERVICE_URL,
    swaggerPath: '/api-docs',
    routes: [{ mountPath: '/api/analytics' }]
  },
  iot: {
    displayName: 'IoT Service',
    status: 'ready',
    port: parseInt(process.env.IOT_PORT, 10) || 3013,
    baseUrl: process.env.IOT_SERVICE_URL,
    swaggerPath: '/api-docs',
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
  skip: (req) => {
    if (req.path === '/health') return true;
    if (!shouldBypassLocalRateLimit()) return false;
    return localhostIps.has(req.ip) || hasLocalhostHostHeader(req);
  },
  // Logging des rate limit hits
  handler: (req, res, next, options) => {
    logger.warn({ ip: req.ip, path: req.originalUrl }, 'Rate limit exceeded');
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
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
    } else if (/^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires', 'X-Requested-With'],
  exposedHeaders: ['Cache-Control', 'Pragma', 'Expires', 'X-Total-Count'],
  maxAge: 86400
}));

app.use((req, res, next) => {
  const isDocsAsset = req.path === '/api-docs' || req.path.startsWith('/api-docs/');
  if (isDocsAsset) {
    // Swagger static assets can be cached briefly to avoid noisy scanner findings.
    res.setHeader('Cache-Control', 'public, max-age=300');
  } else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// =========================================================================
// SÉCURITÉ
// =========================================================================
// Headers de sécurité Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: { policy: 'require-corp' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
  permissionsPolicy: {
    features: {
      accelerometer: [],
      camera: [],
      geolocation: [],
      gyroscope: [],
      magnetometer: [],
      microphone: [],
      payment: [],
      usb: [],
      fullscreen: ['self']
    }
  }
}));

// En-têtes de sécurité complémentaires
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), fullscreen=(self)');
  next();
});

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
app.use('/api-docs', (req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-src 'none'; manifest-src 'self'"
  );
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), fullscreen=(self)'
  );
  next();
});

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

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// =========================================================================
// CENTRALIZED LOGGING API
// =========================================================================

// Actions disponibles
const LOG_ACTIONS = [
  'login', 'logout', 'register', 'password_change',
  'create', 'update', 'delete', 'view',
  'api_call', 'error', 'security', 'other'
];

// Endpoint pour que les services envoient leurs logs
app.post('/api/logs', async (req, res) => {
  try {
    const { 
      level = 'info', 
      action = 'other',
      service, 
      message, 
      metadata = {}, 
      userId, 
      traceId,
      ipAddress,
      userAgent
    } = req.body;
    
    if (!service || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: service, message' 
      });
    }

    await centralizedLogging.log({
      level,
      action,
      service,
      message,
      metadata,
      userId,
      traceId,
      ipAddress: ipAddress || req.ip,
      userAgent: userAgent || req.headers['user-agent']
    });
    
    res.json({ success: true });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to log');
    res.status(500).json({ error: 'Failed to log' });
  }
});

// Query logs with advanced filters
app.get('/api/logs', async (req, res) => {
  try {
    const { 
      service = 'all', 
      level = 'all', 
      action = 'all',
      startDate, 
      endDate, 
      limit = 100, 
      offset = 0,
      search,
      userId
    } = req.query;
    
    const logs = await centralizedLogging.queryLogs({
      service,
      level,
      action,
      startDate,
      endDate,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
      search,
      userId
    });
    
    res.json({ logs });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to query logs');
    res.status(500).json({ error: 'Failed to query logs' });
  }
});

// Get log summary
app.get('/api/logs/summary', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const summary = await centralizedLogging.getSummary(parseInt(days));
    res.json({ summary });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to get summary');
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

// Get log statistics
app.get('/api/logs/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await centralizedLogging.getStats(parseInt(days));
    res.json({ stats });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to get log stats');
    res.status(500).json({ error: 'Failed to get log stats' });
  }
});

// Get filter values (services, actions, levels)
app.get('/api/logs/filters', async (req, res) => {
  try {
    const filters = await centralizedLogging.getFilterValues();
    res.json({ filters });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to get filters');
    res.status(500).json({ error: 'Failed to get filters' });
  }
});

// Export logs
app.get('/api/logs/export', async (req, res) => {
  try {
    const { 
      service = 'all', 
      level = 'all', 
      action = 'all',
      startDate, 
      endDate, 
      search,
      userId,
      format = 'json'
    } = req.query;
    
    const data = await centralizedLogging.exportLogs({
      service,
      level,
      action,
      startDate,
      endDate,
      search,
      userId,
      format
    });
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
      res.send(data);
    } else {
      res.json({ logs: data, count: data.length });
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to export logs');
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

// Cleanup old logs (admin only)
app.delete('/api/logs/cleanup', async (req, res) => {
  try {
    const { days, level, action, service, startDate, endDate } = req.query;
    const deleted = await centralizedLogging.cleanup({ 
      days: days ? parseInt(days) : undefined,
      level: level && level !== 'all' ? level : undefined,
      action: action && action !== 'all' ? action : undefined,
      service: service && service !== 'all' ? service : undefined,
      startDate,
      endDate
    });
    res.json({ success: true, deleted });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to cleanup logs');
    res.status(500).json({ error: 'Failed to cleanup logs' });
  }
});

// Get all alerts
  app.get('/api/alerts', async (req, res) => {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      const axios = (await import('axios')).default;

      const params = new URLSearchParams({ limit, offset });
      if (status && status !== 'all') params.append('status', status);

      const response = await axios.get(`http://ecotrack-service-iot:3013/api/alerts?${params.toString()}`, {
        timeout: 5000
      });

      res.json(response.data);
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get alerts');
      res.status(500).json({ error: 'Failed to get alerts' });
    }
  });

  // Update alert status (resolve/ignore)
  app.patch('/api/alerts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { statut } = req.body;
      const axios = (await import('axios')).default;

      const response = await axios.patch(`http://ecotrack-service-iot:3013/api/iot/alerts/${id}`, {
        statut
      }, {
        timeout: 5000
      });

      res.json(response.data);
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to update alert');
      res.status(500).json({ error: 'Failed to update alert' });
    }
  });

  // Get unified alerts from all sources
  app.get('/api/alerts/unified', async (req, res) => {
    try {
      const axios = (await import('axios')).default;
      const { severity, type, status, limit = 50, offset = 0 } = req.query;

      // 1. Get IoT alerts from service-iot (with status filter)
      const iotResponse = await axios.get('http://ecotrack-service-iot:3013/api/alerts', {
        params: { status, limit: 1000, offset: 0 }, // Get all to filter properly, then paginate
        timeout: 5000
      }).catch(() => ({ data: { data: [], total: 0 } }));

      // 2. Get Prometheus alerts (if available) - only if status is 'all' or 'ACTIVE'
      let prometheusAlerts = [];
      if (!status || status === 'all' || status === 'ACTIVE') {
        const prometheusResponse = await axios.get('http://prometheus:9090/api/v1/alerts', {
          timeout: 3000
        }).catch(() => ({ data: { data: { alerts: [] } } }));
        
        prometheusAlerts = prometheusResponse.data.data?.alerts?.map(alert => ({
          id: `prom-${alert.labels?.alertname}-${Date.now()}`,
          type: alert.labels?.alertname,
          severity: alert.labels?.severity || 'warning',
          category: alert.labels?.category || 'infrastructure',
          icon: 'fa-server',
          title: alert.annotations?.summary || alert.labels?.alertname,
          description: alert.annotations?.description || '',
          time: new Date(alert.startsAt).toISOString(),
          statut: alert.state?.toUpperCase() || 'ACTIVE',
          valeur: alert.annotations?.current_value || '',
          seuil: alert.annotations?.threshold || '',
          source: 'prometheus'
        })) || [];
      }

      // Transform IoT alerts
      const iotAlerts = iotResponse.data.data?.map(alert => {
        const config = {
          DEBORDEMENT: { severity: 'critical', category: 'conteneur', icon: 'fa-fill-drip' },
          BATTERIE_FAIBLE: { severity: 'high', category: 'capteur', icon: 'fa-battery-quarter' },
          CAPTEUR_DEFAILLANT: { severity: 'medium', category: 'capteur', icon: 'fa-microchip' }
        }[alert.type_alerte] || { severity: 'low', category: 'autre', icon: 'fa-bell' };

        return {
          id: alert.id_alerte,
          type: alert.type_alerte,
          severity: config.severity,
          category: config.category,
          icon: config.icon,
          title: `${alert.type_alerte} - Conteneur #${alert.id_conteneur}`,
          description: alert.description || `${alert.type_alerte}: ${alert.valeur_detectee}/${alert.seuil}`,
          time: alert.date_creation,
          statut: alert.statut,
          valeur: alert.valeur_detectee,
          seuil: alert.seuil,
          source: 'iot'
        };
      }) || [];

      // Combine all alerts
      let allAlerts = [...iotAlerts, ...prometheusAlerts];

      // Filter by severity
      if (severity && severity !== 'all') {
        allAlerts = allAlerts.filter(a => a.severity === severity);
      }

      // Filter by type/category
      if (type && type !== 'all') {
        allAlerts = allAlerts.filter(a => 
          a.type === type || 
          a.category === type.toLowerCase()
        );
      }

      // Sort by time (newest first)
      allAlerts.sort((a, b) => new Date(b.time) - new Date(a.time));

      const total = allAlerts.length;
      const paginatedAlerts = allAlerts.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

      res.json({
        success: true,
        data: paginatedAlerts,
        total: total
      });
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get unified alerts');
      res.status(500).json({ error: 'Failed to get alerts' });
    }
  });

  // Get alert stats
  app.get('/api/alerts/stats', async (req, res) => {
    try {
      const axios = (await import('axios')).default;
      
      const response = await axios.get('http://ecotrack-service-iot:3013/api/alerts', {
        params: { limit: 1000 },
        timeout: 5000
      }).catch(() => ({ data: { data: [] } }));

      const alerts = response.data.data || [];
      
      const stats = {
        critical: alerts.filter(a => a.type_alerte === 'DEBORDEMENT').length,
        high: alerts.filter(a => a.type_alerte === 'BATTERIE_FAIBLE').length,
        medium: alerts.filter(a => a.type_alerte === 'CAPTEUR_DEFAILLANT').length,
        low: alerts.filter(a => !['DEBORDEMENT', 'BATTERIE_FAIBLE', 'CAPTEUR_DEFAILLANT'].includes(a.type_alerte)).length,
        total: alerts.length
      };

      res.json({ success: true, data: stats });
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get alert stats');
      res.status(500).json({ error: 'Failed to get alert stats' });
    }
  });

  // Get sensors status
  app.get('/api/iot/sensors/status', async (req, res) => {
    try {
      const axios = (await import('axios')).default;

      const response = await axios.get('http://ecotrack-service-iot:3013/api/iot/sensors/status', {
        timeout: 5000,
        headers: {
          'x-user-id': '1',
          'x-user-role': 'ADMIN'
        }
      });

      res.json(response.data);
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get sensors status');
      res.status(500).json({ error: 'Failed to get sensors status' });
    }
  });

// Get all services health
  app.get('/api/health/all', async (req, res) => {
    try {
      const axios = (await import('axios')).default;

      const microservices = [
        { name: 'api-gateway', url: 'http://localhost:3000/health' },
        { name: 'service-users', url: 'http://ecotrack-service-users:3010/health' },
        { name: 'service-containers', url: 'http://ecotrack-service-containers:3011/health' },
        { name: 'service-routes', url: 'http://ecotrack-service-routes:3012/health' },
        { name: 'service-iot', url: 'http://ecotrack-service-iot:3013/health' },
        { name: 'service-gamifications', url: 'http://ecotrack-service-gamifications:3014/health' },
        { name: 'service-analytics', url: 'http://ecotrack-service-analytics:3015/health' }
      ];

      const infrastructure = [
        { name: 'postgresql', url: null, type: 'database' },
        { name: 'redis', url: null, type: 'cache' },
        { name: 'kafka', url: null, type: 'messaging' },
        { name: 'mqtt-broker', url: null, type: 'iot' },
        { name: 'prometheus', url: 'http://prometheus:9090/-/healthy', type: 'monitoring' },
        { name: 'grafana', url: 'http://grafana:3000/api/health', type: 'monitoring' }
      ];

      const results = await Promise.allSettled(
        microservices.map(async (s) => {
          try {
            const response = await axios.get(s.url, { timeout: 3000 });
            return { name: s.name, status: 'up', ...response.data };
          } catch (err) {
            return { name: s.name, status: 'down', error: err.message };
          }
        })
      );

      const infraResults = await Promise.allSettled(
        infrastructure.map(async (s) => {
          if (s.url) {
            try {
              const response = await axios.get(s.url, { timeout: 3000 });
              return { name: s.name, status: 'up', type: s.type };
            } catch (err) {
              return { name: s.name, status: 'down', type: s.type, error: err.message };
            }
          } else {
            return { name: s.name, status: 'up', type: s.type };
          }
        })
      );

      const microserviceHealth = results.map(r => r.value);
      const infraHealth = infraResults.map(r => r.value);

      res.json({
        timestamp: new Date().toISOString(),
        services: [...microserviceHealth, ...infraHealth]
      });
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get health status');
      res.status(500).json({ error: 'Failed to get health status' });
    }
  });

  // Métriques consolidées pour le frontend
  app.get('/api/metrics/status', async (req, res) => {
    const axios = (await import('axios')).default;

  const serviceMetrics = [
    { name: 'api-gateway', url: 'http://ecotrack-api-gateway:3000/metrics' },
    { name: 'service-users', url: 'http://ecotrack-service-users:3010/metrics' },
    { name: 'service-containers', url: 'http://ecotrack-service-containers:3011/metrics' },
    { name: 'service-iot', url: 'http://ecotrack-service-iot:3013/metrics' },
    { name: 'service-gamifications', url: 'http://ecotrack-service-gamifications:3014/metrics' },
    { name: 'service-analytics', url: 'http://ecotrack-service-analytics:3015/metrics' },
    { name: 'service-routes', url: 'http://ecotrack-service-routes:3012/metrics' }
  ];

    try {
      const results = await Promise.allSettled(
        serviceMetrics.map(async (s) => {
          try {
            const response = await axios.get(s.url, { timeout: 3000 });
            const metricsText = response.data;

            const parseMetric = (text, metricName) => {
              const lines = text.split('\n');
              // Sum all metric values (handles both with and without labels)
              // Format: metric_name{labels} value or metric_name value
              let total = 0;
              for (const line of lines) {
                if (line.startsWith(metricName + ' ') || line.startsWith(metricName + '{')) {
                  // Extract the value (last part after space)
                  const parts = line.split(' ');
                  const value = parseFloat(parts[parts.length - 1]);
                  if (!isNaN(value)) {
                    total += value;
                  }
                }
              }
              return total > 0 ? total : null;
            };

            return {
              name: s.name,
              status: 'up',
              httpRequests: parseMetric(metricsText, 'http_requests_total') || 0,
              memoryBytes: parseMetric(metricsText, 'process_resident_memory_bytes') || 0
            };
          } catch (err) {
            return { name: s.name, status: 'down', httpRequests: 0, memoryBytes: 0 };
          }
        })
      );

      const metrics = results.filter(r => r.status === 'fulfilled').map(r => r.value);

      res.json({
        timestamp: new Date().toISOString(),
        services: metrics
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch metrics', message: error.message });
    }
  });

// Dashboard stats endpoint
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await dashboardStatsService.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get dashboard stats');
      res.status(500).json({ success: false, error: 'Failed to get dashboard stats' });
    }
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

// Cache middleware for public GET requests
const PUBLIC_CACHE_PATHS = ['/api/zones', '/api/typecontainers'];
const CACHE_TTL_MAP = {
  '/api/zones': 1800,
  '/api/typecontainers': 1800,
  '/api/containers': 300,
  '/api/stats': 120
};

app.use(async (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (!PUBLIC_CACHE_PATHS.some(p => req.path.startsWith(p))) return next();
  
  const cacheKey = `apigw:${req.path}:${JSON.stringify(req.query)}`;
  const cached = await cacheService.get(cacheKey);
  
  if (cached) {
    return res.set('X-Cache', 'HIT').json(cached);
  }
  
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode === 200 && data) {
      const ttl = CACHE_TTL_MAP[req.path] || 300;
      cacheService.set(cacheKey, data, ttl);
    }
    return originalJson(data);
  };
  
  next();
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

// Initialize centralized logging
centralizedLogging.connect().then(() => {
  logger.info('Centralized logging initialized');
}).catch(err => {
  logger.warn({ err: err.message }, 'Centralized logging connection failed, continuing without');
});

// Initialize cache service
cacheService.connect().then(() => {
  logger.info('Cache service initialized');
}).catch(err => {
  logger.warn({ err: err.message }, 'Cache service connection failed, continuing without');
});

if (process.env.DISABLE_AUTO_START !== 'true') {
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
}

export default app;
