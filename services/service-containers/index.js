const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const http = require('http');
require('dotenv').config();
const logger = require('./src/utils/logger');

// Socket.IO
const SocketService = require('./src/socket/socket-service');

// Utilitaires
const errorHandler = require('./src/middleware/error-handler');
const requestLogger = require('./src/middleware/request-logger');
const config = require('./src/config/config');

const app = express();
const server = http.createServer(app);

// ========== SOCKET.IO INITIALIZATION ==========
const socketService = new SocketService(server);
app.locals.socketService = socketService;

// ========== MIDDLEWARE ==========
// Sécurité HTTP headers avec Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé pour Swagger UI
  crossOriginEmbedderPolicy: false
}));

// JSON parsing avec limite de taille
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes (avant les routes)
app.use(requestLogger);

// CORS
app.use(cors());

// Socket.IO middleware (injecter le socketService pour toutes les routes)
const socketMiddleware = require('./src/middleware/socket-middleware');
app.use(socketMiddleware);

// ========== DOCUMENTATION API ==========
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoTrack Containers API',
      version: '1.0.0',
      description: 'API professionnelle pour la gestion des conteneurs écologiques'
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api`,
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
            details: { type: 'object' },
            timestamp: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            data: { type: 'object' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ========== ROUTES ==========
// API root
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur EcoTrack Containers API',
    version: '1.0.0',
    endpoints: {
      documentation: '/api-docs',
      health: '/health',
      containers: '/api/containers',
      zones: '/api/zones',
      types: '/api/types-conteneurs',
      stats: '/api/stats' 
    }
  });
});

// Container routes
const containerRoutes = require('./src/routes/container.route.js');
app.use('/api', containerRoutes);

// Zone routes
const zoneRoutes = require('./src/routes/zone.route.js');
app.use('/api', zoneRoutes);

// Type Container routes
const typeContainerRoutes = require('./src/routes/typecontainer.route.js');
app.use('/api/typecontainers', typeContainerRoutes);
// Stats routes
const statsRoutes = require('./src/routes/stats.route.js');
app.use('/api/stats', statsRoutes);
// ========== HEALTH CHECK ==========
app.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    services: {
      api: 'healthy',
      socketio: socketService ? 'healthy' : 'unavailable',
      database: 'unknown'
    }
  };

  // Test connexion base de données
  try {
    const { pool } = require('./src/db/connexion');
    await pool.query('SELECT 1');
    healthcheck.services.database = 'healthy';
  } catch (error) {
    healthcheck.status = 'DEGRADED';
    healthcheck.services.database = 'unhealthy';
  }

  const statusCode = healthcheck.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthcheck);
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

// ========== GESTION DES ERREURS ==========
app.use(errorHandler);

// ========== DÉMARRAGE DU SERVEUR ==========
const port = config.PORT;
server.listen(port, () => {
  logger.info({ port }, 'EcoTrack Containers API ready');
  logger.info({ url: `http://localhost:${port}/api` }, 'API base URL');
  logger.info({ url: `http://localhost:${port}/api-docs` }, 'Swagger docs ready');
  logger.info({ env: config.NODE_ENV }, 'Environment');
  logger.info({ url: `ws://localhost:${port}` }, 'Socket endpoint');
});

module.exports = app;