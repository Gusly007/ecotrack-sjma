const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Utilitaires
const errorHandler = require('./src/middleware/errorHandler');
const requestLogger = require('./src/middleware/requestLogger');
const config = require('./src/config/config');

const app = express();

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging des requêtes
app.use(requestLogger);

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Compression
app.use(express.json({ limit: '10mb' }));

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
        url: 'http://localhost:3000/api',
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
  apis: ['./routes/*.js', './src/controllers/*.js']
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
      types: '/api/types-conteneurs'
    }
  });
});

// Container routes
const containerRoutes = require('./routes/container.route.js');
app.use('/api', containerRoutes);

// Zone routes
const zoneRoutes = require('./routes/zone.route.js');
app.use('/api', zoneRoutes);

// Signalement routes
const signalementRoutes = require('./routes/signalement.route.js');
app.use('/api', signalementRoutes);

// Type Container routes
const typeContainerRoutes = require('./routes/typecontainer.route.js');
app.use('/api/typecontainers', typeContainerRoutes);

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
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
app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  🚀 EcoTrack Containers API                        ║
║  📍 http://localhost:${port}/api                  ║
║  📚 Documentation: http://localhost:${port}/api-docs ║
║  🔧 Environnement: ${config.NODE_ENV}                     ║
╚════════════════════════════════════════════════════╝
  `);
});

module.exports = app;