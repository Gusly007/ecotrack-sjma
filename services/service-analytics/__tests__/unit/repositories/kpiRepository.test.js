jest.mock('../../../src/config/database', () => ({
  query: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const db = require('../../../src/config/database');
const logger = require('../../../src/utils/logger');
const KPIRepository = require('../../../src/repositories/kpiRepository');

describe('KPIRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getRealTimeKPIs and getTopCriticalContainers return rows', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ critical_containers: 2 }] });
    await expect(KPIRepository.getRealTimeKPIs()).resolves.toEqual({ critical_containers: 2 });

    db.query.mockResolvedValueOnce({ rows: [{ id_conteneur: 1 }] });
    await expect(KPIRepository.getTopCriticalContainers(5)).resolves.toEqual([{ id_conteneur: 1 }]);
  });

  test('getFillLevelEvolution and getZoneHeatmap return rows', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ date: '2026-01-01' }] });
    await expect(KPIRepository.getFillLevelEvolution(14)).resolves.toEqual([{ date: '2026-01-01' }]);

    db.query.mockResolvedValueOnce({ rows: [{ id_zone: 1 }] });
    await expect(KPIRepository.getZoneHeatmap()).resolves.toEqual([{ id_zone: 1 }]);
  });

  test('logs and rethrows on query errors', async () => {
    const err = new Error('db down');
    db.query.mockRejectedValueOnce(err);
    await expect(KPIRepository.getRealTimeKPIs()).rejects.toThrow('db down');
    expect(logger.error).toHaveBeenCalled();
  });
});



