/**
 * Tests Intégration - Container Routes
 * Tests des routes API avec mocking du service
 */

const request = require('supertest');
const express = require('express');
const ContainerController = require('../../src/controllers/container-controller');

describe('Container Routes - Integration Tests', () => {
  let app;
  let mockService;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mock du middleware socket
    app.use((req, res, next) => {
      req.socketService = null;
      next();
    });
    
    // Créer un mock du service
    mockService = {
      createContainer: jest.fn(),
      getContainerById: jest.fn(),
      getContainerByUid: jest.fn(),
      getAllContainers: jest.fn(),
      getContainersByStatus: jest.fn(),
      getContainersByZone: jest.fn(),
      getContainersInRadius: jest.fn(),
      updateContainer: jest.fn(),
      updateStatus: jest.fn(),
      deleteContainer: jest.fn(),
      deleteAllContainers: jest.fn(),
      countContainers: jest.fn(),
      existContainer: jest.fn(),
      existByUid: jest.fn(),
      getStatistics: jest.fn(),
      getHistoriqueStatut: jest.fn(),
      countHistoriqueStatut: jest.fn()
    };
    
    const controller = new ContainerController(mockService);
    
    // Créer un mini-router pour les tests
    const router = require('express').Router();
    router.post('/', controller.create);
    router.get('/', controller.getAll);
    router.get('/id/:id', controller.getById);
    router.get('/uid/:uid', controller.getByUid);
    router.patch('/:id/status', controller.updateStatus);
    router.delete('/:id', controller.delete);
    router.get('/:id/status/history', controller.getStatusHistory);
    
    app.use('/api/containers', router);
    
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
        statut: 'ACTIF',
        latitude: 48.8566,
        longitude: 2.3522,
        id_zone: 1,
        id_type: 1
      };

      const mockResult = {
        id_conteneur: 1,
        uid: 'CNT-ABC123XYZ456',
        ...newContainer
      };

      mockService.createContainer.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/containers')
        .send(newContainer)
        .expect(201);

      expect(response.body).toHaveProperty('id_conteneur');
      expect(mockService.createContainer).toHaveBeenCalledWith(newContainer);
    });

    it('devrait rejeter un conteneur avec données invalides', async () => {
      const invalidContainer = {
        capacite_l: -100, // Capacité négative invalide
        statut: 'ACTIF'
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
        id_conteneur: 1,
        uid: 'CNT-ABC123XYZ456',
        capacite_l: 100,
        statut: 'ACTIF'
      };

      mockService.getContainerById.mockResolvedValue(mockContainer);

      const response = await request(app)
        .get('/api/containers/id/1')
        .expect(200);

      expect(response.body).toEqual(mockContainer);
      expect(mockService.getContainerById).toHaveBeenCalledWith('1');
    });

    it('devrait retourner 404 si conteneur non trouvé', async () => {
      mockService.getContainerById.mockResolvedValue(null);

      await request(app)
        .get('/api/containers/id/999')
        .expect(404);
    });
  });

  describe('PATCH /api/containers/:id/status', () => {
    it('devrait mettre à jour le statut d\'un conteneur', async () => {
      const mockResult = {
        changed: true,
        id_conteneur: 1,
        statut: 'EN_MAINTENANCE',
        ancien_statut: 'ACTIF'
      };

      mockService.updateStatus.mockResolvedValue(mockResult);

      const response = await request(app)
        .patch('/api/containers/1/status')
        .send({ statut: 'EN_MAINTENANCE' })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(mockService.updateStatus).toHaveBeenCalledWith('1', 'EN_MAINTENANCE');
    });
  });

  describe('GET /api/containers', () => {
    it('devrait récupérer tous les conteneurs avec pagination', async () => {
      const mockContainers = [
        { id_conteneur: 1, capacite_l: 100 },
        { id_conteneur: 2, capacite_l: 150 }
      ];

      mockService.getAllContainers.mockResolvedValue(mockContainers);

      const response = await request(app)
        .get('/api/containers')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toEqual(mockContainers);
    });

    it('devrait filtrer par statut', async () => {
      mockService.getAllContainers.mockResolvedValue([]);

      await request(app)
        .get('/api/containers')
        .query({ statut: 'ACTIF' })
        .expect(200);
    });

    it('devrait filtrer par zone', async () => {
      mockService.getAllContainers.mockResolvedValue([]);

      await request(app)
        .get('/api/containers')
        .query({ id_zone: 1 })
        .expect(200);
    });
  });

  describe('DELETE /api/containers/:id', () => {
    it('devrait supprimer un conteneur', async () => {
      mockService.deleteContainer.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/containers/1')
        .expect(200);

      expect(response.body.message).toContain('supprimé');
      expect(mockService.deleteContainer).toHaveBeenCalledWith('1');
    });

    it('devrait retourner 404 si conteneur non trouvé', async () => {
      mockService.deleteContainer.mockResolvedValue(false);

      await request(app)
        .delete('/api/containers/999')
        .expect(404);
    });
  });

  describe('GET /api/containers/:id/status/history', () => {
    it('devrait récupérer l\'historique des statuts', async () => {
      const mockHistory = [
        { id_historique: 1, ancien_statut: 'ACTIF', nouveau_statut: 'EN_MAINTENANCE', date_changement: '2026-02-05' },
        { id_historique: 2, ancien_statut: 'EN_MAINTENANCE', nouveau_statut: 'ACTIF', date_changement: '2026-02-04' }
      ];

      mockService.getHistoriqueStatut.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/containers/1/status/history')
        .expect(200);

      expect(response.body).toEqual(mockHistory);
      expect(mockService.getHistoriqueStatut).toHaveBeenCalledWith('1', {});
    });
  });
});
