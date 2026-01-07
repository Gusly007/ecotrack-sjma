const express = require('express');
const app = express();

app.use(express.json());
const routes = require('./src/route');
app.use('/api', routes);



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
  apis: ['./service-containers/routes/*.js'],
};
const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));