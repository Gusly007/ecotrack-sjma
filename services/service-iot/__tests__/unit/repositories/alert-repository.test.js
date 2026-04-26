/**
 * Unit tests for AlertRepository
 */
jest.mock('../../../src/db/connexion');
const AlertRepository = require('../../../src/repositories/alert-repository');

describe('AlertRepository', () => {
  let alertRepository;
  let mockPool;

  beforeEach(() => {
    mockPool = {
      query: jest.fn()
    };
    alertRepository = new AlertRepository(mockPool);
  });

  describe('create', () => {
    it('should create new alert', async () => {
      const alertData = {
        type_alerte: 'DEBORDEMENT',
        valeur_detectee: 95,
        seuil: 90,
        description: 'Conteneur presque plein',
        id_conteneur: 1
      };
      const mockAlert = { id_alerte: 1, ...alertData };
      mockPool.query.mockResolvedValue({ rows: [mockAlert] });

      const result = await alertRepository.create(alertData);

      expect(result).toEqual(mockAlert);
    });
  });

  describe('findAll', () => {
    it('should return alerts with pagination', async () => {
      const mockAlerts = [{ id_alerte: 1 }, { id_alerte: 2 }];
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total: '2' }] })
        .mockResolvedValueOnce({ rows: mockAlerts });

      const result = await alertRepository.findAll({ page: 1, limit: 10 });

      expect(result.rows).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id_alerte: 1 }] });

      const result = await alertRepository.findAll({ statut: 'ACTIVE' });

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    it('should update alert status', async () => {
      const mockAlert = { id_alerte: 1, statut: 'RESOLUE' };
      mockPool.query.mockResolvedValue({ rows: [mockAlert] });

      const result = await alertRepository.updateStatus(1, 'RESOLUE');

      expect(result.statut).toBe('RESOLUE');
    });

    it('should return null when not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await alertRepository.updateStatus(999, 'RESOLUE');

      expect(result).toBeNull();
    });
  });

  describe('findActiveByContainerAndType', () => {
    it('should return active alert if exists', async () => {
      const mockAlert = { id_alerte: 1, type_alerte: 'DEBORDEMENT' };
      mockPool.query.mockResolvedValue({ rows: [mockAlert] });

      const result = await alertRepository.findActiveByContainerAndType(1, 'DEBORDEMENT');

      expect(result).toEqual(mockAlert);
    });

    it('should return null when no active alert', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await alertRepository.findActiveByContainerAndType(1, 'DEBORDEMENT');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return alert by id', async () => {
      const mockAlert = { id_alerte: 1 };
      mockPool.query.mockResolvedValue({ rows: [mockAlert] });

      const result = await alertRepository.findById(1);

      expect(result).toEqual(mockAlert);
    });
  });

  describe('getStats', () => {
    it('should return alert statistics', async () => {
      const mockStats = {
        alertes_actives: '5',
        alertes_resolues: '10',
        alertes_24h: '2'
      };
      mockPool.query.mockResolvedValue({ rows: [mockStats] });

      const result = await alertRepository.getStats();

      expect(result.alertes_actives).toBe('5');
    });
  });
});