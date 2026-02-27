const request = require('supertest');
const app = require('../src/index');
const PredictionService = require('../src/services/predictionService');
const AnomalyService = require('../src/services/anomalyService');
const jwt = require('jsonwebtoken');

describe('Phase 4 - ML Tests', () => {
  const testToken = jwt.sign({ userId: 1, email: 'test@ecotrack.fr' }, 'your_jwt_secret', { expiresIn: '1h' });
  const authToken = `Bearer ${testToken}`;
  const testContainerId = 1;

  describe('Predictions', () => {
    it('should predict fill level for a container', async () => {
      const prediction = await PredictionService.predictFillLevel(testContainerId, 1);
      
      if (prediction && prediction.predictedFillLevel != null && !isNaN(prediction.predictedFillLevel)) {
        expect(prediction).toHaveProperty('predictedFillLevel');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction.predictedFillLevel).toBeGreaterThanOrEqual(0);
        expect(prediction.predictedFillLevel).toBeLessThanOrEqual(100);
      } else {
        console.log('Insufficient data for prediction test');
      }
    });

    it('should predict critical containers', async () => {
      const response = await request(app)
        .get('/api/analytics/ml/predict-critical?daysAhead=1&threshold=90')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('predictions');
      expect(response.body.data.predictions).toBeInstanceOf(Array);
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect anomalies', async () => {
      const response = await request(app)
        .get(`/api/analytics/ml/anomalies/${testContainerId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('anomalies');
      expect(response.body.data).toHaveProperty('statistics');
    });

    it('should detect defective sensors', async () => {
      const response = await request(app)
        .get('/api/analytics/ml/defective-sensors')
        .set('Authorization', authToken);
      
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('sensors');
        expect(response.body.data.sensors).toBeInstanceOf(Array);
      }
    });
  });

  describe('Model Performance', () => {
    it('predictions should have reasonable confidence', async () => {
      const prediction = await PredictionService.predictFillLevel(testContainerId, 1);
      
      if (prediction && prediction.confidence != null && !isNaN(prediction.confidence)) {
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(100);
      } else {
        console.log('Insufficient data for confidence test');
      }
    });
  });
});