const request = require('supertest');
const app = require('../src/index');
const AggregationModel = require('../src/repositories/aggregationRepository');

describe('Phase 1 - Aggregations Tests', () => {
  describe('Materialized Views', () => {
    it('should create materialized views', async () => {
      const result = await AggregationModel.createMaterializedViews();
      expect(result.success).toBe(true);
    });

    it('should refresh materialized views', async () => {
      const result = await AggregationModel.refreshMaterializedViews();
      expect(result.success).toBe(true);
      expect(result.refreshedAt).toBeDefined();
    });
  });

  describe('Aggregation Endpoints', () => {
    let authToken = 'Bearer test_token'; // Remplacer par un vrai token

    it('should fetch all aggregations', async () => {
      const response = await request(app)
        .get('/api/analytics/aggregations?period=month')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('global');
      expect(response.body.data).toHaveProperty('zones');
      expect(response.body.data).toHaveProperty('agents');
    });

    it('should fetch zone aggregations', async () => {
      const response = await request(app)
        .get('/api/analytics/aggregations/zones')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should fetch agent performances', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';

      const response = await request(app)
        .get(`/api/analytics/aggregations/agents?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Data Quality', () => {
    it('should return valid daily aggregations', async () => {
      const data = await AggregationModel.getDailyAggregations(7);
      
      expect(data).toBeInstanceOf(Array);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('date');
        expect(data[0]).toHaveProperty('avg_fill_level');
        expect(data[0]).toHaveProperty('critical_count');
      }
    });

    it('should calculate zone statistics correctly', async () => {
      const zones = await AggregationModel.getZoneAggregations();
      
      zones.forEach(zone => {
        expect(zone.containers_count).toBeGreaterThanOrEqual(0);
        expect(zone.avg_fill_level).toBeGreaterThanOrEqual(0);
        expect(zone.avg_fill_level).toBeLessThanOrEqual(100);
      });
    });
  });
});