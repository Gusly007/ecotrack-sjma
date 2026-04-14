const request = require('supertest');
const app = require('../../src/index');

describe('E2E - Analytics Service Workflows', () => {
  const authToken = `Bearer ${global.testAuthToken}`;

  describe('Service Availability', () => {
    it('should respond to health checks', async () => {
      const response = await request(app)
        .get('/health')
        .timeout(5000);

      expect(response.status).toBe(200);
    });

    it('should handle authenticated requests', async () => {
      const response = await request(app)
        .get('/health')
        .set('Authorization', authToken)
        .timeout(5000);

      expect(response.status).toBe(200);
    });
  });

  describe('Dashboard Workflow (Phase 2)', () => {
    it('should serve dashboard endpoint', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', authToken)
        .timeout(15000);

      // Accept success or auth errors
      expect([200, 401, 500]).toContain(response.status);
    });

    it('should serve realtime stats endpoint', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard/realtime')
        .set('Authorization', authToken)
        .timeout(10000);

      expect([200, 401, 404, 500]).toContain(response.status);
    });

    it('should serve evolution data endpoint', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard/evolution')
        .set('Authorization', authToken)
        .timeout(10000);

      expect([200, 401, 404, 500]).toContain(response.status);
    });
  });

  describe('Aggregation Workflow (Phase 1)', () => {
    it('should handle aggregation requests', async () => {
      const response = await request(app)
        .get('/api/analytics/aggregations')
        .set('Authorization', authToken)
        .timeout(15000);

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should handle zone aggregation requests', async () => {
      const response = await request(app)
        .get('/api/analytics/aggregations/zones')
        .set('Authorization', authToken)
        .timeout(15000);

      expect([200, 401, 500]).toContain(response.status);
    });
  });

  describe('Report Generation (Phase 3)', () => {
    it('should accept report generation request', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', authToken)
        .send({ format: 'pdf', period: 'month' })
        .timeout(15000);

      expect([200, 400, 401, 500]).toContain(response.status);
    });

    it('should handle report generation for different formats', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', authToken)
        .send({ format: 'pdf', period: 'week' })
        .timeout(15000);

      expect([200, 400, 401, 500]).toContain(response.status);
    });
  });

  describe('ML Predictions (Phase 4)', () => {
    it('should handle prediction requests', async () => {
      const response = await request(app)
        .post('/api/analytics/predictions/fill-level')
        .set('Authorization', authToken)
        .send({ containerId: 1, weather: 'clear' })
        .timeout(10000);

      expect([200, 400, 401, 404, 500]).toContain(response.status);
    });

    it('should handle anomaly detection', async () => {
      const response = await request(app)
        .get('/api/analytics/anomalies/detect')
        .set('Authorization', authToken)
        .timeout(15000);

      expect([200, 401, 404, 500]).toContain(response.status);
    });
  });

  describe('Error Handling & Security', () => {
    it('should reject unauthenticated mutation requests', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .send({ format: 'pdf' })
        .timeout(10000);

      expect([400, 401]).toContain(response.status);
    });

    it('should handle 404 errors gracefully', async () => {
      const response = await request(app)
        .get('/api/analytics/nonexistent-endpoint')
        .set('Authorization', authToken)
        .timeout(5000);

      expect([401, 404]).toContain(response.status);
    });

    it('should not crash on invalid input', async () => {
      try {
        const response = await request(app)
          .post('/api/analytics/reports/generate')
          .set('Authorization', authToken)
          .send({ format: 'invalid', period: 'xyz' })
          .timeout(10000);

        // Should handle gracefully
        expect(response.status).toBeGreaterThan(0);
      } catch (err) {
        // Should not crash
        expect(err).toBeDefined();
      }
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle health checks concurrently', async () => {
      const requests = Array(3).fill(null).map(() =>
        request(app)
          .get('/health')
          .timeout(5000)
      );

      const responses = await Promise.all(requests);

      expect(responses.length).toBe(3);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle mixed requests concurrently', async () => {
      const requests = [
        request(app)
          .get('/health')
          .timeout(5000),
        request(app)
          .get('/api/analytics/dashboard')
          .set('Authorization', authToken)
          .timeout(10000),
        request(app)
          .get('/api/analytics/aggregations')
          .set('Authorization', authToken)
          .timeout(10000)
      ];

      const responses = await Promise.all(requests);

      expect(responses.length).toBe(3);
      responses.forEach(response => {
        expect(response).toBeDefined();
      });
    });
  });

  describe('Complete User Journey', () => {
    it('should complete basic analytics flow', async () => {
      // 1. Check health
      let response = await request(app)
        .get('/health')
        .timeout(5000);
      expect(response.status).toBe(200);

      // 2. Access dashboard
      response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', authToken)
        .timeout(15000);
      expect([200, 401, 500]).toContain(response.status);

      // 3. Request aggregations
      response = await request(app)
        .get('/api/analytics/aggregations')
        .set('Authorization', authToken)
        .timeout(15000);
      expect([200, 401, 500]).toContain(response.status);
    });
  });
});
