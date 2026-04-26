jest.mock('../../../src/config/database', () => ({
  query: jest.fn()
}));

const db = require('../../../src/config/database');
const DashboardAnalyticsRepository = require('../../../src/repositories/dashboardAnalyticsRepository');

describe('DashboardAnalyticsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns base stats and counts with the expected query parameters', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ active_containers: 8, total_measurements: 14, avg_fill_level: '63.2', avg_battery: '81.4' }] })
      .mockResolvedValueOnce({ rows: [{ active_alerts: 2 }] })
      .mockResolvedValueOnce({ rows: [{ count: 5 }] });

    await expect(DashboardAnalyticsRepository.getKpiBaseStats()).resolves.toEqual({
      active_containers: 8,
      total_measurements: 14,
      avg_fill_level: '63.2',
      avg_battery: '81.4'
    });
    await expect(DashboardAnalyticsRepository.getActiveAlertsCount()).resolves.toEqual({ active_alerts: 2 });
    await expect(DashboardAnalyticsRepository.getCriticalContainersCount(90)).resolves.toEqual({ count: 5 });

    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('m.niveau_remplissage_pct > $1'), [90]);
  });

  test('returns aggregation rows for trends, zone performance and distribution', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ date: '2026-04-01', avgFillLevel: '55.5', measurementCount: 10, avgBattery: '80.1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'North', code: 'N', containerCount: 7, fillRate: '61.5', avgBattery: '73.3', measurementCount: 18 }] })
      .mockResolvedValueOnce({ rows: [{ id_type: 3, type: 'Glass', code: 'GL', containerCount: 4, avgFillRate: '66.2', avgBattery: '71.4' }] });

    await expect(DashboardAnalyticsRepository.getFillTrends(14)).resolves.toEqual([
      { date: '2026-04-01', avgFillLevel: '55.5', measurementCount: 10, avgBattery: '80.1' }
    ]);
    await expect(DashboardAnalyticsRepository.getZonePerformance()).resolves.toEqual([
      { id: 1, name: 'North', code: 'N', containerCount: 7, fillRate: '61.5', avgBattery: '73.3', measurementCount: 18 }
    ]);
    await expect(DashboardAnalyticsRepository.getTypeDistribution()).resolves.toEqual([
      { id_type: 3, type: 'Glass', code: 'GL', containerCount: 4, avgFillRate: '66.2', avgBattery: '71.4' }
    ]);

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('AVG(m.niveau_remplissage_pct)'), ['14']);
  });

  test('returns critical containers and collecte stats rows', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id_conteneur: 1, uid: 'C1' }] })
      .mockResolvedValueOnce({ rows: [{ totalCollections: 9, totalKg: '48.4', avgKg: '5.4', maxKg: '10.2', minKg: '1.1' }] })
      .mockResolvedValueOnce({ rows: [{ date: '2026-04-01', collections: 2, totalKg: '12.4' }] });

    await expect(DashboardAnalyticsRepository.getCriticalContainers(80, 5)).resolves.toEqual([{ id_conteneur: 1, uid: 'C1' }]);
    await expect(DashboardAnalyticsRepository.getCollecteSummary(30)).resolves.toEqual({
      totalCollections: 9,
      totalKg: '48.4',
      avgKg: '5.4',
      maxKg: '10.2',
      minKg: '1.1'
    });
    await expect(DashboardAnalyticsRepository.getCollecteDaily(30)).resolves.toEqual([
      { date: '2026-04-01', collections: 2, totalKg: '12.4' }
    ]);

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('LIMIT $2'), [80, 5]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('FROM COLLECTE'), ['30']);
  });

  test('propagates database errors', async () => {
    db.query.mockRejectedValueOnce(new Error('db unavailable'));

    await expect(DashboardAnalyticsRepository.getKpiBaseStats()).rejects.toThrow('db unavailable');
  });
});


