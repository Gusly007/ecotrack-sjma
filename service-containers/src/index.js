const express = require('express');
const app = express();

app.use(express.json());
// Routes conteneurs
const routes = require('../routes/container.route.js');
app.use('/api', routes);

// Routes zones
const zoneRoutes = require('../routes/zone.route.js');
app.use('/api', zoneRoutes);
app.use((error, req, res, next) => {
    const status = error.status || 400;
    const message = error.message || 'Erreur serveur';
    res.status(status).json({ error: message });
});



//swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Service Conteneurs API',
      version: '1.0.0',
        description: 'API pour la gestion des conteneurs',
        contact: {
            name: 'Support',
            email: 'jngusly@gmail.com',
        },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Serveur local',
      },
    ],
  },
  // Chemins des fichiers contenant les annotations Swagger
  apis: ['../routes/*.js'],
};
const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));