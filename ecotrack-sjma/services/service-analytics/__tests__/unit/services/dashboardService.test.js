jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../../src/utils/dateUtils', () => ({
  getPeriodDates: jest.fn(() => ({ start: '2026-01-01', end: '2026-01-31' }))
}));

jest.mock('../../../src/repositories/kpiRepository', () => ({
  getRealTimeKPIs: jest.fn(),
  getFillLevelEvolution: jest.fn(),
  getZoneHeatmap: jest.fn(),
  getTopCriticalContainers: jest.fn()
}));

jest.mock('../../../src/repositories/aggregationRepository', () => ({
  getGlobalAggregation: jest.fn()
}));

const DateUtils = require('../../../src/utils/dateUtils');
const KPIRepository = require('../../../src/repositories/kpiRepository');
const AggregationRepository = require('../../../src/repositories/aggregationRepository');
const DashboardService = require('../../../src/services/dashboardService');

describe('DashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDashboardData combines repository responses and computes trend', async () => {
    KPIRepository.getRealTimeKPIs.mockResolvedValueOnce({ critical_containers: 3, active_routes: 1, open_reports: 2 });
    KPIRepository.getFillLevelEvolution.mockResolvedValueOnce([
      { avg_fill_level: '10' },
      { avg_fill_level: '20' },
      { avg_fill_level: '30' },
      { avg_fill_level: '40' }
    ]);
    KPIRepository.getZoneHeatmap.mockResolvedValueOnce([{ id_zone: 1 }]);
    KPIRepository.getTopCriticalContainers.mockResolvedValueOnce([{ id_conteneur: 1 }]);
    AggregationRepository.getGlobalAggregation.mockResolvedValueOnce({ total_containers: 12 });

    const result = await DashboardService.getDashboardData('month');

    expect(DateUtils.getPeriodDates).toHaveBeenCalledWith('month');
    expect(KPIRepository.getFillLevelEvolution).toHaveBeenCalledWith(7);
    expect(result.period).toEqual({ start: '2026-01-01', end: '2026-01-31' });
    expect(result.evolution.trend).toBe('up');
    expect(result.critical).toEqual([{ id_conteneur: 1 }]);
  });

  test('calculateTrend handles stable up and down branches', () => {
    expect(DashboardService.calculateTrend()).toBe('stable');
    expect(DashboardService.calculateTrend([{ avg_fill_level: '1' }, { avg_fill_level: '2' }])).toBe('stable');
    expect(DashboardService.calculateTrend([
      { avg_fill_level: '10' },
      { avg_fill_level: '10' },
      { avg_fill_level: '10' },
      { avg_fill_level: '20' },
      { avg_fill_level: '20' },
      { avg_fill_level: '20' }
    ])).toBe('up');
    expect(DashboardService.calculateTrend([
      { avg_fill_level: '20' },
      { avg_fill_level: '20' },
      { avg_fill_level: '20' },
      { avg_fill_level: '10' },
      { avg_fill_level: '10' },
      { avg_fill_level: '10' }
    ])).toBe('down');
  });

  test('generateInsights returns all insight categories', () => {
    const insights = DashboardService.generateInsights({
      realTime: { critical_containers: 25, active_routes: 0, open_reports: 16 },
      evolution: { trend: 'up' }
    });

    expect(insights).toHaveLength(4);
    expect(insights.map(i => i.category)).toEqual(['capacity', 'routes', 'reports', 'trend']);
  });
});



