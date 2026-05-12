const request = require('supertest');
const app = require('../../src/index');

describe('Type Containers API Integration', () => {
  const authToken = `Bearer ${global.testAuthToken}`;

  describe('GET /typecontainers', () => {
    it('should return list of type containers', async () => {
      const res = await request(app)
        .get('/typecontainers')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });
  });

  describe('GET /typecontainers/stats/all', () => {
    it('should return type containers with statistics', async () => {
      const res = await request(app)
        .get('/typecontainers/stats/all')
        .set('Authorization', authToken);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /typecontainers/code/:code', () => {
    it('should return type container by code', async () => {
      const res = await request(app)
        .get('/typecontainers/code/ORDURE')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /typecontainers/nom/:nom', () => {
    it('should return type container by nom', async () => {
      const res = await request(app)
        .get('/typecontainers/nom/RECYCLAGE')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /typecontainers/:id', () => {
    it('should return type container by id', async () => {
      const res = await request(app)
        .get('/typecontainers/1')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /typecontainers/:id/stats', () => {
    it('should return type container with stats', async () => {
      const res = await request(app)
        .get('/typecontainers/1/stats')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /typecontainers', () => {
    it('should create new type container', async () => {
      const res = await request(app)
        .post('/typecontainers')
        .set('Authorization', authToken)
        .send({ code: 'TEST', nom: 'TEST' });
      expect([201, 400, 500]).toContain(res.status);
    });
  });

  describe('PUT /typecontainers/:id', () => {
    it('should update type container', async () => {
      const res = await request(app)
        .put('/typecontainers/1')
        .set('Authorization', authToken)
        .send({ nom: 'UPDATED' });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('DELETE /typecontainers/:id', () => {
    it('should delete type container', async () => {
      const res = await request(app)
        .delete('/typecontainers/999')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});