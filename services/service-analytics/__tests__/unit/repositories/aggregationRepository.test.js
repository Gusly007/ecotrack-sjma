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
const AggregationRepository = require('../../../src/repositories/aggregationRepository');

describe('AggregationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createMaterializedViews and refreshMaterializedViews succeed', async () => {
    db.query.mockResolvedValue({});
    await expect(AggregationRepository.createMaterializedViews()).resolves.toEqual({ success: true });
    await expect(AggregationRepository.refreshMaterializedViews()).resolves.toEqual(expect.objectContaining({ success: true }));
  });

  test('getDailyAggregations getZoneAggregations getTypeAggregations and getGlobalAggregation return rows', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ date: '2026-01-01' }] });
    await expect(AggregationRepository.getDailyAggregations(10)).resolves.toEqual([{ date: '2026-01-01' }]);

    db.query.mockResolvedValueOnce({ rows: [{ id_zone: 1 }] });
    await expect(AggregationRepository.getZoneAggregations()).resolves.toEqual([{ id_zone: 1 }]);

    db.query.mockResolvedValueOnce({ rows: [{ id_type: 1 }] });
    await expect(AggregationRepository.getTypeAggregations()).resolves.toEqual([{ id_type: 1 }]);

    db.query.mockResolvedValueOnce({ rows: [{ total_containers: 7 }] });
    await expect(AggregationRepository.getGlobalAggregation()).resolves.toEqual({ total_containers: 7 });
  });

  test('getAgentPerformances returns rows and logs errors', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id_utilisateur: 1 }] });
    await expect(AggregationRepository.getAgentPerformances('2026-01-01', '2026-01-31')).resolves.toEqual([{ id_utilisateur: 1 }]);

    db.query.mockRejectedValueOnce(new Error('db fail'));
    await expect(AggregationRepository.getTypeAggregations()).rejects.toThrow('db fail');
    expect(logger.error).toHaveBeenCalled();
  });
});



