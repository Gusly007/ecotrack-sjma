import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoTrack Service Users API',
      version: '1.0.0',
      description: 'API pour authentification et gestion des utilisateurs',
      contact: {
        name: 'Support EcoTrack',
        email: 'support@ecotrack.com'
      },
      license: {
        name: 'MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3010',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.ecotrack.com',
        description: 'Serveur de production'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
