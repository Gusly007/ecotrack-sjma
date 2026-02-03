/**
 * Tests Intégration - Zone Routes
 * Tests des routes API des zones
 */

const request = require('supertest');
const express = require('express');
const zoneRoute = require('../../src/routes/zone.route');

describe('Zone Routes - Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/zones', zoneRoute);
    
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        error: err.message
      });
    });
  });

  describe('POST /api/zones', () => {
    it('devrait créer une nouvelle zone', async () => {
      const newZone = {
        nom: 'Zone Test',
        type: 'Résidentielle',
        code_postal: '75001'
      };

      const response = await request(app)
        .post('/api/zones')
        .send(newZone)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('devrait rejeter une zone sans nom', async () => {
      const invalidZone = {
        type: 'Résidentielle'
      };

      await request(app)
        .post('/api/zones')
        .send(invalidZone)
        .expect(400);
    });
  });

  describe('GET /api/zones', () => {
    it('devrait récupérer toutes les zones', async () => {
      const response = await request(app)
        .get('/api/zones')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/zones/:id', () => {
    it('devrait récupérer une zone par ID', async () => {
      const response = await request(app)
        .get('/api/zones/1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('devrait retourner 404 pour une zone inexistante', async () => {
      await request(app)
        .get('/api/zones/9999')
        .expect(404);
    });
  });

  describe('PUT /api/zones/:id', () => {
    it('devrait mettre à jour une zone', async () => {
      const updateData = {
        nom: 'Zone Modifiée',
        type: 'Commerciale'
      };

      const response = await request(app)
        .put('/api/zones/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/zones/:id', () => {
    it('devrait supprimer une zone', async () => {
      const response = await request(app)
        .delete('/api/zones/1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/zones/:id/containers', () => {
    it('devrait récupérer une zone avec ses conteneurs', async () => {
      const response = await request(app)
        .get('/api/zones/1/containers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('containers');
    });
  });
});
