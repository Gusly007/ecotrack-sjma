jest.mock('../../../src/repositories/agentPerformanceRepository', () => ({
  getAgentsRanking: jest.fn(),
  getAgentSuccessRate: jest.fn(),
  getWeeklyPerformance: jest.fn()
}));

jest.mock('../../../src/repositories/environmentalImpactRepository', () => ({
  getEnvironmentalImpact: jest.fn(),
  getImpactByZone: jest.fn()
}));

jest.mock('../../../src/services/environmentalConstantsService', () => ({
  getEnvironmentalConstants: jest.fn(),
  calculateCO2: jest.fn(() => 12),
  calculateFuelConsumption: jest.fn(() => 3),
  calculateTotalCostSaved: jest.fn(() => 50),
  calculateCO2Equivalents: jest.fn(() => ({ trees: 2, carKm: 4 })),
  calculateFuelCost: jest.fn(() => 10),
  calculateLaborCost: jest.fn(() => 20),
  calculateMaintenanceCost: jest.fn(() => 20)
}));

jest.mock('../../../src/utils/dateUtils', () => ({
  getPeriodDates: jest.fn(() => ({ start: '2026-04-01', end: '2026-04-07' }))
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const AgentPerformanceRepository = require('../../../src/repositories/agentPerformanceRepository');
const EnvironmentalImpactRepository = require('../../../src/repositories/environmentalImpactRepository');
const EnvironmentalConstantsService = require('../../../src/services/environmentalConstantsService');
const DateUtils = require('../../../src/utils/dateUtils');
const logger = require('../../../src/utils/logger');
const PerformanceService = require('../../../src/services/performanceService');

describe('PerformanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getCompleteDashboard combines repositories and calculates metrics', async () => {
    AgentPerformanceRepository.getAgentsRanking.mockResolvedValueOnce([
      { overall_score: '80' },
      { overall_score: '60' }
    ]);
    EnvironmentalImpactRepository.getEnvironmentalImpact.mockResolvedValueOnce({
      planned_distance_km: '100',
      actual_distance_km: '75',
      planned_duration_min: '60',
      actual_duration_min: '45',
      completed_routes: '5',
      total_routes: '6',
      collected_containers: '30',
      total_containers: '40'
    });
    EnvironmentalImpactRepository.getImpactByZone.mockResolvedValueOnce([{ zone: 'A' }]);
    EnvironmentalConstantsService.getEnvironmentalConstants.mockResolvedValueOnce({ ok: true });

    const result = await PerformanceService.getCompleteDashboard('week');

    expect(DateUtils.getPeriodDates).toHaveBeenCalledWith('week');
    expect(result.agents.topPerformer).toEqual({ overall_score: '80' });
    expect(result.agents.averageSuccessRate).toBe(70);
    expect(result.environmental.distance.saved).toBe(25);
    expect(result.environmental.co2.saved).toBe(12);
    expect(result.zones).toEqual([{ zone: 'A' }]);
  });

  test('getCompleteDashboard logs and rethrows on failure', async () => {
    AgentPerformanceRepository.getAgentsRanking.mockRejectedValueOnce(new Error('boom'));
    await expect(PerformanceService.getCompleteDashboard()).rejects.toThrow('boom');
    expect(logger.error).toHaveBeenCalledWith('Error getting complete dashboard:', expect.any(Error));
  });

  test('_calculateEnvironmentalMetrics and defaults cover branches', () => {
    expect(PerformanceService._calculateEnvironmentalMetrics(null)).toEqual(expect.objectContaining({
      distance: expect.objectContaining({ saved: 0 }),
      routes: { completed: 0, total: 0 }
    }));

    const metrics = PerformanceService._calculateEnvironmentalMetrics({
      planned_distance_km: '0',
      actual_distance_km: '12',
      planned_duration_min: '0',
      actual_duration_min: '5',
      completed_routes: '3',
      total_routes: '4',
      collected_containers: '10',
      total_containers: '12'
    });
    expect(metrics.distance.reductionPct).toBe(0);
    expect(metrics.routes.completed).toBe(3);
    expect(metrics.containers.collected).toBe(10);
    expect(EnvironmentalConstantsService.calculateCO2).toHaveBeenCalledWith(0);
  });

  test('getAgentDetailedPerformance returns error when no data and details when available', async () => {
    AgentPerformanceRepository.getAgentSuccessRate.mockResolvedValueOnce(null);
    AgentPerformanceRepository.getWeeklyPerformance.mockResolvedValueOnce([{ date: '2026-04-01' }]);

    await expect(PerformanceService.getAgentDetailedPerformance(7)).resolves.toEqual(
      expect.objectContaining({ error: 'No data available for this agent', agentId: 7 })
    );

    AgentPerformanceRepository.getAgentSuccessRate.mockResolvedValueOnce({
      overall_success_rate: 91,
      collection_rate: 80,
      containers_collected: 12,
      containers_total: 15,
      completion_rate: 95,
      routes_completed: 5,
      routes_assigned: 6,
      time_efficiency_score: 88,
      distance_efficiency_score: 92,
      distance_saved_km: 30,
      time_saved_min: 25
    });
    AgentPerformanceRepository.getWeeklyPerformance.mockResolvedValueOnce([{ date: '2026-04-01' }]);

    await expect(PerformanceService.getAgentDetailedPerformance(7)).resolves.toEqual(
      expect.objectContaining({
        agentId: 7,
        successRate: 91,
        weekly: [{ date: '2026-04-01' }]
      })
    );
  });
});


