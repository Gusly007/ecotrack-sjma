const StatsController = require('../../../src/controllers/stats-controller');

const mockService = {
  getDashboard: jest.fn(),
  getKpis: jest.fn(),
  getCollecteStats: jest.fn(),
  getAlgorithmComparison: jest.fn()
};

const mockDb = { query: jest.fn() };
const controller = new StatsController(mockService, mockDb);

let req, res, next;

beforeEach(() => {
  jest.clearAllMocks();
  req = { body: {}, params: {}, query: {}, headers: {} };
  res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
  next = jest.fn();
});

describe('StatsController.getDashboard', () => {
  it('devrait retourner 200 avec les données du dashboard', async () => {
    const data = { tournees: { total: 10 } };
    mockService.getDashboard.mockResolvedValue(data);

    await controller.getDashboard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data, message: 'Dashboard des tournées' })
    );
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    const err = new Error('DB error');
    mockService.getDashboard.mockRejectedValue(err);

    await controller.getDashboard(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('StatsController.getKpis', () => {
  it('devrait passer les query params au service', async () => {
    const data = { taux_completion: 85.5 };
    mockService.getKpis.mockResolvedValue(data);
    req.query = { date_debut: '2026-01-01', date_fin: '2026-03-11', id_zone: '1' };

    await controller.getKpis(req, res, next);

    expect(mockService.getKpis).toHaveBeenCalledWith({
      date_debut: '2026-01-01',
      date_fin: '2026-03-11',
      id_zone: '1'
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'KPIs des tournées' })
    );
  });
});

describe('StatsController.getCollecteStats', () => {
  it('devrait retourner 200 avec les statistiques', async () => {
    const data = [{ date: '2026-03-11', total: 5 }];
    mockService.getCollecteStats.mockResolvedValue(data);
    req.query = { id_zone: '2' };

    await controller.getCollecteStats(req, res, next);

    expect(mockService.getCollecteStats).toHaveBeenCalledWith({
      date_debut: undefined,
      date_fin: undefined,
      id_zone: '2'
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Statistiques de collectes' })
    );
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    mockService.getCollecteStats.mockRejectedValue(new Error('erreur'));

    await controller.getCollecteStats(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('StatsController.getAlgorithmComparison', () => {
  it('devrait passer db au service et retourner 200', async () => {
    const data = { statistiques_historiques: {}, simulation_actuelle: {} };
    mockService.getAlgorithmComparison.mockResolvedValue(data);

    await controller.getAlgorithmComparison(req, res, next);

    expect(mockService.getAlgorithmComparison).toHaveBeenCalledWith(mockDb);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Comparaison des algorithmes', data })
    );
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    mockService.getAlgorithmComparison.mockRejectedValue(new Error('erreur'));

    await controller.getAlgorithmComparison(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
