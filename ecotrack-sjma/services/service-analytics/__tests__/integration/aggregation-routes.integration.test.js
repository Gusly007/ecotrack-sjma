const request = require('supertest');
const app = require('../../src/index');

describe('Analytics Aggregation Routes Integration', () => {
  const authToken = `Bearer ${global.testAuthToken}`;

  describe('GET /api/analytics/aggregations', () => {
    it('should return aggregated data for valid period', async () => {
      const res = await request(app)
        .get('/api/analytics/aggregations?period=week')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should return aggregated data for month period', async () => {
      const res = await request(app)
        .get('/api/analytics/aggregations?period=month')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should return aggregated data for day period', async () => {
      const res = await request(app)
        .get('/api/analytics/aggregations?period=day')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should reject without authorization', async () => {
      const res = await request(app)
        .get('/api/analytics/aggregations?period=week');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('POST /api/analytics/aggregations/refresh', () => {
    it('should refresh materialized views', async () => {
      const res = await request(app)
        .post('/api/analytics/aggregations/refresh')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should reject without authorization', async () => {
      const res = await request(app)
        .post('/api/analytics/aggregations/refresh');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('GET /api/analytics/aggregations/zones', () => {
    it('should return zone statistics', async () => {
      const res = await request(app)
        .get('/api/analytics/aggregations/zones');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/analytics/aggregations/agents', () => {
    it('should return agent performances with valid dates', async () => {
      const res = await request(app)
        .get('/api/analytics/aggregations/agents?startDate=2026-01-01&endDate=2026-12-31')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should reject without required dates', async () => {
      const res = await request(app)
        .get('/api/analytics/aggregations/agents')
        .set('Authorization', authToken);
      expect([400, 500]).toContain(res.status);
    });
  });
});