jest.mock('../../../src/config/database', () => ({
  query: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const db = require('../../../src/config/database');
const logger = require('../../../src/utils/logger');
const AgentPerformanceRepository = require('../../../src/repositories/agentPerformanceRepository');

describe('AgentPerformanceRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAgentSuccessRate and getAgentsRanking return rows', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ overall_success_rate: 88, collection_rate: 70 }] })
      .mockResolvedValueOnce({ rows: [{ id_utilisateur: 1, overall_score: 90, rank: 1 }] });

    await expect(AgentPerformanceRepository.getAgentSuccessRate(1, '2026-04-01', '2026-04-07')).resolves.toEqual({ overall_success_rate: 88, collection_rate: 70 });
    await expect(AgentPerformanceRepository.getAgentsRanking('2026-04-01', '2026-04-07')).resolves.toEqual([{ id_utilisateur: 1, overall_score: 90, rank: 1 }]);
  });

  test('getWeeklyPerformance returns rows and logs errors', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ date: '2026-04-01', routes_count: 2 }] });
    await expect(AgentPerformanceRepository.getWeeklyPerformance(5, '2026-04-01')).resolves.toEqual([{ date: '2026-04-01', routes_count: 2 }]);

    db.query.mockRejectedValueOnce(new Error('db fail'));
    await expect(AgentPerformanceRepository.getWeeklyPerformance(5, '2026-04-01')).rejects.toThrow('db fail');
    expect(logger.error).toHaveBeenCalledWith('Error getting weekly performance:', expect.any(Error));
  });
});


