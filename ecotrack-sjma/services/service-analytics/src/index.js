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
app.use((err, req, res, next) => {
  logger.error('Error: ' + err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

httpServer.listen(PORT, () => {
  logger.info(' Analytics Service running on port ' + PORT);
  setupCronJobs();
  
  // Initialize WebSocket
  wsService = new WebSocketService(httpServer);
  
  // Setup report scheduler
  const ReportService = require('./services/reportService');
  const SchedulerService = require('./services/schedulerService');
  const reportService = new ReportService();
  const scheduler = new SchedulerService(reportService);
  scheduler.setupSchedules();
});

// Routes
app.use('/api/analytics', aggregationRoutes);

const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/analytics', dashboardRoutes);

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


module.exports = app;