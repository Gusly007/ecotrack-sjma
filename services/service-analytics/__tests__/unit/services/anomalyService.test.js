jest.mock('../../../src/repositories/anomalyRepository', () => ({
  getRecentContainerMeasurements: jest.fn(),
  getDefectiveSensorStats: jest.fn(),
  createSensorAlert: jest.fn(),
  getContainersForGlobalAnomalyScan: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const AnomalyRepository = require('../../../src/repositories/anomalyRepository');
const logger = require('../../../src/utils/logger');
const AnomalyService = require('../../../src/services/anomalyService');

function buildMeasurement(timestamp, fillLevel, battery, temperature = 20) {
  return {
    timestamp,
    fill_level: fillLevel,
    battery,
    temperature
  };
}

describe('AnomalyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('detectAnomalies returns early when data is too small and classifies anomalies', async () => {
    AnomalyRepository.getRecentContainerMeasurements.mockResolvedValueOnce(
      Array.from({ length: 5 }, (_, index) => buildMeasurement(index, 10 + index, 80))
    );

    await expect(AnomalyService.detectAnomalies(1)).resolves.toEqual(
      expect.objectContaining({
        anomalies: [],
        message: 'Not enough data for anomaly detection',
        dataPoints: 5
      })
    );

    const strongData = Array.from({ length: 20 }, (_, index) => buildMeasurement(index, 50 + (index % 2), 80));
    strongData[0] = buildMeasurement(0, 95, 5, 60);
    AnomalyRepository.getRecentContainerMeasurements.mockResolvedValueOnce(strongData);

    const result = await AnomalyService.detectAnomalies(2, 1);
    expect(result.anomaliesCount).toBeGreaterThan(0);
    expect(result.anomalies[0].type).toEqual(expect.arrayContaining(['sudden_fill', 'low_battery', 'temperature_extreme']));
  });

  test('detectDefectiveSensors maps issues and detect errors', async () => {
    AnomalyRepository.getDefectiveSensorStats.mockResolvedValueOnce([
      {
        id_capteur: 1,
        uid_capteur: 'S1',
        id_conteneur: 2,
        uid: 'C1',
        last_measurement: null,
        avg_battery: 9,
        stddev_fill: 0.5,
        measurement_count: 3
      },
      {
        id_capteur: 2,
        uid_capteur: 'S2',
        id_conteneur: 3,
        uid: 'C2',
        last_measurement: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
        avg_battery: 15,
        stddev_fill: 0.4,
        measurement_count: 8
      }
    ]);

    await expect(AnomalyService.detectDefectiveSensors()).resolves.toEqual(
      expect.objectContaining({
        total: 2,
        sensors: [
          expect.objectContaining({ issues: expect.arrayContaining(['no_data', 'critical_battery', 'sensor_stuck', 'insufficient_data']) }),
          expect.objectContaining({ issues: expect.arrayContaining(['no_recent_data', 'low_battery', 'sensor_stuck', 'insufficient_data']) })
        ]
      })
    );

    AnomalyRepository.getDefectiveSensorStats.mockRejectedValueOnce(new Error('db fail'));
    await expect(AnomalyService.detectDefectiveSensors()).rejects.toThrow('db fail');
    expect(logger.error).toHaveBeenCalledWith('Error detecting defective sensors:', expect.any(Error));
  });

  test('createAlerts and detectGlobalAnomalies use repository calls', async () => {
    AnomalyRepository.createSensorAlert.mockResolvedValue(undefined);
    await AnomalyService.createAlerts({
      containerId: 9,
      anomalies: [
        { fillLevel: 60, type: ['A'] },
        { fillLevel: 10, type: ['B'] }
      ]
    });
    expect(AnomalyRepository.createSensorAlert).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenCalledWith('Created 2 automatic alerts');

    AnomalyRepository.getContainersForGlobalAnomalyScan.mockResolvedValueOnce([
      { id_conteneur: 1, uid: 'U1', id_capteur: 11, uid_capteur: 'S1' },
      { id_conteneur: 2, uid: 'U2', id_capteur: 12, uid_capteur: 'S2' }
    ]);
    jest.spyOn(AnomalyService, 'detectAnomalies')
      .mockResolvedValueOnce({ anomaliesCount: 2, anomaliesRate: '10.00', totalMeasurements: 20, anomalies: [{ id: 1 }, { id: 2 }], statistics: { a: 1 } })
      .mockRejectedValueOnce(new Error('skip'));

    const result = await AnomalyService.detectGlobalAnomalies(2, 10);
    expect(result.summary.containersScanned).toBe(2);
    expect(result.summary.containersWithAnomalies).toBe(1);
    expect(logger.warn).toHaveBeenCalledWith('Skipping container 2: skip');
  });
});


