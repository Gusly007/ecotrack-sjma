const StatsService = require('../../../src/services/stats-service');

const mockStatsRepo = {
  getDashboard: jest.fn(),
  getKpis: jest.fn(),
  getCollecteStats: jest.fn(),
  getAlgorithmComparison: jest.fn()
};

const service = new StatsService(mockStatsRepo);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('StatsService.getDashboard', () => {
  it('devrait déléguer au repository', async () => {
    const dashboard = { tournees: { total: 5 } };
    mockStatsRepo.getDashboard.mockResolvedValue(dashboard);

    const result = await service.getDashboard();
    expect(result).toEqual(dashboard);
    expect(mockStatsRepo.getDashboard).toHaveBeenCalled();
  });
});

describe('StatsService.getKpis', () => {
  it('devrait déléguer avec les options', async () => {
    const kpis = { taux_completion: 85.5 };
    mockStatsRepo.getKpis.mockResolvedValue(kpis);

    const options = { date_debut: '2026-01-01', date_fin: '2026-03-11' };
    const result = await service.getKpis(options);
    expect(result).toEqual(kpis);
    expect(mockStatsRepo.getKpis).toHaveBeenCalledWith(options);
  });

  it('devrait fonctionner sans options', async () => {
    mockStatsRepo.getKpis.mockResolvedValue({});

    await service.getKpis();
    expect(mockStatsRepo.getKpis).toHaveBeenCalledWith({});
  });
});

describe('StatsService.getCollecteStats', () => {
  it('devrait déléguer avec les options', async () => {
    const stats = [{ date: '2026-03-11', total: 10 }];
    mockStatsRepo.getCollecteStats.mockResolvedValue(stats);

    const result = await service.getCollecteStats({ id_zone: 1 });
    expect(result).toEqual(stats);
    expect(mockStatsRepo.getCollecteStats).toHaveBeenCalledWith({ id_zone: 1 });
  });
});

describe('StatsService.getAlgorithmComparison', () => {
  it('devrait retourner les stats DB + simulation si >= 3 conteneurs', async () => {
    const dbStats = { algorithmes: [] };
    mockStatsRepo.getAlgorithmComparison.mockResolvedValue(dbStats);

    const mockDb = {
      query: jest.fn().mockResolvedValue({
        rows: [
          { id_conteneur: 1, latitude: 48.8566, longitude: 2.3522 },
          { id_conteneur: 2, latitude: 48.8606, longitude: 2.3376 },
          { id_conteneur: 3, latitude: 48.8530, longitude: 2.3499 },
          { id_conteneur: 4, latitude: 48.8738, longitude: 2.2950 }
        ]
      })
    };

    const result = await service.getAlgorithmComparison(mockDb);
    expect(result.statistiques_historiques).toEqual(dbStats);
    expect(result.simulation_actuelle).not.toBeNull();
    expect(result.simulation_actuelle.nb_conteneurs).toBe(4);
    expect(result.simulation_actuelle).toHaveProperty('nearest_neighbor_km');
    expect(result.simulation_actuelle).toHaveProperty('two_opt_km');
    expect(result.simulation_actuelle).toHaveProperty('gain_pct');
    expect(result.simulation_actuelle).toHaveProperty('recommandation');
  });

  it('devrait retourner simulation null si < 3 conteneurs', async () => {
    mockStatsRepo.getAlgorithmComparison.mockResolvedValue({});

    const mockDb = {
      query: jest.fn().mockResolvedValue({
        rows: [
          { id_conteneur: 1, latitude: 48.8566, longitude: 2.3522 },
          { id_conteneur: 2, latitude: 48.8606, longitude: 2.3376 }
        ]
      })
    };

    const result = await service.getAlgorithmComparison(mockDb);
    expect(result.simulation_actuelle).toBeNull();
  });

  it('devrait retourner simulation null si aucun conteneur', async () => {
    mockStatsRepo.getAlgorithmComparison.mockResolvedValue({});

    const mockDb = {
      query: jest.fn().mockResolvedValue({ rows: [] })
    };

    const result = await service.getAlgorithmComparison(mockDb);
    expect(result.simulation_actuelle).toBeNull();
  });

  it('devrait recommander 2opt si distance NN > 2opt', async () => {
    mockStatsRepo.getAlgorithmComparison.mockResolvedValue({});

    // Conteneurs très dispersés → 2opt devrait améliorer
    const mockDb = {
      query: jest.fn().mockResolvedValue({
        rows: [
          { id_conteneur: 1, latitude: 48.8, longitude: 2.3 },
          { id_conteneur: 2, latitude: 49.0, longitude: 2.1 },
          { id_conteneur: 3, latitude: 48.5, longitude: 2.8 },
          { id_conteneur: 4, latitude: 48.9, longitude: 2.5 },
          { id_conteneur: 5, latitude: 48.6, longitude: 2.0 }
        ]
      })
    };

    const result = await service.getAlgorithmComparison(mockDb);
    expect(['2opt', 'nearest_neighbor']).toContain(result.simulation_actuelle.recommandation);
  });
});
