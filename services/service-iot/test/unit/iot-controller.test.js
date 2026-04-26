/**
 * Tests unitaires - IotController
 */
const IotController = require('../../src/controllers/iot-controller');

describe('IotController', () => {
  let controller;
  let mockMeasurementService;
  let mockSensorService;
  let mockAlertService;
  let mockMqttHandler;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockMeasurementService = {
      getMeasurements: jest.fn(),
      getMeasurementsByContainer: jest.fn(),
      getLatestMeasurements: jest.fn(),
      getStats: jest.fn()
    };
    mockSensorService = {
      getSensors: jest.fn(),
      getSensorById: jest.fn()
    };
    mockAlertService = {
      getAlerts: jest.fn(),
      updateAlertStatus: jest.fn(),
      checkSilentSensors: jest.fn(),
      getAlertStats: jest.fn()
    };
    mockMqttHandler = {
      handleMessage: jest.fn(),
      getStats: jest.fn().mockReturnValue({ processed: 10, errors: 2 })
    };

    controller = new IotController(mockMeasurementService, mockSensorService, mockAlertService, mockMqttHandler);

    req = {
      query: { page: 1, limit: 50 },
      params: {},
      body: {}
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('getMeasurements', () => {
    it('should return paginated measurements', async () => {
      mockMeasurementService.getMeasurements.mockResolvedValue({
        rows: [{ id_mesure: 1 }],
        total: 1
      });

      await controller.getMeasurements(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
    });

    it('should call next on error', async () => {
      const error = new Error('DB Error');
      mockMeasurementService.getMeasurements.mockRejectedValue(error);

      await controller.getMeasurements(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getMeasurementsByContainer', () => {
    it('should return measurements for a container', async () => {
      req.params.id = '10';
      mockMeasurementService.getMeasurementsByContainer.mockResolvedValue([
        { id_mesure: 1, id_conteneur: 10 }
      ]);

      await controller.getMeasurementsByContainer(req, res, next);

      expect(res.json).toHaveBeenCalled();
      expect(mockMeasurementService.getMeasurementsByContainer).toHaveBeenCalledWith(10, 50);
    });
  });

  describe('getSensors', () => {
    it('should return paginated sensors', async () => {
      mockSensorService.getSensors.mockResolvedValue({
        rows: [{ id_capteur: 1, uid_capteur: 'CAP-001' }],
        total: 1
      });

      await controller.getSensors(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
    });
  });

  describe('getAlerts', () => {
    it('should return paginated alerts', async () => {
      mockAlertService.getAlerts.mockResolvedValue({
        rows: [{ id_alerte: 1, type_alerte: 'DEBORDEMENT' }],
        total: 1
      });

      await controller.getAlerts(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
    });
  });

  describe('updateAlertStatus', () => {
    it('should update alert status', async () => {
      req.params.id = '1';
      req.body.statut = 'RESOLUE';
      mockAlertService.updateAlertStatus.mockResolvedValue({
        id_alerte: 1,
        statut: 'RESOLUE'
      });

      await controller.updateAlertStatus(req, res, next);

      expect(mockAlertService.updateAlertStatus).toHaveBeenCalledWith(1, 'RESOLUE');
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('simulate', () => {
    it('should simulate sensor data', async () => {
      req.body = {
        uid_capteur: 'CAP-001',
        fill_level: 75,
        battery: 90,
        temperature: 22
      };
      mockMqttHandler.handleMessage.mockResolvedValue();

      await controller.simulate(req, res, next);

      expect(mockMqttHandler.handleMessage).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getStats', () => {
    it('should return combined stats', async () => {
      mockMeasurementService.getStats.mockResolvedValue({ total_mesures: '100' });
      mockAlertService.getAlertStats.mockResolvedValue({ alertes_actives: '5' });

      await controller.getStats(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.data.measurements.total_mesures).toBe('100');
      expect(response.data.alerts.alertes_actives).toBe('5');
      expect(response.data.mqtt.processed).toBe(10);
    });
  });
});
