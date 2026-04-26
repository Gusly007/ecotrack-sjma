jest.mock('../../../src/config/database', () => ({
  query: jest.fn()
}));

const db = require('../../../src/config/database');
const AnomalyRepository = require('../../../src/repositories/anomalyRepository');

describe('AnomalyRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getRecentContainerMeasurements returns rows and queries with container id', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ fill_level: 42 }] });

    await expect(AnomalyRepository.getRecentContainerMeasurements(7)).resolves.toEqual([{ fill_level: 42 }]);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM MESURE'), [7]);
  });

  test('getDefectiveSensorStats returns rows', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id_conteneur: 1 }] });

    await expect(AnomalyRepository.getDefectiveSensorStats()).resolves.toEqual([{ id_conteneur: 1 }]);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WITH sensor_stats AS ('));
  });

  test('createSensorAlert inserts alert with mapped payload', async () => {
    db.query.mockResolvedValueOnce({});

    await expect(
      AnomalyRepository.createSensorAlert({
        value: 12,
        threshold: 10,
        status: 'CRITICAL',
        createdAt: '2026-04-10T00:00:00.000Z',
        description: 'Sensor alert',
        containerId: 99
      })
    ).resolves.toBeUndefined();

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO ALERTE_CAPTEUR'),
      ['CAPTEUR_DEFAILLANT', 12, 10, 'CRITICAL', '2026-04-10T00:00:00.000Z', 'Sensor alert', 99]
    );
  });

  test('getContainersForGlobalAnomalyScan returns rows', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id_conteneur: 1 }, { id_conteneur: 2 }] });

    await expect(AnomalyRepository.getContainersForGlobalAnomalyScan()).resolves.toEqual([
      { id_conteneur: 1 },
      { id_conteneur: 2 }
    ]);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('HAVING COUNT(m.id_mesure) >= 20'));
  });
});
