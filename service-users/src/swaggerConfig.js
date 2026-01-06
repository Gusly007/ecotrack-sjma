import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      version: '1.0.0',
      description: 'API for user authentication and management',
    },
    servers: [
      {
        url: 'http://localhost:3010', // Adaptez le port si nécessaire
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Chemin vers les fichiers de routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
