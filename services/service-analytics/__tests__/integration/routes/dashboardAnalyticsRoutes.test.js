jest.mock('node-fetch', () => jest.fn());

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../../src/middleware/cacheMiddleware', () => ({
  cacheMiddleware: jest.fn(() => (req, res, next) => next()),
  clearCache: jest.fn()
}));

jest.mock('../../../src/services/predictionService', () => ({
  predictCriticalContainers: jest.fn()
}));

jest.mock('../../../src/services/anomalyService', () => ({
  detectDefectiveSensors: jest.fn()
}));

jest.mock('../../../src/services/performanceService', () => ({
  getCompleteDashboard: jest.fn()
}));

jest.mock('../../../src/services/environmentalConstantsService', () => ({
  clearCache: jest.fn(),
  getEnvironmentalConstants: jest.fn()
}));

jest.mock('../../../src/repositories/dashboardAnalyticsRepository', () => ({
  getKpiBaseStats: jest.fn(),
  getActiveAlertsCount: jest.fn(),
  getCriticalContainersCount: jest.fn(),
  getFillTrends: jest.fn(),
  getZonePerformance: jest.fn(),
  getCriticalContainers: jest.fn(),
  getTypeDistribution: jest.fn(),
  getCollecteSummary: jest.fn(),
  getCollecteDaily: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const fetch = require('node-fetch');
const logger = require('../../../src/utils/logger');
const { clearCache } = require('../../../src/middleware/cacheMiddleware');
const PredictionService = require('../../../src/services/predictionService');
const AnomalyService = require('../../../src/services/anomalyService');
const PerformanceService = require('../../../src/services/performanceService');
const EnvironmentalConstantsService = require('../../../src/services/environmentalConstantsService');
const DashboardAnalyticsRepository = require('../../../src/repositories/dashboardAnalyticsRepository');

const dashboardAnalyticsRouter = require('../../../src/routes/dashboardAnalyticsRoutes');

function buildApp() {
  const app = express();
  app.use('/api/analytics', dashboardAnalyticsRouter);
  return app;
}

describe('dashboardAnalyticsRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('weather-impact maps weather codes and falls back on errors', async () => {
    fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        current_weather: {
          weathercode: 45,
          temperature: 11,
          windspeed: 8
        }
      })
    });

    const successRes = await request(buildApp()).get('/api/analytics/weather-impact');

    expect(successRes.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          condition: 'Brouillard',
          weatherIcon: 'fa-smog',
          impact: -10,
          prediction: 'Neutre'
        })
      })
    );

    fetch.mockRejectedValueOnce(new Error('weather down'));

    const fallbackRes = await request(buildApp()).get('/api/analytics/weather-impact');

    expect(logger.error).toHaveBeenCalledWith('Error fetching weather:', expect.any(Error));
    expect(fallbackRes.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          condition: 'Données indisponibles',
          weatherIcon: 'fa-cloud'
        })
      })
    );
  });

  test('kpis returns computed metrics and default fallback payload', async () => {
    DashboardAnalyticsRepository.getKpiBaseStats.mockResolvedValueOnce({
      active_containers: '10',
      total_measurements: '25',
      avg_fill_level: '60',
      avg_battery: '81.5'
    });
    DashboardAnalyticsRepository.getActiveAlertsCount.mockResolvedValueOnce({ active_alerts: '2' });
    DashboardAnalyticsRepository.getCriticalContainersCount.mockResolvedValueOnce({ count: '3' });
    PerformanceService.getCompleteDashboard.mockResolvedValueOnce({
      environmental: {
        distance: { reductionPct: 14 },
        co2: { reductionPct: 22, saved: 12.34 },
        routes: { completed: 3, total: 4 }
      }
    });

    const successRes = await request(buildApp()).get('/api/analytics/kpis');

    expect(successRes.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          efficiency: 95,
          satisfaction: 97,
          collectionRate: 14,
          recyclingRate: 22,
          co2Saved: '12.34',
          optimizedRoutes: 75
        })
      })
    );

    DashboardAnalyticsRepository.getKpiBaseStats.mockRejectedValueOnce(new Error('db fail'));

    const fallbackRes = await request(buildApp()).get('/api/analytics/kpis');

    expect(logger.error).toHaveBeenCalledWith('Error fetching KPIs:', 'db fail');
    expect(fallbackRes.status).toBe(200);
    expect(fallbackRes.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          efficiency: 0,
          co2Saved: '0',
          optimizedRoutes: 0
        })
      })
    );
  });

  test('aggregation routes map repository rows to API payloads', async () => {
    DashboardAnalyticsRepository.getFillTrends.mockResolvedValueOnce([
      { date: '2026-04-01', avgfilllevel: '55.25', measurementcount: '10', avgbattery: '81.1' }
    ]);
    DashboardAnalyticsRepository.getZonePerformance.mockResolvedValueOnce([
      { id: '2', name: 'Zone B', code: 'ZB', containercount: '7', fillrate: '61.7', avgbattery: '79.2', measurementcount: '15' }
    ]);

    const fillRes = await request(buildApp()).get('/api/analytics/aggregation/fill-trends?days=14');
    const zoneRes = await request(buildApp()).get('/api/analytics/aggregation/zone-performance');

    expect(DashboardAnalyticsRepository.getFillTrends).toHaveBeenCalledWith(14);
    expect(fillRes.body).toEqual(
      expect.objectContaining({
        success: true,
        data: { trends: [{ date: '2026-04-01', avgFillLevel: 55.25, measurementCount: 10, avgBattery: 81.1 }] }
      })
    );
    expect(zoneRes.body).toEqual(
      expect.objectContaining({
        success: true,
        data: { zones: [{ id: 2, name: 'Zone B', code: 'ZB', containerCount: 7, fillRate: 61.7, avgBattery: 79.2, measurementCount: 15 }] }
      })
    );
  });

  test('critical container and type distribution routes normalize fields', async () => {
    DashboardAnalyticsRepository.getCriticalContainers.mockResolvedValueOnce([
      { id_conteneur: 1, uid: 'C1', filllevel: '95', battery: '12', lastupdate: '2026-04-01', type: 'Glass', zone: 'North' },
      { id_conteneur: 2, uid: 'C2', filllevel: '85', battery: '22', lastupdate: '2026-04-01', type: 'Plastic', zone: null }
    ]);
    DashboardAnalyticsRepository.getTypeDistribution.mockResolvedValueOnce([
      { id_type: 9, type: 'Metal', code: 'MT', containercount: '4', avgfillrate: '66.4', avgbattery: '71.2' }
    ]);

    const criticalRes = await request(buildApp()).get('/api/analytics/critical-containers?threshold=80&limit=5');
    const typeRes = await request(buildApp()).get('/api/analytics/type-distribution');

    expect(DashboardAnalyticsRepository.getCriticalContainers).toHaveBeenCalledWith(80, 5);
    expect(criticalRes.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          threshold: 80,
          count: 2,
          containers: [
            expect.objectContaining({ status: 'critical', zone: 'North' }),
            expect.objectContaining({ status: 'warning', zone: 'Non assignée' })
          ]
        })
      })
    );
    expect(typeRes.body).toEqual(
      expect.objectContaining({
        success: true,
        data: { types: [{ id: 9, type: 'Metal', code: 'MT', containerCount: 4, avgFillRate: 66.4, avgBattery: 71.2 }] }
      })
    );
  });

  test('collecte stats and ml predictions normalize data', async () => {
    DashboardAnalyticsRepository.getCollecteSummary.mockResolvedValueOnce({
      totalcollections: '8',
      totalkg: '45.5',
      avgkg: '5.6',
      maxkg: '11.2',
      minkg: '1.3'
    });
    DashboardAnalyticsRepository.getCollecteDaily.mockResolvedValueOnce([
      { date: '2026-04-01', collections: '3', totalkg: '18.5' }
    ]);
    PredictionService.predictCriticalContainers.mockResolvedValueOnce(
      Array.from({ length: 22 }, (_, index) => ({
        id_conteneur: index + 1,
        uid: `U${index + 1}`,
        currentFillLevel: 40 + index,
        predictedFillLevel: 50 + index,
        confidence: 0.9,
        daysAhead: 2,
        modelVersion: 'v1'
      }))
    );

    const collecteRes = await request(buildApp()).get('/api/analytics/collecte-stats?days=21');
    const predictionRes = await request(buildApp()).get('/api/analytics/ml/predictions?daysAhead=2&threshold=55');

    expect(DashboardAnalyticsRepository.getCollecteSummary).toHaveBeenCalledWith(21);
    expect(collecteRes.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          summary: expect.objectContaining({ totalCollections: 8, totalKg: 45.5 }),
          daily: [{ date: '2026-04-01', collections: 3, totalKg: 18.5 }]
        })
      })
    );
    expect(predictionRes.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          count: 22,
          daysAhead: 2,
          threshold: 55,
          predictions: expect.arrayContaining([
            expect.objectContaining({ containerId: 1, uid: 'U1' })
          ])
        })
      })
    );
    expect(predictionRes.body.data.predictions).toHaveLength(20);
  });

  test('defective sensors, environmental metrics and cache refresh work as expected', async () => {
    AnomalyService.detectDefectiveSensors.mockResolvedValueOnce({
      total: 12,
      sensors: Array.from({ length: 12 }, (_, index) => ({ id: index + 1 })),
      detectionDate: '2026-04-10'
    });
    PerformanceService.getCompleteDashboard.mockResolvedValueOnce({
      environmental: { routes: { total: 9, completed: 6 } },
      period: 'week',
      generatedAt: '2026-04-10T00:00:00.000Z'
    });
    EnvironmentalConstantsService.getEnvironmentalConstants.mockResolvedValueOnce({ refreshed: true });

    const defectiveRes = await request(buildApp()).get('/api/analytics/ml/defective-sensors');
    const performanceRes = await request(buildApp()).get('/api/analytics/performance/environmental?period=month');
    const refreshRes = await request(buildApp()).post('/api/analytics/cache/refresh');

    expect(defectiveRes.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          total: 12,
          sensors: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 }]
        })
      })
    );
    expect(PerformanceService.getCompleteDashboard).toHaveBeenCalledWith('month');
    expect(performanceRes.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          period: 'week',
          environmental: expect.any(Object)
        })
      })
    );
    expect(clearCache).toHaveBeenCalled();
    expect(EnvironmentalConstantsService.clearCache).toHaveBeenCalled();
    expect(EnvironmentalConstantsService.getEnvironmentalConstants).toHaveBeenCalledWith(true);
    expect(refreshRes.body).toEqual({
      success: true,
      message: 'Cache cleared - environmental constants reloaded'
    });
  });
});


