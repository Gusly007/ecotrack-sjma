/**
 * Tests Intégration - Container Routes
 * Tests des routes API avec base de données de test
 */

const request = require('supertest');
const express = require('express');
const containerRoute = require('../../src/routes/container.route');

// Mock de la base de données pour les tests
const mockDb = {
  query: jest.fn()
};

describe('Container Routes - Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mock du middleware socket
    app.use((req, res, next) => {
      req.socketService = null;
      next();
    });
    
    app.use('/api/containers', containerRoute);
    
    // Error handler
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        error: err.message
      });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/containers', () => {
    it('devrait créer un nouveau conteneur', async () => {
      const newContainer = {
        capacite_l: 100,
        statut: 'Vide',
        latitude: 48.8566,
        longitude: 2.3522,
        id_zone: 1,
        code_type: 'OM'
      };

      const mockResult = {
        rows: [{ id: 1, ...newContainer }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/containers')
        .send(newContainer)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('devrait rejeter un conteneur avec données invalides', async () => {
      const invalidContainer = {
        capacite_l: -100, // Capacité négative invalide
        statut: 'Vide'
      };

      await request(app)
        .post('/api/containers')
        .send(invalidContainer)
        .expect(400);
    });
  });

  describe('GET /api/containers/:id', () => {
    it('devrait récupérer un conteneur par ID', async () => {
      const mockContainer = {
        id: 1,
        capacite_l: 100,
        statut: 'Vide'
      };

      mockDb.query.mockResolvedValue({ rows: [mockContainer] });

      const response = await request(app)
        .get('/api/containers/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(mockContainer);
    });

    it('devrait retourner 404 si conteneur non trouvé', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/containers/999')
        .expect(404);
    });
  });

  describe('PATCH /api/containers/:id/status', () => {
    it('devrait mettre à jour le statut d\'un conteneur', async () => {
      const mockResult = {
        changed: true,
        container: { id: 1, statut: 'Plein' }
      };

      mockDb.query.mockResolvedValue({ rows: [mockResult] });

      const response = await request(app)
        .patch('/api/containers/1/status')
        .send({ statut: 'Plein' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.changed).toBe(true);
    });

    it('devrait rejeter un statut invalide', async () => {
      await request(app)
        .patch('/api/containers/1/status')
        .send({ statut: 'InvalidStatus' })
        .expect(400);
    });
  });

  describe('GET /api/containers', () => {
    it('devrait récupérer tous les conteneurs avec pagination', async () => {
      const mockContainers = [
        { id: 1, capacite_l: 100 },
        { id: 2, capacite_l: 150 }
      ];

      mockDb.query.mockResolvedValue({ rows: mockContainers });

      const response = await request(app)
        .get('/api/containers')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('devrait filtrer par statut', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/containers')
        .query({ statut: 'Plein' })
        .expect(200);
    });

    it('devrait filtrer par zone', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/containers')
        .query({ id_zone: 1 })
        .expect(200);
    });
  });

  describe('GET /api/containers/zone/:id', () => {
    it('devrait récupérer les conteneurs d\'une zone', async () => {
      const mockContainers = [
        { id: 1, id_zone: 1 },
        { id: 2, id_zone: 1 }
      ];

      mockDb.query.mockResolvedValue({ rows: mockContainers });

      const response = await request(app)
        .get('/api/containers/zone/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('DELETE /api/containers/:id', () => {
    it('devrait supprimer un conteneur', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ success: true }] });

      const response = await request(app)
        .delete('/api/containers/1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/containers/:id/history', () => {
    it('devrait récupérer l\'historique des statuts', async () => {
      const mockHistory = [
        { statut: 'Vide', date: '2024-01-01' },
        { statut: 'Plein', date: '2024-01-02' }
      ];

      mockDb.query.mockResolvedValue({ rows: mockHistory });

      const response = await request(app)
        .get('/api/containers/1/history')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });
});
