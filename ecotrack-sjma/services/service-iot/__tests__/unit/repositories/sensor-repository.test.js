/**
 * Unit tests for SensorRepository
 */
jest.mock('../../../src/db/connexion');
const SensorRepository = require('../../../src/repositories/sensor-repository');

describe('SensorRepository', () => {
  let sensorRepository;
  let mockPool;

  beforeEach(() => {
    mockPool = {
      query: jest.fn()
    };
    sensorRepository = new SensorRepository(mockPool);
  });

  describe('findByUid', () => {
    it('should return sensor when found', async () => {
      const mockSensor = { id_capteur: 1, uid_capteur: 'CAP-001' };
      mockPool.query.mockResolvedValue({ rows: [mockSensor] });

      const result = await sensorRepository.findByUid('CAP-001');

      expect(result).toEqual(mockSensor);
    });

    it('should return null when not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await sensorRepository.findByUid('UNKNOWN');

      expect(result).toBeNull();
    });
  });

  describe('updateLastCommunication', () => {
    it('should update last communication timestamp', async () => {
      const mockResult = { id_capteur: 1 };
      mockPool.query.mockResolvedValue({ rows: [mockResult] });

      const result = await sensorRepository.updateLastCommunication(1);

      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return sensors with pagination', async () => {
      const mockSensors = [{ id_capteur: 1 }, { id_capteur: 2 }];
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total: '2' }] })
        .mockResolvedValueOnce({ rows: mockSensors });

      const result = await sensorRepository.findAll({ page: 1, limit: 10 });

      expect(result.rows).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('findById', () => {
    it('should return sensor by id', async () => {
      const mockSensor = { id_capteur: 1 };
      mockPool.query.mockResolvedValue({ rows: [mockSensor] });

      const result = await sensorRepository.findById(1);

      expect(result).toEqual(mockSensor);
    });

    it('should return null when not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await sensorRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findSilentSensors', () => {
    it('should return silent sensors', async () => {
      const mockSensors = [{ id_capteur: 1 }];
      mockPool.query.mockResolvedValue({ rows: mockSensors });

      const result = await sensorRepository.findSilentSensors(24);

      expect(result).toEqual(mockSensors);
    });
  });

  describe('getSensorsStatus', () => {
    it('should return sensors status', async () => {
      const mockStatus = {
        total: '10',
        active_last_hour: '8',
        active_last_24h: '9',
        inactive_12h: '2',
        inactive_24h: '1',
        low_battery: '1',
        messages_last_minute: '5',
        seconds_ago: '30'
      };
      mockPool.query.mockResolvedValue({ rows: [mockStatus] });

      const result = await sensorRepository.getSensorsStatus();

      expect(result.total).toEqual('10');
      expect(result.active).toEqual('8');
    });
  });
});