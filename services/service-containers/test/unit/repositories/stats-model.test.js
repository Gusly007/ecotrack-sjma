/**
 * Tests Unitaires - StatsRepository
 * Tests isoles avec mock de la connexion DB (pool.query)
 */

const StatsRepository = require('../../src/repositories/stats-repository');

describe('StatsRepository - Unit Tests', () => {
  let statsRepository;
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = { query: jest.fn() };
    statsRepository = new StatsRepository(mockDb);
  });

  // ── getGlobalStats ──
  describe('getGlobalStats', () => {
    it('doit retourner les stats globales des conteneurs', async () => {
      const mockResult = {
        total: 50,
        actifs: 30,
        inactifs: 15,
        en_maintenance: 5,
        capacite_moyenne_l: 1200,
        premiere_installation: '2025-01-01',
        derniere_installation: '2026-01-15',
      };
      mockDb.query.mockResolvedValue({ rows: [mockResult] });

      const result = await statsRepository.getGlobalStats();

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('doit propager une erreur DB', async () => {
      mockDb.query.mockRejectedValue(new Error('DB error'));

      await expect(statsRepository.getGlobalStats()).rejects.toThrow('DB error');
    });
  });

  // ── getFillLevelDistribution ──
  describe('getFillLevelDistribution', () => {
    it('doit retourner la distribution des niveaux de remplissage', async () => {
      const mockResult = {
        total_mesures: 40,
        vide_0_25: 10,
        moyen_25_50: 15,
        eleve_50_75: 10,
        critique_75_100: 5,
        remplissage_moyen_pct: 42.5,
        batterie_moyenne_pct: 78.3,
      };
      mockDb.query.mockResolvedValue({ rows: [mockResult] });

      const result = await statsRepository.getFillLevelDistribution();

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });
  });

  // ── getStatsByZone ──
  describe('getStatsByZone', () => {
    it('doit retourner les stats par zone', async () => {
      const mockRows = [
        { id_zone: 1, zone_nom: 'Centre', zone_type: 'URBAINE', nb_conteneurs: 20, actifs: 15, capacite_moyenne_l: 1000, remplissage_moyen_pct: 55.2 },
        { id_zone: 2, zone_nom: 'Nord', zone_type: 'PERIURBAINE', nb_conteneurs: 10, actifs: 8, capacite_moyenne_l: 1500, remplissage_moyen_pct: 30.1 },
      ];
      mockDb.query.mockResolvedValue({ rows: mockRows });

      const result = await statsModel.getStatsByZone();

      expect(result).toEqual(mockRows);
      expect(result).toHaveLength(2);
    });

    it('doit retourner un tableau vide si aucune zone', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await statsModel.getStatsByZone();

      expect(result).toEqual([]);
    });
  });

  // ── getStatsByType ──
  describe('getStatsByType', () => {
    it('doit retourner les stats par type de conteneur', async () => {
      const mockRows = [
        { id_type: 1, type_nom: 'Recyclable', type_code: 'REC', couleur: '#00FF00', nb_conteneurs: 25, actifs: 20, capacite_moyenne_l: 1100 },
      ];
      mockDb.query.mockResolvedValue({ rows: mockRows });

      const result = await statsRepository.getStatsByType();

      expect(result).toEqual(mockRows);
    });
  });

  // ── getAlertsSummary ──
  describe('getAlertsSummary', () => {
    it('doit retourner le resume des alertes actives', async () => {
      const mockResult = {
        total_alertes_actives: 3,
        debordements: 1,
        batteries_faibles: 1,
        capteurs_defaillants: 1,
        alertes: [{ id_alerte: 1, type_alerte: 'DEBORDEMENT' }],
      };
      mockDb.query.mockResolvedValue({ rows: [mockResult] });

      const result = await statsModel.getAlertsSummary();

      expect(result).toEqual(mockResult);
    });

    it('doit retourner 0 alertes si aucune alerte active', async () => {
      const mockResult = {
        total_alertes_actives: 0,
        debordements: 0,
        batteries_faibles: 0,
        capteurs_defaillants: 0,
        alertes: null,
      };
      mockDb.query.mockResolvedValue({ rows: [mockResult] });

      const result = await statsModel.getAlertsSummary();

      expect(result.total_alertes_actives).toBe(0);
      expect(result.alertes).toBeNull();
    });
  });

  // ── getCriticalContainers ──
  describe('getCriticalContainers', () => {
    it('doit retourner les conteneurs critiques avec le seuil par defaut (90)', async () => {
      const mockRows = [
        { id_conteneur: 1, uid: 'CNT-AAAAAAAAAAAA', statut: 'ACTIF', niveau_remplissage_pct: 95 },
      ];
      mockDb.query.mockResolvedValue({ rows: mockRows });

      const result = await statsRepository.getCriticalContainers();

      expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), [90]);
      expect(result).toEqual(mockRows);
    });

    it('doit utiliser un seuil personnalise', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await statsRepository.getCriticalContainers(75);

      expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), [75]);
    });
  });

  // ── getFillHistory ──
  describe('getFillHistory', () => {
    it('doit retourner l historique de remplissage avec les options par defaut', async () => {
      const mockRows = [
        { niveau_remplissage_pct: 45, batterie_pct: 80, temperature: 22, date_heure_mesure: '2026-01-15T10:00:00Z' },
        { niveau_remplissage_pct: 50, batterie_pct: 79, temperature: 23, date_heure_mesure: '2026-01-15T12:00:00Z' },
      ];
      mockDb.query.mockResolvedValue({ rows: mockRows });

      const result = await statsRepository.getFillHistory(1);

      expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), [1, 30, 500]);
      expect(result).toEqual(mockRows);
    });

    it('doit accepter des options days et limit personnalisees', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await statsRepository.getFillHistory(5, { days: 7, limit: 100 });

      expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), [5, 7, 100]);
    });
  });

  // ── getCollectionStats ──
  describe('getCollectionStats', () => {
    it('doit retourner les stats de collecte avec detail par zone et type', async () => {
      const mockGlobal = { nb_collectes: 100, total_kg: 5000 };
      const mockByZone = [{ id_zone: 1, zone_nom: 'Centre', nb_collectes: 60, total_kg: 3000 }];
      const mockByType = [{ id_type: 1, type_nom: 'Recyclable', nb_collectes: 40, total_kg: 2000 }];

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockGlobal] })
        .mockResolvedValueOnce({ rows: mockByZone })
        .mockResolvedValueOnce({ rows: mockByType });

      const result = await statsRepository.getCollectionStats({ days: 30 });

      expect(mockDb.query).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        ...mockGlobal,
        par_zone: mockByZone,
        par_type: mockByType,
      });
    });

    it('doit utiliser 30 jours par defaut', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{}] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await statsRepository.getCollectionStats();

      expect(mockDb.query).toHaveBeenNthCalledWith(1, expect.any(String), [30]);
    });
  });

  // ── getMaintenanceStats ──
  describe('getMaintenanceStats', () => {
    it('doit retourner les conteneurs en maintenance et les stats 90 jours', async () => {
      const mockEnCours = [
        { id_conteneur: 3, uid: 'CNT-CCCCCCCCCCCC', zone_nom: 'Sud', heures_en_maintenance: 48 },
      ];
      const mockDurees = {
        nb_maintenances_terminees: 10,
        duree_moyenne_heures: 24.5,
        duree_max_heures: 72.0,
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: mockEnCours })
        .mockResolvedValueOnce({ rows: [mockDurees] });

      const result = await statsModel.getMaintenanceStats();

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        en_cours: mockEnCours,
        nb_en_cours: 1,
        stats_90_jours: mockDurees,
      });
    });

    it('doit retourner 0 si aucun conteneur en maintenance', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ nb_maintenances_terminees: 0, duree_moyenne_heures: null, duree_max_heures: null }] });

      const result = await statsModel.getMaintenanceStats();

      expect(result.nb_en_cours).toBe(0);
      expect(result.en_cours).toEqual([]);
    });
  });
});
