/**
 * Tests Unitaires - StatsService
 * Tests isoles avec mock du StatsModel
 */

const StatsService = require('../../src/services/stats-service');

describe('StatsService - Unit Tests', () => {
  let statsService;
  let mockModel;

  beforeEach(() => {
    jest.clearAllMocks();

    mockModel = {
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

    statsService = new StatsService(mockModel);
  });

  // ── getDashboard ──
  describe('getDashboard', () => {
    it('doit appeler getGlobalStats, getFillLevelDistribution et getAlertsSummary en parallele', async () => {
      const mockGlobal = { total: 50, actifs: 30 };
      const mockFill = { remplissage_moyen_pct: 45 };
      const mockAlerts = {
        total_alertes_actives: 2,
        debordements: 1,
        batteries_faibles: 1,
        capteurs_defaillants: 0,
      };

      mockModel.getGlobalStats.mockResolvedValue(mockGlobal);
      mockModel.getFillLevelDistribution.mockResolvedValue(mockFill);
      mockModel.getAlertsSummary.mockResolvedValue(mockAlerts);

      const result = await statsService.getDashboard();

      expect(mockModel.getGlobalStats).toHaveBeenCalledTimes(1);
      expect(mockModel.getFillLevelDistribution).toHaveBeenCalledTimes(1);
      expect(mockModel.getAlertsSummary).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        conteneurs: mockGlobal,
        remplissage: mockFill,
        alertes: {
          total_actives: 2,
          debordements: 1,
          batteries_faibles: 1,
          capteurs_defaillants: 0,
        },
      });
    });

    it('doit propager une erreur si un appel echoue', async () => {
      mockModel.getGlobalStats.mockRejectedValue(new Error('DB down'));
      mockModel.getFillLevelDistribution.mockResolvedValue({});
      mockModel.getAlertsSummary.mockResolvedValue({});

      await expect(statsService.getDashboard()).rejects.toThrow('DB down');
    });
  });

  // ── getGlobalStats ──
  describe('getGlobalStats', () => {
    it('doit deleguer au model', async () => {
      const mockData = { total: 50 };
      mockModel.getGlobalStats.mockResolvedValue(mockData);

      const result = await statsService.getGlobalStats();

      expect(mockModel.getGlobalStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });
  });

  // ── getFillLevelDistribution ──
  describe('getFillLevelDistribution', () => {
    it('doit deleguer au model', async () => {
      const mockData = { remplissage_moyen_pct: 42 };
      mockModel.getFillLevelDistribution.mockResolvedValue(mockData);

      const result = await statsService.getFillLevelDistribution();

      expect(result).toEqual(mockData);
    });
  });

  // ── getStatsByZone ──
  describe('getStatsByZone', () => {
    it('doit deleguer au model', async () => {
      const mockData = [{ id_zone: 1, nb_conteneurs: 20 }];
      mockModel.getStatsByZone.mockResolvedValue(mockData);

      const result = await statsService.getStatsByZone();

      expect(result).toEqual(mockData);
    });
  });

  // ── getStatsByType ──
  describe('getStatsByType', () => {
    it('doit deleguer au model', async () => {
      const mockData = [{ id_type: 1, nb_conteneurs: 25 }];
      mockModel.getStatsByType.mockResolvedValue(mockData);

      const result = await statsService.getStatsByType();

      expect(result).toEqual(mockData);
    });
  });

  // ── getAlertsSummary ──
  describe('getAlertsSummary', () => {
    it('doit deleguer au model', async () => {
      const mockData = { total_alertes_actives: 3 };
      mockModel.getAlertsSummary.mockResolvedValue(mockData);

      const result = await statsService.getAlertsSummary();

      expect(result).toEqual(mockData);
    });
  });

  // ── getCriticalContainers ──
  describe('getCriticalContainers', () => {
    it('doit deleguer au model avec le seuil par defaut (90)', async () => {
      mockModel.getCriticalContainers.mockResolvedValue([]);

      await statsService.getCriticalContainers();

      expect(mockModel.getCriticalContainers).toHaveBeenCalledWith(90);
    });

    it('doit accepter un seuil personnalise', async () => {
      mockModel.getCriticalContainers.mockResolvedValue([]);

      await statsService.getCriticalContainers(75);

      expect(mockModel.getCriticalContainers).toHaveBeenCalledWith(75);
    });

    it('doit rejeter un seuil negatif avec ValidationError', async () => {
      await expect(statsService.getCriticalContainers(-1)).rejects.toThrow(
        'Le seuil de remplissage doit être entre 0 et 100'
      );
      expect(mockModel.getCriticalContainers).not.toHaveBeenCalled();
    });

    it('doit rejeter un seuil superieur a 100 avec ValidationError', async () => {
      try {
        await statsService.getCriticalContainers(150);
        fail('Aurait du lancer une erreur');
      } catch (err) {
        expect(err.name).toBe('ValidationError');
        expect(err.message).toContain('entre 0 et 100');
      }
    });
  });

  // ── getFillHistory ──
  describe('getFillHistory', () => {
    it('doit deleguer au model avec les options par defaut', async () => {
      const mockData = [{ niveau_remplissage_pct: 45 }];
      mockModel.getFillHistory.mockResolvedValue(mockData);

      const result = await statsService.getFillHistory(1);

      expect(mockModel.getFillHistory).toHaveBeenCalledWith(1, { days: 30, limit: 500 });
      expect(result).toEqual(mockData);
    });

    it('doit accepter des options personnalisees', async () => {
      mockModel.getFillHistory.mockResolvedValue([]);

      await statsService.getFillHistory(5, { days: 7, limit: 100 });

      expect(mockModel.getFillHistory).toHaveBeenCalledWith(5, { days: 7, limit: 100 });
    });

    it('doit clamper days entre 1 et 365', async () => {
      mockModel.getFillHistory.mockResolvedValue([]);

      await statsService.getFillHistory(1, { days: 999 });

      expect(mockModel.getFillHistory).toHaveBeenCalledWith(1, { days: 365, limit: 500 });
    });

    it('doit clamper limit entre 1 et 5000', async () => {
      mockModel.getFillHistory.mockResolvedValue([]);

      await statsService.getFillHistory(1, { limit: 99999 });

      expect(mockModel.getFillHistory).toHaveBeenCalledWith(1, { days: 30, limit: 5000 });
    });

    it('doit rejeter un id invalide (null)', async () => {
      await expect(statsService.getFillHistory(null)).rejects.toThrow('ID de conteneur invalide');
    });

    it('doit rejeter un id invalide (negatif)', async () => {
      await expect(statsService.getFillHistory(-1)).rejects.toThrow('ID de conteneur invalide');
    });

    it('doit rejeter un id invalide (string non-numerique)', async () => {
      await expect(statsService.getFillHistory('abc')).rejects.toThrow('ID de conteneur invalide');
    });

    it('l erreur doit etre de type ValidationError', async () => {
      try {
        await statsService.getFillHistory(null);
        fail('Aurait du lancer une erreur');
      } catch (err) {
        expect(err.name).toBe('ValidationError');
      }
    });
  });

  // ── getCollectionStats ──
  describe('getCollectionStats', () => {
    it('doit deleguer au model avec days par defaut (30)', async () => {
      const mockData = { nb_collectes: 100 };
      mockModel.getCollectionStats.mockResolvedValue(mockData);

      const result = await statsService.getCollectionStats();

      expect(mockModel.getCollectionStats).toHaveBeenCalledWith({ days: 30 });
      expect(result).toEqual(mockData);
    });

    it('doit clamper days entre 1 et 365', async () => {
      mockModel.getCollectionStats.mockResolvedValue({});

      await statsService.getCollectionStats({ days: 0 });

      // Number(0) || 30 => 30, then Math.max(30, 1) => 30
      expect(mockModel.getCollectionStats).toHaveBeenCalledWith({ days: 30 });
    });

    it('doit accepter des days personnalises', async () => {
      mockModel.getCollectionStats.mockResolvedValue({});

      await statsService.getCollectionStats({ days: 60 });

      expect(mockModel.getCollectionStats).toHaveBeenCalledWith({ days: 60 });
    });
  });

  // ── getMaintenanceStats ──
  describe('getMaintenanceStats', () => {
    it('doit deleguer au model', async () => {
      const mockData = { nb_en_cours: 2 };
      mockModel.getMaintenanceStats.mockResolvedValue(mockData);

      const result = await statsService.getMaintenanceStats();

      expect(mockModel.getMaintenanceStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });
  });
});
