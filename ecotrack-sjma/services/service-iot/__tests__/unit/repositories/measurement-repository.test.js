/**
 * Unit tests for MeasurementRepository
 */
jest.mock('../../../src/db/connexion');
const MeasurementRepository = require('../../../src/repositories/measurement-repository');

describe('MeasurementRepository', () => {
  let measurementRepository;
  let mockPool;

  beforeEach(() => {
    mockPool = {
      query: jest.fn()
    };
    measurementRepository = new MeasurementRepository(mockPool);
  });

  describe('create', () => {
    it('should create new measurement', async () => {
      const data = {
        niveau_remplissage_pct: 75,
        batterie_pct: 90,
        temperature: 22,
        id_capteur: 1,
        id_conteneur: 1
      };
      const mockMeasurement = { id_mesure: 1, ...data };
      mockPool.query.mockResolvedValue({ rows: [mockMeasurement] });

      const result = await measurementRepository.create(data);

      expect(result).toEqual(mockMeasurement);
    });
  });

  describe('findAll', () => {
    it('should return measurements with pagination', async () => {
      const mockMeasurements = [{ id_mesure: 1 }, { id_mesure: 2 }];
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total: '2' }] })
        .mockResolvedValueOnce({ rows: mockMeasurements });

      const result = await measurementRepository.findAll({ page: 1, limit: 10 });

      expect(result.rows).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by container id', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id_mesure: 1 }] });

      const result = await measurementRepository.findAll({ id_conteneur: 1 });

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('findByContainerId', () => {
    it('should return measurements for container', async () => {
      const mockMeasurements = [{ id_mesure: 1 }];
      mockPool.query.mockResolvedValue({ rows: mockMeasurements });

      const result = await measurementRepository.findByContainerId(1);

      expect(result).toEqual(mockMeasurements);
    });
  });

  describe('findLatestPerContainer', () => {
    it('should return latest measurement per container', async () => {
      const mockMeasurements = [{ id_conteneur: 1 }, { id_conteneur: 2 }];
      mockPool.query.mockResolvedValue({ rows: mockMeasurements });

      const result = await measurementRepository.findLatestPerContainer();

      expect(result).toEqual(mockMeasurements);
    });
  });

  describe('getStats', () => {
    it('should return measurement statistics', async () => {
      const mockStats = {
        total_mesures: '100',
        avg_fill_level: '75.5',
        critical_containers: '5'
      };
      mockPool.query.mockResolvedValue({ rows: [mockStats] });

      const result = await measurementRepository.getStats();

      expect(result).toEqual(mockStats);
    });
  });
});