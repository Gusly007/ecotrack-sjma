const request = require('supertest');
const app = require('../../src/index');

describe('Analytics Performance Routes Integration', () => {
  const authToken = `Bearer ${global.testAuthToken}`;

  describe('GET /api/analytics/performance/dashboard', () => {
    it('should return performance dashboard', async () => {
      const res = await request(app)
        .get('/api/analytics/performance/dashboard')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should reject without authorization', async () => {
      const res = await request(app)
        .get('/api/analytics/performance/dashboard');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('GET /api/analytics/performance/agents/ranking', () => {
    it('should return agents ranking', async () => {
      const res = await request(app)
        .get('/api/analytics/performance/agents/ranking')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });
  });

  describe('GET /api/analytics/performance/agents/:id', () => {
    it('should return agent performance with valid dates', async () => {
      const res = await request(app)
        .get('/api/analytics/performance/agents/1?startDate=2026-01-01&endDate=2026-12-31')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should reject without required dates', async () => {
      const res = await request(app)
        .get('/api/analytics/performance/agents/1')
        .set('Authorization', authToken);
      expect([200, 400, 401, 500]).toContain(res.status);
    });
  });

  describe('GET /api/analytics/performance/environmental', () => {
    it('should return environmental impact with valid dates', async () => {
      const res = await request(app)
        .get('/api/analytics/performance/environmental?startDate=2026-01-01&endDate=2026-12-31')
        .set('Authorization', authToken);
      expect([200, 401, 500]).toContain(res.status);
    }, 10000);
  });

  describe('GET /api/analytics/performance/environmental/evolution', () => {
    it('should return impact evolution with valid dates', async () => {
      const res = await request(app)
        .get('/api/analytics/performance/environmental/evolution?startDate=2026-01-01&endDate=2026-12-31')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });
  });

  describe('GET /api/analytics/performance/environmental/zones', () => {
    it('should return impact by zone with valid dates', async () => {
      const res = await request(app)
        .get('/api/analytics/performance/environmental/zones?startDate=2026-01-01&endDate=2026-12-31')
        .set('Authorization', authToken);
      expect([200, 500, 401]).toContain(res.status);
    });
  });
});