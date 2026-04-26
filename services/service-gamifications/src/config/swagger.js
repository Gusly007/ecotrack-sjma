// Rôle du fichier : configuration Swagger pour exposer la doc des routes.
import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'EcoTrack - Service Gamification',
    version: '1.0.0',
    description: 'Points, badges, défis et notifications de gamification'
  },
  servers: [
    {
      url: 'http://localhost:3014',
      description: 'Serveur local'
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js']
};

export default swaggerJSDoc(options);
