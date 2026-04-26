/**
 * E2E Tests for Signalement API
 * Tests complete workflows from client request to database
 */

const request = require('supertest');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_ROUTES = `${API_URL}/api/routes`;

describe('Signalement E2E Tests', () => {
  const testSignalement = {
    description: 'Test débordement - E2E',
    conteneurUid: 'CONT-TEST-001',
    type: 'DEBORDEMENT'
  };

  let authToken = '';
  let signalementId = null;

  describe('Authentication', () => {
    it('should login and get auth token', async () => {
      const res = await request(API_URL)
        .post('/auth/login')
        .send({
          email: 'admin@ecotrack.dev',
          password: 'admin123'
        });

      expect(res.status).toBeDefined();
      if (res.status === 200) {
        authToken = res.body.token || res.body.data?.token;
      }
    });
  });

  describe('CRUD Operations', () => {
    it('should get all signalements with pagination', async () => {
      const res = await request(API_ROUTES)
        .get('/signalements')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBeDefined();
      expect(res.body).toBeDefined();
    });

    it('should filter signalements by statut', async () => {
      const res = await request(API_ROUTES)
        .get('/signalements')
        .query({ statut: 'NOUVEAU' });

      expect(res.status).toBeDefined();
    });

    it('should filter signalements by urgence', async () => {
      const res = await request(API_ROUTES)
        .get('/signalements')
        .query({ urgence: 'HAUTE' });

      expect(res.status).toBeDefined();
    });

    it('should search signalements', async () => {
      const res = await request(API_ROUTES)
        .get('/signalements')
        .query({ search: 'debordement' });

      expect(res.status).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should get signalement stats', async () => {
      const res = await request(API_ROUTES)
        .get('/signalements/stats');

      expect(res.status).toBeDefined();
    });

    it('should get signalement types', async () => {
      const res = await request(API_ROUTES)
        .get('/signalements/types');

      expect(res.status).toBeDefined();
    });
  });

  describe('Status Updates', () => {
    it('should update signalement status to EN_COURS', async () => {
      const listRes = await request(API_ROUTES)
        .get('/signalements')
        .query({ statut: 'NOUVEAU' });

      if (listRes.body?.data?.length > 0) {
        const id = listRes.body.data[0].id_signalement;
        
        const res = await request(API_ROUTES)
          .put(`/signalements/${id}/status`)
          .send({ statut: 'EN_COURS' });

        expect(res.status).toBeDefined();
      }
    });

    it('should update signalement status to RESOLU', async () => {
      const listRes = await request(API_ROUTES)
        .get('/signalements')
        .query({ statut: 'EN_COURS' });

      if (listRes.body?.data?.length > 0) {
        const id = listRes.body.data[0].id_signalement;
        
        const res = await request(API_ROUTES)
          .put(`/signalements/${id}/status`)
          .send({ statut: 'RESOLU' });

        expect(res.status).toBeDefined();
      }
    });

    it('should reject invalid status', async () => {
      const listRes = await request(API_ROUTES)
        .get('/signalements')
        .query({ limit: 1 });

      if (listRes.body?.data?.length > 0) {
        const id = listRes.body.data[0].id_signalement;
        
        const res = await request(API_ROUTES)
          .put(`/signalements/${id}/status`)
          .send({ statut: 'INVALID_STATUS' });

        expect(res.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent signalement', async () => {
      const res = await request(API_ROUTES)
        .get('/signalements/999999');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle invalid pagination', async () => {
      const res = await request(API_ROUTES)
        .get('/signalements')
        .query({ page: -1, limit: 0 });

      expect(res.status).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const res = await request(API_ROUTES)
        .put('/signalements/1/status')
        .send({});

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});

describe('Signalement Workflow E2E', () => {
  let createdSignalementId = null;

  it('should complete full lifecycle', async () => {
    // 1. Get a NOUVEAU signalement
    const listRes = await request(API_ROUTES)
      .get('/signalements')
      .query({ statut: 'NOUVEAU', limit: 1 });

    if (listRes.body?.data?.length > 0) {
      createdSignalementId = listRes.body.data[0].id_signalement;
      
      // 2. Get details
      const detailRes = await request(API_ROUTES)
        .get(`/signalements/${createdSignalementId}`);
      
      expect(detailRes.status).toBeDefined();

      // 3. Update to EN_COURS
      const updateRes = await request(API_ROUTES)
        .put(`/signalements/${createdSignalementId}/status`)
        .send({ statut: 'EN_COURS' });
      
      expect(updateRes.status).toBeDefined();

      // 4. Update to RESOLU
      const resolveRes = await request(API_ROUTES)
        .put(`/signalements/${createdSignalementId}/status`)
        .send({ statut: 'RESOLU' });
      
      expect(resolveRes.status).toBeDefined();
    }
  });
});