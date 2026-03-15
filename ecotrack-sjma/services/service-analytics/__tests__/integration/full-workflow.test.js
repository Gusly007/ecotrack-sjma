const request = require('supertest');
const app = require('../../src/index');

describe('Complete Analytics Workflow', () => {
  let authToken;
  let containerId;
  let reportFileName;

  beforeAll(async () => {
    // Mock authentication
    authToken = 'Bearer test_token';
    containerId = 1;
  });

  describe('1. Data Aggregation', () => {
    it('should fetch aggregated data', async () => {
      const res = await request(app)
        .get('/api/analytics/aggregations?period=week')
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('global');
    });
  });

  describe('2. Dashboard', () => {
    it('should load complete dashboard', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard?period=week')
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('realTime');
      expect(res.body.data).toHaveProperty('insights');
    });

    it('should get real-time stats', async () => {
      const res = await request(app)
        .get('/api/analytics/realtime')
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.data).toHaveProperty('kpis');
    });
  });

  describe('3. Reports', () => {
    it('should generate PDF report', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', authToken)
        .send({ format: 'pdf', reportType: 'weekly' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('fileName');
      reportFileName = res.body.data.fileName;
    });

    it('should generate Excel report', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', authToken)
        .send({ format: 'excel', reportType: 'monthly' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('4. ML Predictions', () => {
    it('should predict fill level', async () => {
      const res = await request(app)
        .post('/api/analytics/ml/predict')
        .set('Authorization', authToken)
        .send({ containerId, daysAhead: 1 })
        .expect(200);

      expect(res.body.success).toBe(true);
      if (res.body.data) {
        expect(res.body.data).toHaveProperty('predictedFillLevel');
      }
    });

    it('should predict critical containers', async () => {
      const res = await request(app)
        .get('/api/analytics/ml/predict-critical?daysAhead=1')
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.predictions).toBeInstanceOf(Array);
    });

    it('should detect anomalies', async () => {
      const res = await request(app)
        .get(`/api/analytics/ml/anomalies/${containerId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('5. Performance Tests', () => {
    it('should respond within acceptable time', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', authToken)
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill().map(() =>
        request(app)
          .get('/api/analytics/realtime')
          .set('Authorization', authToken)
      );

      const responses = await Promise.all(requests);
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });
});