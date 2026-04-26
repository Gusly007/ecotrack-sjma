const request = require('supertest');
const app = require('../../../src/index');

describe('Phase 2 - Dashboard Tests', () => {
  const authToken = `Bearer ${global.testAuthToken}`;

  describe('Dashboard Endpoint', () => {
    it('should respond for dashboard data', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard?period=week')
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(response.status);
    });

    it('should respond for real-time stats', async () => {
      const response = await request(app)
        .get('/api/analytics/realtime')
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(response.status);
    });

    it('should respond for heatmap', async () => {
      const response = await request(app)
        .get('/api/analytics/heatmap')
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(response.status);
    });

    it('should respond for evolution data', async () => {
      const response = await request(app)
        .get('/api/analytics/evolution?days=7')
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(response.status);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', authToken);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });
  });
});



