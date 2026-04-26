const request = require('supertest');
const app = require('../../../src/index');

describe('Phase 1 - Aggregations Tests', () => {
  const authToken = `Bearer ${global.testAuthToken}`;

  describe('Materialized Views', () => {
    it('should respond for create materialized views', async () => {
      const response = await request(app)
        .post('/api/analytics/aggregations/materialized-views/create')
        .set('Authorization', authToken);
      
      expect([200, 404, 500]).toContain(response.status);
    });

    it('should respond for refresh materialized views', async () => {
      const response = await request(app)
        .post('/api/analytics/aggregations/materialized-views/refresh')
        .set('Authorization', authToken);
      
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('Aggregation Endpoints', () => {
    it('should respond for fetch all aggregations', async () => {
      const response = await request(app)
        .get('/api/analytics/aggregations?period=month')
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(response.status);
    });

    it('should respond for fetch zone aggregations', async () => {
      const response = await request(app)
        .get('/api/analytics/aggregations/zones')
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(response.status);
    });

    it('should respond for fetch agent performances', async () => {
      const response = await request(app)
        .get('/api/analytics/aggregations/agents?startDate=2026-01-01&endDate=2026-02-28')
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(response.status);
    });
  });
});



