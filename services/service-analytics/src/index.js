const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const logger = require('./utils/logger');
const client = require('prom-client');
const { generalLimiter, reportLimiter, mlLimiter } = require('./middleware/rateLimitMiddleware');
const { errorHandler } = require('./middleware/errorHandler');
const centralizedLogging = require('./services/centralizedLogging');
const kafkaConsumer = require('../kafkaConsumer');

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

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoTrack Analytics API',
      version: '1.0.0',
      description: 'Service Analytics - Données agrégées et statistiques',
    },
    servers: [
      {
        url: 'http://localhost:3015',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const app = express();
const PORT = process.env.PORT || 3015;
const isTestEnv = process.env.NODE_ENV === 'test';

// Create HTTP server for WebSocket
const httpServer = require('http').createServer(app);

// Setup WebSocket
const WebSocketService = require('./services/websocketService');
let wsService = null;

// Parse JSON bodies
app.use(express.json());

// Apply rate limiting
app.use(generalLimiter);

const aggregationRoutes = require('./routes/aggregationRoutes');
const { setupCronJobs } = require('./config/cron');

// Middleware to track HTTP metrics
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
      service: 'service-analytics',
      message: `${req.method} ${req.path} - ${res.statusCode}`,
      metadata: { route, duration, statusCode: res.statusCode },
      userId: req.user?.id || req.headers['x-user-id'],
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => {});
  });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

const attachKafkaHandlers = () => {
  kafkaConsumer.onSensorData(async (data, meta) => {
    logger.info({ topic: meta.topic, containerId: data?.id_conteneur }, 'Kafka sensor data received');
    if (wsService) {
      wsService.emitContainerUpdate(data?.id_conteneur, { type: 'sensor', data, meta });
    }
  });

  kafkaConsumer.onAlert(async (alert, meta) => {
    logger.warn({ topic: meta.topic, alertId: alert?.id_alerte }, 'Kafka alert received');
    if (wsService) {
      wsService.emitAlert(alert);
    }
  });

  kafkaConsumer.onContainerStatus(async (payload, meta) => {
    logger.info({ topic: meta.topic, containerId: payload?.containerId, status: payload?.status }, 'Kafka container status received');
    if (wsService) {
      wsService.emitContainerUpdate(payload?.containerId, { type: 'status', data: payload, meta });
    }
  });
};

const startRuntimeServices = () => {
  setupCronJobs();
  wsService = new WebSocketService(httpServer);

  const ReportService = require('./services/reportService');
  const SchedulerService = require('./services/schedulerService');
  const reportService = new ReportService();
  const scheduler = new SchedulerService(reportService);
  scheduler.setupSchedules();

  attachKafkaHandlers();
  kafkaConsumer.connect().catch(err => {
    logger.warn({ err: err.message }, 'Kafka consumer startup failed, continuing without');
  });

  if (typeof centralizedLogging.connect === 'function') {
    centralizedLogging.connect().then(() => {
      logger.info('Centralized logging initialized');
    }).catch(err => {
      logger.warn({ err: err.message }, 'Centralized logging connection failed, continuing without');
    });
  }
};

const startServer = () => {
  if (isTestEnv) return null;
  return httpServer.listen(PORT, () => {
    logger.info(' Analytics Service running on port ' + PORT);
    startRuntimeServices();
  });
};

// Routes
app.use('/api/analytics', aggregationRoutes);

const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/analytics', dashboardRoutes);

const dashboardAnalyticsRoutes = require('./routes/dashboardAnalyticsRoutes');
app.use('/api/analytics', dashboardAnalyticsRoutes);

const performanceRoutes = require('./routes/performanceRoutes');
app.use('/api/analytics', performanceRoutes);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// Static files for reports
app.use('/reports', express.static(path.join(__dirname, '../..', process.env.REPORTS_DIR || './reports')));

// Report routes
const reportRoutes = require('./routes/reportRoutes');
app.use('/api/analytics', reportRoutes);

// Monitoring metrics routes
const metricsRoutes = require('./routes/metrics');
app.use('/api/metrics', metricsRoutes);

// ML/Prediction routes
const mlRoutes = require('./routes/mlRoutes');
app.use('/api/analytics', mlRoutes);

const stopServer = async () => {
  await kafkaConsumer.disconnect();
  return new Promise((resolve) => {
    if (httpServer.listening) {
      httpServer.close(() => resolve());
    } else {
      resolve();
    }
  });
};

if (!isTestEnv) {
  startServer();

  process.on('SIGINT', async () => {
    logger.info('Shutting down analytics service');
    await stopServer();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Shutting down analytics service (SIGTERM)');
    await stopServer();
    process.exit(0);
  });
}

module.exports = app;
module.exports.startServer = startServer;
module.exports.stopServer = stopServer;