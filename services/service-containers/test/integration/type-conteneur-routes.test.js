/**
 * Tests Intégration - Type Conteneur Routes
 * Tests des routes API des types de conteneurs
 */

const request = require('supertest');
const express = require('express');
const typeRoute = require('../../src/routes/typecontainer.route');

describe('Type Conteneur Routes - Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/types', typeRoute);
    
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        error: err.message
      });
    });
  });

  describe('GET /api/types', () => {
    it('devrait récupérer tous les types de conteneurs', async () => {
      const response = await request(app)
        .get('/api/types')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/types/:code', () => {
    it('devrait récupérer un type par son code', async () => {
      const response = await request(app)
        .get('/api/types/OM')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('code');
    });

    it('devrait retourner 404 pour un code inexistant', async () => {
      await request(app)
        .get('/api/types/INVALID')
        .expect(404);
    });
  });

  describe('GET /api/types/stats/all', () => {
    it('devrait récupérer tous les types avec statistiques', async () => {
      const response = await request(app)
        .get('/api/types/stats/all')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('nb_conteneurs');
      }
    });
  });
});
