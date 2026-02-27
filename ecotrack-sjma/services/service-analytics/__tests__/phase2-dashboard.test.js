const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/index');

describe('Phase 2 - Dashboard Tests', () => {
  const testToken = jwt.sign(
    { id_utilisateur: 1, role: 'admin' },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '1h' }
  );
  const authToken = `Bearer ${testToken}`;

  describe('Dashboard Endpoint', () => {
    it('should return complete dashboard data', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard?period=week')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('realTime');
      expect(response.body.data).toHaveProperty('evolution');
      expect(response.body.data).toHaveProperty('heatmap');
      expect(response.body.data).toHaveProperty('insights');
      expect(response.body.data).toHaveProperty('chartData');
    });

    it('should return real-time stats', async () => {
      const response = await request(app)
        .get('/api/analytics/realtime')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data).toHaveProperty('kpis');
      expect(response.body.data).toHaveProperty('criticalContainers');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should return heatmap GeoJSON', async () => {
      const response = await request(app)
        .get('/api/analytics/heatmap')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data.type).toBe('FeatureCollection');
      expect(response.body.data.features).toBeInstanceOf(Array);
    });

    it('should return evolution data with chart format', async () => {
      const response = await request(app)
        .get('/api/analytics/evolution?days=7')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data).toHaveProperty('evolution');
      expect(response.body.data).toHaveProperty('chartData');
      expect(response.body.data.chartData).toHaveProperty('labels');
      expect(response.body.data.chartData).toHaveProperty('datasets');
    });
  });

  describe('Insights Generation', () => {
    it('should generate relevant insights', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', authToken)
        .expect(200);

      const insights = response.body.data.insights;
      expect(insights).toBeInstanceOf(Array);
      
      insights.forEach(insight => {
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('category');
        expect(insight).toHaveProperty('message');
        expect(insight).toHaveProperty('action');
      });
    });
  });

  describe('Performance', () => {
    it('dashboard should respond within 1 second', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', authToken)
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});