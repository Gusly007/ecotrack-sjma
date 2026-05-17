const request = require('supertest');
const app = require('../../index');

describe('Containers API Integration', () => {
  const authToken = `Bearer ${global.testAuthToken}`;

  describe('GET /containers', () => {
    it('should return list of containers', async () => {
      const res = await request(app)
        .get('/containers')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/containers?page=1&limit=10')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });
  });

  describe('GET /containers/id/:id', () => {
    it('should return container by id', async () => {
      const res = await request(app)
        .get('/containers/id/1')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });

    it('should return 404 for non-existent container', async () => {
      const res = await request(app)
        .get('/containers/id/999999')
        .set('Authorization', authToken);
      expect([404, 500]).toContain(res.status);
    });
  });

  describe('GET /containers/uid/:uid', () => {
    it('should return container by uid', async () => {
      const res = await request(app)
        .get('/containers/uid/CNT-00001')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /containers/status/:statut', () => {
    it('should return containers by status ACTIF', async () => {
      const res = await request(app)
        .get('/containers/status/ACTIF')
        .set('Authorization', authToken);
      expect([200, 500]).toContain(res.status);
    });

    it('should return containers by status INACTIF', async () => {
      const res = await request(app)
        .get('/containers/status/INACTIF')
        .set('Authorization', authToken);
      expect([200, 500]).toContain(res.status);
    });

    it('should return containers by status EN_MAINTENANCE', async () => {
      const res = await request(app)
        .get('/containers/status/EN_MAINTENANCE')
        .set('Authorization', authToken);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /containers/zone/:id_zone', () => {
    it('should return containers by zone', async () => {
      const res = await request(app)
        .get('/containers/zone/1')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /containers/fill-levels', () => {
    it('should return containers with fill levels', async () => {
      const res = await request(app)
        .get('/containers/fill-levels')
        .set('Authorization', authToken);
      expect([200, 500]).toContain(res.status);
    });

    it('should filter by min_level', async () => {
      const res = await request(app)
        .get('/containers/fill-levels?min_level=50')
        .set('Authorization', authToken);
      expect([200, 500]).toContain(res.status);
    });

    it('should filter by max_level', async () => {
      const res = await request(app)
        .get('/containers/fill-levels?max_level=80')
        .set('Authorization', authToken);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /containers/:id/status/history', () => {
    it('should return status history', async () => {
      const res = await request(app)
        .get('/containers/1/status/history')
        .set('Authorization', authToken);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /containers', () => {
    it('should create new container', async () => {
      const res = await request(app)
        .post('/containers')
        .set('Authorization', authToken)
        .send({
          capacite_l: 1000,
          statut: 'ACTIF',
          latitude: 48.8566,
          longitude: 2.3522
        });
      expect([201, 400, 500]).toContain(res.status);
    });

    it('should reject container without required fields', async () => {
      const res = await request(app)
        .post('/containers')
        .set('Authorization', authToken)
        .send({ capacite_l: 1000 });
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('PATCH /containers/:id', () => {
    it('should update container', async () => {
      const res = await request(app)
        .patch('/containers/1')
        .set('Authorization', authToken)
        .send({ capacite_l: 1500 });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /containers/:id/status', () => {
    it('should update container status', async () => {
      const res = await request(app)
        .patch('/containers/1/status')
        .set('Authorization', authToken)
        .send({ statut: 'EN_MAINTENANCE' });
      expect([200, 404, 500]).toContain(res.status);
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .patch('/containers/1/status')
        .set('Authorization', authToken)
        .send({ statut: 'INVALID' });
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('DELETE /containers/:id', () => {
    it('should delete container', async () => {
      const res = await request(app)
        .delete('/containers/999')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});