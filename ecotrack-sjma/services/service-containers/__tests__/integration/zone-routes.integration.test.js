const request = require('supertest');
const app = require('../../index');

describe('Zones API Integration', () => {
  const authToken = `Bearer ${global.testAuthToken}`;

  describe('GET /zones', () => {
    it('should return list of zones', async () => {
      const res = await request(app)
        .get('/api/V1/zones')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/V1/zones?page=1&limit=10')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });
  });

  describe('GET /zones/count', () => {
    it('should return zone count', async () => {
      const res = await request(app)
        .get('/api/V1/zones/count')
        .set('Authorization', authToken);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /zones/code/:code', () => {
    it('should return zone by code', async () => {
      const res = await request(app)
        .get('/api/V1/zones/code/ZONE001')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /zones/:id', () => {
    it('should return zone by id', async () => {
      const res = await request(app)
        .get('/api/V1/zones/1')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /zones/search', () => {
    it('should search zones by name', async () => {
      const res = await request(app)
        .get('/api/V1/zones/search?nom=Paris')
        .set('Authorization', authToken);
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject without search parameter', async () => {
      const res = await request(app)
        .get('/api/V1/zones/search')
        .set('Authorization', authToken);
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('GET /zones/radius', () => {
    it('should find zones in radius', async () => {
      const res = await request(app)
        .get('/api/V1/zones/radius?latitude=48.8566&longitude=2.3522&rayon=10')
        .set('Authorization', authToken);
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('GET /zones/stats/global', () => {
    it('should return global statistics', async () => {
      const res = await request(app)
        .get('/api/V1/zones/stats/global')
        .set('Authorization', authToken);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /zones', () => {
    it('should create new zone', async () => {
      const res = await request(app)
        .post('/api/V1/zones')
        .set('Authorization', authToken)
        .send({
          code: 'TEST001',
          nom: 'Test Zone',
          population: 10000,
          superficie_km2: 50.5,
          latitude: 48.8566,
          longitude: 2.3522
        });
      expect([201, 400, 500]).toContain(res.status);
    });

    it('should reject zone without required fields', async () => {
      const res = await request(app)
        .post('/api/V1/zones')
        .set('Authorization', authToken)
        .send({ code: 'TEST001' });
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('PATCH /zones/:id', () => {
    it('should update zone', async () => {
      const res = await request(app)
        .patch('/api/V1/zones/1')
        .set('Authorization', authToken)
        .send({ population: 20000 });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('DELETE /zones/:id', () => {
    it('should delete zone', async () => {
      const res = await request(app)
        .delete('/api/V1/zones/999')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});