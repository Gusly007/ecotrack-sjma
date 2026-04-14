const StatsController = require('../../../src/controllers/stats-controller');

describe('StatsController', () => {
  let controller;
  let mockService;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockService = {
      getDashboard: jest.fn(),
      getGlobalStats: jest.fn(),
      getFillLevelDistribution: jest.fn(),
      getStatsByZone: jest.fn(),
      getStatsByType: jest.fn(),
      getAlertsSummary: jest.fn(),
      getCriticalContainers: jest.fn(),
      getFillHistory: jest.fn(),
      getCollectionStats: jest.fn(),
      getMaintenanceStats: jest.fn(),
    };

    controller = new StatsController(mockService);

    req = { params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  // ── getDashboard ──
  describe('getDashboard', () => {
    it('retourne 200 avec les donnees du dashboard', async () => {
      const data = { global: {}, fillLevels: {}, alerts: {} };
      mockService.getDashboard.mockResolvedValue(data);

      await controller.getDashboard(req, res, next);

      expect(mockService.getDashboard).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(data);
      expect(next).not.toHaveBeenCalled();
    });

    it('appelle next(err) en cas d\'erreur', async () => {
      const error = new Error('dashboard error');
      mockService.getDashboard.mockRejectedValue(error);

      await controller.getDashboard(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // ── getGlobalStats ──
  describe('getGlobalStats', () => {
    it('retourne 200 avec les stats globales', async () => {
      const data = { total_conteneurs: 50 };
      mockService.getGlobalStats.mockResolvedValue(data);

      await controller.getGlobalStats(req, res, next);

      expect(mockService.getGlobalStats).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('appelle next(err) en cas d\'erreur', async () => {
      const error = new Error('global stats error');
      mockService.getGlobalStats.mockRejectedValue(error);

      await controller.getGlobalStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ── getFillLevelDistribution ──
  describe('getFillLevelDistribution', () => {
    it('retourne 200 avec la distribution des niveaux', async () => {
      const data = [{ range: '0-25', count: 10 }];
      mockService.getFillLevelDistribution.mockResolvedValue(data);

      await controller.getFillLevelDistribution(req, res, next);

      expect(mockService.getFillLevelDistribution).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('appelle next(err) en cas d\'erreur', async () => {
      const error = new Error('fill level error');
      mockService.getFillLevelDistribution.mockRejectedValue(error);

      await controller.getFillLevelDistribution(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ── getStatsByZone ──
  describe('getStatsByZone', () => {
    it('retourne 200 avec les stats par zone', async () => {
      const data = [{ zone: 'Zone A', count: 5 }];
      mockService.getStatsByZone.mockResolvedValue(data);

      await controller.getStatsByZone(req, res, next);

      expect(mockService.getStatsByZone).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('appelle next(err) en cas d\'erreur', async () => {
      const error = new Error('zone stats error');
      mockService.getStatsByZone.mockRejectedValue(error);

      await controller.getStatsByZone(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ── getStatsByType ──
  describe('getStatsByType', () => {
    it('retourne 200 avec les stats par type', async () => {
      const data = [{ type: 'Plastique', count: 20 }];
      mockService.getStatsByType.mockResolvedValue(data);

      await controller.getStatsByType(req, res, next);

      expect(mockService.getStatsByType).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('appelle next(err) en cas d\'erreur', async () => {
      const error = new Error('type stats error');
      mockService.getStatsByType.mockRejectedValue(error);

      await controller.getStatsByType(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ── getAlertsSummary ──
  describe('getAlertsSummary', () => {
    it('retourne 200 avec le resume des alertes', async () => {
      const data = { critical: 3, warning: 7 };
      mockService.getAlertsSummary.mockResolvedValue(data);

      await controller.getAlertsSummary(req, res, next);

      expect(mockService.getAlertsSummary).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('appelle next(err) en cas d\'erreur', async () => {
      const error = new Error('alerts error');
      mockService.getAlertsSummary.mockRejectedValue(error);

      await controller.getAlertsSummary(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ── getCriticalContainers ──
  describe('getCriticalContainers', () => {
    it('retourne 200 avec seuil par defaut (90)', async () => {
      const data = [{ id: 1, fill_level: 95 }];
      mockService.getCriticalContainers.mockResolvedValue(data);

      await controller.getCriticalContainers(req, res, next);

      expect(mockService.getCriticalContainers).toHaveBeenCalledWith(90);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('retourne 200 avec seuil personnalise depuis query', async () => {
      req.query.seuil = '75';
      const data = [{ id: 2, fill_level: 80 }];
      mockService.getCriticalContainers.mockResolvedValue(data);

      await controller.getCriticalContainers(req, res, next);

      expect(mockService.getCriticalContainers).toHaveBeenCalledWith(75);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('utilise 90 si seuil invalide (NaN)', async () => {
      req.query.seuil = 'abc';
      mockService.getCriticalContainers.mockResolvedValue([]);

      await controller.getCriticalContainers(req, res, next);

      // Number('abc') => NaN, || 90 => 90
      expect(mockService.getCriticalContainers).toHaveBeenCalledWith(90);
    });

    it('appelle next(err) en cas d\'erreur', async () => {
      const error = new Error('critical error');
      mockService.getCriticalContainers.mockRejectedValue(error);

      await controller.getCriticalContainers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ── getFillHistory ──
  describe('getFillHistory', () => {
    it('retourne 200 avec id, days et limit depuis req', async () => {
      req.params.id = '5';
      req.query.days = '60';
      req.query.limit = '100';
      const data = [{ date: '2025-01-01', level: 45 }];
      mockService.getFillHistory.mockResolvedValue(data);

      await controller.getFillHistory(req, res, next);

      expect(mockService.getFillHistory).toHaveBeenCalledWith('5', {
        days: '60',
        limit: '100',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('retourne 200 sans days ni limit (undefined)', async () => {
      req.params.id = '3';
      const data = [];
      mockService.getFillHistory.mockResolvedValue(data);

      await controller.getFillHistory(req, res, next);

      expect(mockService.getFillHistory).toHaveBeenCalledWith('3', {
        days: undefined,
        limit: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('appelle next(err) en cas d\'erreur', async () => {
      req.params.id = '1';
      const error = new Error('history error');
      mockService.getFillHistory.mockRejectedValue(error);

      await controller.getFillHistory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ── getCollectionStats ──
  describe('getCollectionStats', () => {
    it('retourne 200 avec days depuis query', async () => {
      req.query.days = '14';
      const data = { total_collections: 42 };
      mockService.getCollectionStats.mockResolvedValue(data);

      await controller.getCollectionStats(req, res, next);

      expect(mockService.getCollectionStats).toHaveBeenCalledWith({ days: '14' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('retourne 200 sans days (undefined)', async () => {
      const data = { total_collections: 10 };
      mockService.getCollectionStats.mockResolvedValue(data);

      await controller.getCollectionStats(req, res, next);

      expect(mockService.getCollectionStats).toHaveBeenCalledWith({ days: undefined });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('appelle next(err) en cas d\'erreur', async () => {
      const error = new Error('collection error');
      mockService.getCollectionStats.mockRejectedValue(error);

      await controller.getCollectionStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ── getMaintenanceStats ──
  describe('getMaintenanceStats', () => {
    it('retourne 200 avec les stats de maintenance', async () => {
      const data = { pending: 5, completed: 12 };
      mockService.getMaintenanceStats.mockResolvedValue(data);

      await controller.getMaintenanceStats(req, res, next);

      expect(mockService.getMaintenanceStats).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(data);
    });

    it('appelle next(err) en cas d\'erreur', async () => {
      const error = new Error('maintenance error');
      mockService.getMaintenanceStats.mockRejectedValue(error);

      await controller.getMaintenanceStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
