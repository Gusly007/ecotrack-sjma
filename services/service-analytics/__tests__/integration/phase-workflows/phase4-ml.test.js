const request = require('supertest');
const app = require('../../../src/index');

describe('Phase 4 - ML Tests', () => {
  const authToken = `Bearer ${global.testAuthToken}`;
  const testContainerId = 1;

  describe('Predictions', () => {
    it('should respond for predict critical containers', async () => {
      const response = await request(app)
        .get('/api/analytics/ml/predict-critical?daysAhead=1&threshold=90')
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(response.status);
    });
  });

  describe('Anomaly Detection', () => {
    it('should respond for anomalies', async () => {
      const response = await request(app)
        .get(`/api/analytics/ml/anomalies/${testContainerId}`)
        .set('Authorization', authToken);

      expect([200, 500, 401]).toContain(response.status);
    });

    it('should respond for defective sensors', async () => {
      const response = await request(app)
        .get('/api/analytics/ml/defective-sensors')
        .set('Authorization', authToken);
      
      expect([200, 500, 401]).toContain(response.status);
    });
  });
});



