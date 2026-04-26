/**
 * Unit tests for SensorService
 */
jest.mock('../../../src/repositories/sensor-repository');
const SensorService = require('../../../src/services/sensor-service');
const ApiError = require('../../../src/utils/api-error');

describe('SensorService', () => {
  let sensorService;
  let mockSensorRepository;

  beforeEach(() => {
    mockSensorRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUid: jest.fn(),
      getSensorsStatus: jest.fn()
    };
    sensorService = new SensorService(mockSensorRepository);
  });

  describe('getSensors', () => {
    it('should return all sensors with filters', async () => {
      const filters = { page: 1, limit: 10 };
      const expectedSensors = [
        { id: 1, uid: 'CAP-001' },
        { id: 2, uid: 'CAP-002' }
      ];
      mockSensorRepository.findAll.mockResolvedValue(expectedSensors);

      const result = await sensorService.getSensors(filters);

      expect(mockSensorRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expectedSensors);
    });

    it('should return empty array when no sensors', async () => {
      mockSensorRepository.findAll.mockResolvedValue([]);

      const result = await sensorService.getSensors({});

      expect(result).toEqual([]);
    });
  });

  describe('getSensorById', () => {
    it('should return sensor when found', async () => {
      const sensor = { id: 1, uid: 'CAP-001' };
      mockSensorRepository.findById.mockResolvedValue(sensor);

      const result = await sensorService.getSensorById(1);

      expect(result).toEqual(sensor);
    });

    it('should throw 404 when sensor not found', async () => {
      mockSensorRepository.findById.mockResolvedValue(null);

      await expect(sensorService.getSensorById(999)).rejects.toThrow(ApiError);
    });
  });

  describe('getSensorByUid', () => {
    it('should return sensor when found by UID', async () => {
      const sensor = { id: 1, uid: 'CAP-001' };
      mockSensorRepository.findByUid.mockResolvedValue(sensor);

      const result = await sensorService.getSensorByUid('CAP-001');

      expect(result).toEqual(sensor);
    });

    it('should throw 404 when sensor not found by UID', async () => {
      mockSensorRepository.findByUid.mockResolvedValue(null);

      await expect(sensorService.getSensorByUid('UNKNOWN')).rejects.toThrow(ApiError);
    });
  });

  describe('getSensorsStatus', () => {
    it('should return sensors status', async () => {
      const status = { active: 10, inactive: 2 };
      mockSensorRepository.getSensorsStatus.mockResolvedValue(status);

      const result = await sensorService.getSensorsStatus();

      expect(result).toEqual(status);
    });
  });
});