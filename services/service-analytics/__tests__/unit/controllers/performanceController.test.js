jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../../src/services/cacheService', () => ({
  getOrSet: jest.fn()
}));

jest.mock('../../../src/services/performanceService', () => ({
  getCompleteDashboard: jest.fn(),
  getAgentDetailedPerformance: jest.fn()
}));

jest.mock('../../../src/repositories/agentPerformanceRepository', () => ({
  getAgentsRanking: jest.fn()
}));

jest.mock('../../../src/repositories/environmentalImpactRepository.js', () => ({
  EnvironmentalImpactRepository: {
    getEnvironmentalImpact: jest.fn(),
    getImpactEvolution: jest.fn(),
    getImpactByZone: jest.fn()
  }
}));

const cacheService = require('../../../src/services/cacheService');
const PerformanceService = require('../../../src/services/performanceService');
const AgentPerformanceRepository = require('../../../src/repositories/agentPerformanceRepository');
const { EnvironmentalImpactRepository } = require('../../../src/repositories/environmentalImpactRepository.js');
const PerformanceController = require('../../../src/controllers/performanceController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('PerformanceController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDashboard returns cached dashboard', async () => {
    cacheService.getOrSet.mockResolvedValueOnce({ complete: true });
    const res = createRes();

    await PerformanceController.getDashboard({ query: { period: 'month' } }, res);

    expect(cacheService.getOrSet).toHaveBeenCalledWith('performance:dashboard:month', expect.any(Function), 180);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { complete: true } });
  });

  test('getAgentsRanking validates and fetches ranking', async () => {
    const res = createRes();

    await PerformanceController.getAgentsRanking({ query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    AgentPerformanceRepository.getAgentsRanking.mockResolvedValueOnce([{ id: 1 }]);
    await PerformanceController.getAgentsRanking({ query: { startDate: '2026-01-01', endDate: '2026-01-31', limit: '5' } }, res);
    expect(AgentPerformanceRepository.getAgentsRanking).toHaveBeenCalledWith(new Date('2026-01-01'), new Date('2026-01-31'), 5);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }] });
  });

  test('getAgentPerformance and environmental endpoints return data', async () => {
    const res = createRes();
    cacheService.getOrSet.mockResolvedValueOnce({ agent: true });
    await PerformanceController.getAgentPerformance({ params: { id: '7' }, query: { period: 'week' } }, res);
    expect(PerformanceService.getAgentDetailedPerformance).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { agent: true } });

    await PerformanceController.getEnvironmentalImpact({ query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    EnvironmentalImpactRepository.getEnvironmentalImpact.mockResolvedValueOnce({ impact: 1 });
    await PerformanceController.getEnvironmentalImpact({ query: { startDate: '2026-01-01', endDate: '2026-01-31' } }, res);
    expect(EnvironmentalImpactRepository.getEnvironmentalImpact).toHaveBeenCalledWith(new Date('2026-01-01'), new Date('2026-01-31'));
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { impact: 1 } });

    cacheService.getOrSet.mockResolvedValueOnce({ evolution: true });
    await PerformanceController.getImpactEvolution({ query: { months: '3' } }, res);
    expect(cacheService.getOrSet).toHaveBeenCalledWith('performance:impact:evolution:3', expect.any(Function), 300);

    EnvironmentalImpactRepository.getImpactByZone.mockResolvedValueOnce([{ zone: 1 }]);
    await PerformanceController.getImpactByZone({ query: { startDate: '2026-01-01', endDate: '2026-01-31' } }, res);
    expect(EnvironmentalImpactRepository.getImpactByZone).toHaveBeenCalledWith(new Date('2026-01-01'), new Date('2026-01-31'));
  });
});



