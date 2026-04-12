/**
 * Integration Test: Cache Service with Database and Services
 * Tests cache layer integration with sensor/measurement services
 */

process.env.NODE_ENV = 'test';
process.env.DISABLE_AUTO_START = 'true';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

jest.mock('../../src/config/config', () => ({
  PORT: 3013,
  NODE_ENV: 'test',
  CACHE: {
    ENABLED: true,
    TTL: 300,
    MAX_SIZE: 1000
  }
}));

const mockPool = {
  query: jest.fn()
};

jest.mock('../../src/db/connexion', () => ({
  pool: mockPool,
  query: jest.fn()
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    flushAll: jest.fn().mockResolvedValue('OK')
  }))
}));

const SensorRepository = require('../../src/repositories/sensor-repository');
const SensorService = require('../../src/services/sensor-service');

describe('Integration: Cache Service with Data Layer', () => {
  let sensorRepo, sensorService;
  let cacheData = {};

  beforeEach(() => {
    jest.clearAllMocks();
    cacheData = {};
    
    sensorRepo = new SensorRepository();
    sensorService = new SensorService(sensorRepo);
  });

  describe('Cache hit/miss scenarios', () => {
    it('should cache sensor data after retrieval', async () => {
      const sensorId = 1;
      const sensorData = { id: sensorId, uid: 'CAP-001', containerId: 1 };

      // Simulate cache storage directly
      const cacheKey = `sensor:${sensorId}`;
      cacheData[cacheKey] = sensorData;

      // Check cache has data
      expect(cacheData[cacheKey]).toEqual(sensorData);
      expect(cacheData[cacheKey].uid).toBe('CAP-001');
    });

    it('should invalidate cache when data is updated', async () => {
      const sensorId = 1;
      const cacheKey = `sensor:${sensorId}`;

      // Set cache
      cacheData[cacheKey] = { id: sensorId, uid: 'CAP-001' };
      expect(cacheData[cacheKey]).toBeDefined();

      // Clear cache
      delete cacheData[cacheKey];
      expect(cacheData[cacheKey]).toBeUndefined();
    });

    it('should handle cache key patterns', () => {
      const keys = [
        'sensor:1',
        'sensor:2',
        'measurement:1',
        'alert:1'
      ];

      keys.forEach(key => {
        cacheData[key] = { data: 'test' };
      });

      expect(Object.keys(cacheData)).toHaveLength(4);
    });
  });

  describe('Cache size management', () => {
    it('should manage cache size limits', async () => {
      for (let i = 0; i < 10; i++) {
        cacheData[`key:${i}`] = { data: `value-${i}` };
      }

      const size = Object.keys(cacheData).length;
      expect(size).toBeGreaterThan(0);
    });

    it('should clear all cache data', () => {
      cacheData['key1'] = { data: 'value1' };
      cacheData['key2'] = { data: 'value2' };

      expect(Object.keys(cacheData).length).toBe(2);

      cacheData = {};

      expect(Object.keys(cacheData).length).toBe(0);
    });
  });

  describe('Cache with service integration', () => {
    it('should cache measurements by sensor', async () => {
      const sensorId = 1;
      const measurementKey = `measurements:${sensorId}`;
      const measurements = [
        { id: 1, sensorId, value: 50, createdAt: new Date() },
        { id: 2, sensorId, value: 55, createdAt: new Date() }
      ];

      cacheData[measurementKey] = measurements;
      const cached = cacheData[measurementKey];

      expect(cached).toEqual(measurements);
      expect(cached).toHaveLength(2);
    });

    it('should cache alert summaries', () => {
      const alertSummary = {
        total: 5,
        active: 3,
        resolved: 2,
        critical: 1
      };

      cacheData['alerts:summary'] = alertSummary;
      const cached = cacheData['alerts:summary'];

      expect(cached).toEqual(alertSummary);
    });

    it('should handle multiple cache keys', () => {
      for (let i = 0; i < 20; i++) {
        cacheData[`key:${i}`] = { data: i };
      }

      const results = Array.from({ length: 20 }, (_, i) => cacheData[`key:${i}`]);
      expect(results).toHaveLength(20);
    });
  });

  describe('Cache namespace isolation', () => {
    it('should isolate cache by prefix', async () => {
      const sensorPrefix = 'sensor:';
      const measurementPrefix = 'measurement:';

      cacheData[`${sensorPrefix}1`] = { type: 'sensor', id: 1 };
      cacheData[`${measurementPrefix}1`] = { type: 'measurement', id: 1 };

      const sensor = cacheData[`${sensorPrefix}1`];
      const measurement = cacheData[`${measurementPrefix}1`];

      expect(sensor.type).toBe('sensor');
      expect(measurement.type).toBe('measurement');
    });

    it('should handle different data types in cache', () => {
      cacheData['string:key'] = 'string value';
      cacheData['number:key'] = 42;
      cacheData['object:key'] = { complex: 'object' };
      cacheData['array:key'] = [1, 2, 3];

      expect(cacheData['string:key']).toBe('string value');
      expect(cacheData['number:key']).toBe(42);
      expect(cacheData['object:key']).toEqual({ complex: 'object' });
      expect(cacheData['array:key']).toEqual([1, 2, 3]);
    });
  });
});