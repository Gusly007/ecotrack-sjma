jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../../src/services/cacheService', () => ({
  getOrSet: jest.fn(),
  invalidate: jest.fn()
}));

jest.mock('../../../src/services/aggregationService', () => ({
  getCompleteAggregations: jest.fn(),
  refreshAll: jest.fn()
}));

jest.mock('../../../src/repositories/aggregationRepository', () => ({
  getZoneAggregations: jest.fn(),
  getAgentPerformances: jest.fn()
}));

const logger = require('../../../src/utils/logger');
const cacheService = require('../../../src/services/cacheService');
const AggregationService = require('../../../src/services/aggregationService');
const AggregationRepository = require('../../../src/repositories/aggregationRepository');
const AggregationController = require('../../../src/controllers/aggregationController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('AggregationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAggregations returns cached data from service', async () => {
    cacheService.getOrSet.mockResolvedValueOnce({ items: [1] });
    const res = createRes();

    await AggregationController.getAggregations({ query: { period: 'day' } }, res);

    expect(cacheService.getOrSet).toHaveBeenCalledWith(
      'aggregations:day',
      expect.any(Function),
      300
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { items: [1] } });
  });

  test('refreshAggregations invalidates cache and refreshes all', async () => {
    cacheService.invalidate.mockReturnValueOnce(undefined);
    AggregationService.refreshAll.mockResolvedValueOnce({ refreshed: true });
    const res = createRes();

    await AggregationController.refreshAggregations({}, res);

    expect(cacheService.invalidate).toHaveBeenCalledWith('aggregations:');
    expect(AggregationService.refreshAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { refreshed: true },
      message: 'Aggregations refreshed successfully'
    });
  });

  test('getZoneAggregations uses repository through cache and handles errors', async () => {
    cacheService.getOrSet.mockResolvedValueOnce({ zones: [] });
    const res = createRes();

    await AggregationController.getZoneAggregations({}, res);
    expect(cacheService.getOrSet).toHaveBeenCalledWith('aggregations:zones', expect.any(Function), 300);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { zones: [] } });

    cacheService.getOrSet.mockRejectedValueOnce(new Error('boom'));
    await AggregationController.getZoneAggregations({}, res);
    expect(logger.error).toHaveBeenCalledWith('Error in getZoneAggregations:', expect.any(Error));
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getAgentPerformances validates dates and fetches data', async () => {
    const res = createRes();

    await AggregationController.getAgentPerformances({ query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    AggregationRepository.getAgentPerformances.mockResolvedValueOnce([{ id: 1 }]);
    await AggregationController.getAgentPerformances({ query: { startDate: '2026-01-01', endDate: '2026-01-31' } }, res);
    expect(AggregationRepository.getAgentPerformances).toHaveBeenCalledWith('2026-01-01', '2026-01-31');
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }] });
  });
});



