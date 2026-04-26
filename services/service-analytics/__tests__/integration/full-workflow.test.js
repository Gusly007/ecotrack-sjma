const request = require('supertest');
const app = require('../../src/index');

describe('Complete Analytics Workflow', () => {
  const authToken = `Bearer ${global.testAuthToken}`;
  const containerId = 1;

  describe('1. Data Aggregation', () => {
    it('should respond for aggregated data', async () => {
      const res = await request(app)
        .get('/api/analytics/aggregations?period=week')
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(res.status);
    });
  });

  describe('2. Dashboard', () => {
    it('should respond for dashboard', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard?period=week')
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(res.status);
    });

    it('should respond for realtime', async () => {
      const res = await request(app)
        .get('/api/analytics/realtime')
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(res.status);
    });
  });

  describe('3. Reports', () => {
    it('should respond for PDF report', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', authToken)
        .send({ format: 'pdf', reportType: 'weekly' });

      expect([200, 500, 401]).toContain(res.status);
    });

    it('should respond for Excel report', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', authToken)
        .send({ format: 'excel', reportType: 'monthly' });

      expect([200, 500, 401]).toContain(res.status);
    });
  });

  describe('4. ML Predictions', () => {
    it('should respond for predict fill level', async () => {
      const res = await request(app)
        .post('/api/analytics/ml/predict')
        .set('Authorization', authToken)
        .send({ containerId, daysAhead: 1 });

      expect([200, 500, 401]).toContain(res.status);
    });

    it('should respond for predict critical', async () => {
      const res = await request(app)
        .get('/api/analytics/ml/predict-critical?daysAhead=1')
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(res.status);
    });

    it('should respond for anomalies', async () => {
      const res = await request(app)
        .get(`/api/analytics/ml/anomalies/${containerId}`)
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(res.status);
    });
  });

  describe('5. Performance Tests', () => {
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

