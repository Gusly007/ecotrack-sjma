const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoTrack Containers API',
      version: '1.0.0',
      description: 'API pour la gestion des conteneurs écologiques'
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const routes = require('./routes/route');
app.use('/api', routes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));