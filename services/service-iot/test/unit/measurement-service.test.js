/**
 * Tests unitaires - MeasurementService
 */
const MeasurementService = require('../../src/services/measurement-service');

describe('MeasurementService', () => {
  let service;
  let mockMeasurementRepo;
  let mockSensorRepo;

  beforeEach(() => {
    mockMeasurementRepo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByContainerId: jest.fn(),
      findLatestPerContainer: jest.fn(),
      getStats: jest.fn()
    };
    mockSensorRepo = {
      findByUid: jest.fn(),
      updateLastCommunication: jest.fn()
    };
    service = new MeasurementService(mockMeasurementRepo, mockSensorRepo);
  });

  describe('processMeasurement', () => {
    it('should process and store a valid measurement', async () => {
      mockSensorRepo.findByUid.mockResolvedValue({
        id_capteur: 1,
        uid_capteur: 'CAP-001',
        id_conteneur: 10,
        uid_conteneur: 'CNT-001',
        id_zone: 1
      });
      mockMeasurementRepo.create.mockResolvedValue({
        id_mesure: 100,
        niveau_remplissage_pct: 75,
        batterie_pct: 90,
        temperature: 22,
        id_capteur: 1,
        id_conteneur: 10
      });
      mockSensorRepo.updateLastCommunication.mockResolvedValue({});

      const result = await service.processMeasurement('CAP-001', {
        niveau_remplissage_pct: 75,
        batterie_pct: 90,
        temperature: 22
      });

      expect(result).toBeDefined();
      expect(result.id_mesure).toBe(100);
      expect(result.uid_capteur).toBe('CAP-001');
      expect(result.uid_conteneur).toBe('CNT-001');
      expect(result.id_zone).toBe(1);
      expect(mockSensorRepo.updateLastCommunication).toHaveBeenCalledWith(1);
    });

    it('should return null if sensor not found', async () => {
      mockSensorRepo.findByUid.mockResolvedValue(null);

      const result = await service.processMeasurement('UNKNOWN', {
        niveau_remplissage_pct: 50,
        batterie_pct: 80,
        temperature: 20
      });

      expect(result).toBeNull();
      expect(mockMeasurementRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('getMeasurements', () => {
    it('should return paginated measurements', async () => {
      mockMeasurementRepo.findAll.mockResolvedValue({
        rows: [{ id_mesure: 1 }, { id_mesure: 2 }],
        total: 2
      });

      const result = await service.getMeasurements({ page: 1, limit: 50 });
      expect(result.rows).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('getMeasurementsByContainer', () => {
    it('should return measurements for a container', async () => {
      mockMeasurementRepo.findByContainerId.mockResolvedValue([
        { id_mesure: 1, id_conteneur: 10 }
      ]);

      const result = await service.getMeasurementsByContainer(10);
      expect(result).toHaveLength(1);
    });

    it('should throw 404 if no measurements found', async () => {
      mockMeasurementRepo.findByContainerId.mockResolvedValue([]);

      await expect(service.getMeasurementsByContainer(999))
        .rejects.toThrow('Aucune mesure trouvée');
    });
  });

  describe('getLatestMeasurements', () => {
    it('should return latest measurement per container', async () => {
      mockMeasurementRepo.findLatestPerContainer.mockResolvedValue([
        { id_conteneur: 1, niveau_remplissage_pct: 50 },
        { id_conteneur: 2, niveau_remplissage_pct: 80 }
      ]);

      const result = await service.getLatestMeasurements();
      expect(result).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    it('should return measurement statistics', async () => {
      mockMeasurementRepo.getStats.mockResolvedValue({
        total_mesures: '100',
        avg_fill_level: '55.3',
        active_containers: '20'
      });

      const result = await service.getStats();
      expect(result.total_mesures).toBe('100');
    });
  });
});
