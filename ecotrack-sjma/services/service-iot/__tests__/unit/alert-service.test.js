/**
 * Tests unitaires - AlertService
 */
const AlertService = require('../../src/services/alert-service');

// Mock de la config
jest.mock('../../src/config/config', () => ({
  ALERTS: {
    FILL_LEVEL_CRITICAL: 90,
    FILL_LEVEL_WARNING: 75,
    BATTERY_LOW: 20,
    TEMPERATURE_MIN: -10,
    TEMPERATURE_MAX: 60,
    SENSOR_TIMEOUT_HOURS: 24
  },
  ALERT_TYPES: {
    DEBORDEMENT: 'DEBORDEMENT',
    BATTERIE_FAIBLE: 'BATTERIE_FAIBLE',
    CAPTEUR_DEFAILLANT: 'CAPTEUR_DEFAILLANT'
  }
}));

describe('AlertService', () => {
  let alertService;
  let mockAlertRepository;
  let mockSensorRepository;

  beforeEach(() => {
    mockAlertRepository = {
      create: jest.fn(),
      findActiveByContainerAndType: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      findById: jest.fn(),
      getStats: jest.fn()
    };
    mockSensorRepository = {
      findSilentSensors: jest.fn()
    };
    alertService = new AlertService(mockAlertRepository, mockSensorRepository);
  });

  describe('checkThresholds', () => {
    it('should create DEBORDEMENT alert when fill_level >= 90%', async () => {
      mockAlertRepository.findActiveByContainerAndType.mockResolvedValue(null);
      mockAlertRepository.create.mockResolvedValue({
        id_alerte: 1,
        type_alerte: 'DEBORDEMENT',
        valeur_detectee: 95,
        seuil: 90,
        id_conteneur: 1
      });

      const measurement = {
        id_conteneur: 1,
        niveau_remplissage_pct: 95,
        batterie_pct: 80,
        temperature: 22
      };

      const alerts = await alertService.checkThresholds(measurement);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type_alerte).toBe('DEBORDEMENT');
    });

    it('should create BATTERIE_FAIBLE alert when battery <= 20%', async () => {
      mockAlertRepository.findActiveByContainerAndType.mockResolvedValue(null);
      mockAlertRepository.create.mockResolvedValue({
        id_alerte: 2,
        type_alerte: 'BATTERIE_FAIBLE',
        valeur_detectee: 15,
        seuil: 20,
        id_conteneur: 1
      });

      const measurement = {
        id_conteneur: 1,
        niveau_remplissage_pct: 50,
        batterie_pct: 15,
        temperature: 22
      };

      const alerts = await alertService.checkThresholds(measurement);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type_alerte).toBe('BATTERIE_FAIBLE');
    });

    it('should create CAPTEUR_DEFAILLANT alert for abnormal temperature', async () => {
      mockAlertRepository.findActiveByContainerAndType.mockResolvedValue(null);
      mockAlertRepository.create.mockResolvedValue({
        id_alerte: 3,
        type_alerte: 'CAPTEUR_DEFAILLANT',
        valeur_detectee: 75,
        seuil: 60,
        id_conteneur: 1
      });

      const measurement = {
        id_conteneur: 1,
        niveau_remplissage_pct: 50,
        batterie_pct: 80,
        temperature: 75
      };

      const alerts = await alertService.checkThresholds(measurement);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type_alerte).toBe('CAPTEUR_DEFAILLANT');
    });

    it('should create multiple alerts if multiple thresholds exceeded', async () => {
      mockAlertRepository.findActiveByContainerAndType.mockResolvedValue(null);
      mockAlertRepository.create
        .mockResolvedValueOnce({ id_alerte: 1, type_alerte: 'DEBORDEMENT' })
        .mockResolvedValueOnce({ id_alerte: 2, type_alerte: 'BATTERIE_FAIBLE' });

      const measurement = {
        id_conteneur: 1,
        niveau_remplissage_pct: 95,
        batterie_pct: 10,
        temperature: 22
      };

      const alerts = await alertService.checkThresholds(measurement);
      expect(alerts).toHaveLength(2);
    });

    it('should not create alert if one already exists for same container/type', async () => {
      mockAlertRepository.findActiveByContainerAndType.mockResolvedValue({
        id_alerte: 99,
        statut: 'ACTIVE'
      });

      const measurement = {
        id_conteneur: 1,
        niveau_remplissage_pct: 95,
        batterie_pct: 80,
        temperature: 22
      };

      const alerts = await alertService.checkThresholds(measurement);
      expect(alerts).toHaveLength(0);
      expect(mockAlertRepository.create).not.toHaveBeenCalled();
    });

    it('should not create alerts when all values normal', async () => {
      const measurement = {
        id_conteneur: 1,
        niveau_remplissage_pct: 50,
        batterie_pct: 80,
        temperature: 22
      };

      const alerts = await alertService.checkThresholds(measurement);
      expect(alerts).toHaveLength(0);
    });

    it('should skip temperature check if temperature is null', async () => {
      const measurement = {
        id_conteneur: 1,
        niveau_remplissage_pct: 50,
        batterie_pct: 80,
        temperature: null
      };

      const alerts = await alertService.checkThresholds(measurement);
      expect(alerts).toHaveLength(0);
    });
  });

  describe('checkSilentSensors', () => {
    it('should create alerts for silent sensors', async () => {
      mockSensorRepository.findSilentSensors.mockResolvedValue([
        { id_conteneur: 1, uid_capteur: 'CAP-001', id_zone: 1 },
        { id_conteneur: 2, uid_capteur: 'CAP-002', id_zone: 1 }
      ]);
      mockAlertRepository.findActiveByContainerAndType.mockResolvedValue(null);
      mockAlertRepository.create
        .mockResolvedValueOnce({ id_alerte: 10, type_alerte: 'CAPTEUR_DEFAILLANT' })
        .mockResolvedValueOnce({ id_alerte: 11, type_alerte: 'CAPTEUR_DEFAILLANT' });

      const alerts = await alertService.checkSilentSensors();
      expect(alerts).toHaveLength(2);
      expect(mockSensorRepository.findSilentSensors).toHaveBeenCalledWith(24);
    });

    it('should return empty if no silent sensors', async () => {
      mockSensorRepository.findSilentSensors.mockResolvedValue([]);
      const alerts = await alertService.checkSilentSensors();
      expect(alerts).toHaveLength(0);
    });
  });

  describe('updateAlertStatus', () => {
    it('should resolve an active alert', async () => {
      mockAlertRepository.findById.mockResolvedValue({
        id_alerte: 1,
        statut: 'ACTIVE'
      });
      mockAlertRepository.updateStatus.mockResolvedValue({
        id_alerte: 1,
        statut: 'RESOLUE',
        date_traitement: new Date().toISOString()
      });

      const result = await alertService.updateAlertStatus(1, 'RESOLUE');
      expect(result.statut).toBe('RESOLUE');
    });

    it('should throw 404 if alert not found', async () => {
      mockAlertRepository.findById.mockResolvedValue(null);

      await expect(alertService.updateAlertStatus(999, 'RESOLUE'))
        .rejects.toThrow('Alerte 999 non trouvée');
    });

    it('should throw 400 if alert already resolved', async () => {
      mockAlertRepository.findById.mockResolvedValue({
        id_alerte: 1,
        statut: 'RESOLUE'
      });

      await expect(alertService.updateAlertStatus(1, 'RESOLUE'))
        .rejects.toThrow("n'est pas active");
    });
  });
});
