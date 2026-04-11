import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsService } from '../services/analyticsService';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { ok: true } });
    api.post.mockResolvedValue({ data: { ok: true } });
  });

  it('predict methods call expected endpoints', async () => {
    await analyticsService.predictFillLevel(10, 3, true);
    expect(api.post).toHaveBeenCalledWith('/api/analytics/ml/predict', {
      containerId: 10,
      daysAhead: 3,
      includeWeather: true,
    });

    await analyticsService.predictWithWeather(5, 2);
    expect(api.post).toHaveBeenCalledWith('/api/analytics/ml/predict', {
      containerId: 5,
      daysAhead: 2,
      includeWeather: true,
    });

    await analyticsService.predictCriticalContainers(4, 95);
    expect(api.get).toHaveBeenCalledWith('/api/analytics/ml/predict-critical', {
      params: { daysAhead: 4, threshold: 95 },
    });
  });

  it('aliases delegate to prediction/anomaly methods', async () => {
    await analyticsService.getPredictions(1, 2, false);
    await analyticsService.getCriticalPredictions(3, 90);
    await analyticsService.getAnomalies(22, 2.5);
    await analyticsService.getDefectiveSensors();

    expect(api.post).toHaveBeenCalledWith('/api/analytics/ml/predict', {
      containerId: 1,
      daysAhead: 2,
      includeWeather: false,
    });
    expect(api.get).toHaveBeenCalledWith('/api/analytics/ml/predict-critical', {
      params: { daysAhead: 3, threshold: 90 },
    });
    expect(api.get).toHaveBeenCalledWith('/api/analytics/ml/anomalies/22', {
      params: { threshold: 2.5 },
    });
    expect(api.get).toHaveBeenCalledWith('/api/analytics/ml/defective-sensors');
  });

  it('anomaly endpoints call expected URLs', async () => {
    await analyticsService.detectAnomalies(7, 3);
    expect(api.get).toHaveBeenCalledWith('/api/analytics/ml/anomalies/7', {
      params: { threshold: 3 },
    });

    await analyticsService.detectAnomaliesAndCreateAlerts(8, 2, false);
    expect(api.post).toHaveBeenCalledWith('/api/analytics/ml/anomalies/8/alerts', null, {
      params: { threshold: 2, autoCreate: false },
    });

    await analyticsService.detectGlobalAnomalies(1.5, 10);
    expect(api.get).toHaveBeenCalledWith('/api/analytics/ml/anomalies/global', {
      params: { threshold: 1.5, limit: 10 },
    });
  });

  it('dashboard and KPI methods call expected endpoints', async () => {
    await analyticsService.getDashboardAnalytics();
    await analyticsService.getCriticalContainers(80, 12);
    await analyticsService.getAllContainersForSelector(50);
    await analyticsService.getKPIs('30d');

    expect(api.get).toHaveBeenCalledWith('/api/analytics/dashboard');
    expect(api.get).toHaveBeenCalledWith('/api/analytics/critical-containers', {
      params: { threshold: 80, limit: 12 },
    });
    expect(api.get).toHaveBeenCalledWith('/api/containers', {
      params: { limit: 50, page: 1 },
    });
    expect(api.get).toHaveBeenCalledWith('/api/analytics/kpis', {
      params: { period: '30d' },
    });
  });

  it('metrics/trends/weather/cache methods return response data', async () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(12345);

    await analyticsService.getEnvironmentalMetrics();
    expect(api.get).toHaveBeenCalledWith('/api/analytics/performance/environmental?t=12345');

    await analyticsService.getFillTrends(14);
    expect(api.get).toHaveBeenCalledWith('/api/analytics/aggregation/fill-trends', {
      params: { days: 14 },
    });

    await analyticsService.getZonePerformance();
    expect(api.get).toHaveBeenCalledWith('/api/analytics/aggregation/zone-performance');

    await analyticsService.getWeatherImpact();
    expect(api.get).toHaveBeenCalledWith('/api/analytics/weather-impact');

    await analyticsService.getCollecteStats(60);
    expect(api.get).toHaveBeenCalledWith('/api/analytics/collecte-stats', {
      params: { days: 60 },
    });

    await analyticsService.getMLPredictions(2, 70);
    expect(api.get).toHaveBeenCalledWith('/api/analytics/ml/predictions', {
      params: { daysAhead: 2, threshold: 70 },
    });

    await analyticsService.refreshCache();
    expect(api.post).toHaveBeenCalledWith('/api/analytics/cache/refresh');

    nowSpy.mockRestore();
  });
});
