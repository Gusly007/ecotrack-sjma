const request = require('supertest');
const app = require('../src/index');
const AggregationRepository = require('../src/repositories/aggregationRepository');

describe('Phase 1 - Aggregations Tests', () => {
  describe('Materialized Views', () => {
    it('should create materialized views', async () => {
      const result = await AggregationRepository.createMaterializedViews();
      expect(result.success).toBe(true);
    });

    it('should refresh materialized views', async () => {
      const result = await AggregationRepository.refreshMaterializedViews();
      expect(result.success).toBe(true);
      expect(result.refreshedAt).toBeDefined();
    });
  });

  describe('Aggregation Endpoints', () => {
    it('should fetch all aggregations', async () => {
      const response = await request(app)
        .get('/api/analytics/aggregations?period=month')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('global');
      expect(response.body.data).toHaveProperty('zones');
      expect(response.body.data).toHaveProperty('agents');
    });

    it('should fetch zone aggregations', async () => {
      const response = await request(app)
        .get('/api/analytics/aggregations/zones')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should fetch agent performances', async () => {
      const startDate = '2026-01-01';
      const endDate = '2026-02-28';

      const response = await request(app)
        .get(`/api/analytics/aggregations/agents?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Data Quality', () => {
    it('should return valid daily aggregations', async () => {
      const data = await AggregationRepository.getDailyAggregations(7);
      
      expect(data).toBeInstanceOf(Array);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('date');
        expect(data[0]).toHaveProperty('avg_fill_level');
        expect(data[0]).toHaveProperty('critical_count');
      }
    });

    it('should calculate zone statistics correctly', async () => {
      const zones = await AggregationRepository.getZoneAggregations();
      
      zones.forEach(zone => {
        expect(zone.containers_count).toBeGreaterThanOrEqual(0);
        if (zone.avg_fill_level !== null) {
          expect(zone.avg_fill_level).toBeGreaterThanOrEqual(0);
          expect(zone.avg_fill_level).toBeLessThanOrEqual(100);
        }
      });
    });
  });
});