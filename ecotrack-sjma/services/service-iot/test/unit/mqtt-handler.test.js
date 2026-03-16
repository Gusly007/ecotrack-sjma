/**
 * Tests unitaires - MqttHandler
 */
const MqttHandler = require('../../src/mqtt/mqtt-handler');

describe('MqttHandler', () => {
  let handler;
  let mockMeasurementService;
  let mockAlertService;

  beforeEach(() => {
    mockMeasurementService = {
      processMeasurement: jest.fn()
    };
    mockAlertService = {
      checkThresholds: jest.fn()
    };
    handler = new MqttHandler(mockMeasurementService, mockAlertService);
  });

  describe('handleMessage', () => {
    it('should process valid sensor data', async () => {
      const measurement = {
        id_mesure: 1,
        niveau_remplissage_pct: 75,
        batterie_pct: 90,
        temperature: 22,
        id_conteneur: 1,
        id_capteur: 1,
        uid_capteur: 'CAP-001',
        uid_conteneur: 'CNT-001',
        id_zone: 1
      };
      mockMeasurementService.processMeasurement.mockResolvedValue(measurement);
      mockAlertService.checkThresholds.mockResolvedValue([]);

      await handler.handleMessage(
        'containers/CAP-001/data',
        Buffer.from(JSON.stringify({ fill_level: 75, battery: 90, temperature: 22 }))
      );

      expect(mockMeasurementService.processMeasurement).toHaveBeenCalledWith('CAP-001', {
        niveau_remplissage_pct: 75,
        batterie_pct: 90,
        temperature: 22
      });
      expect(mockAlertService.checkThresholds).toHaveBeenCalledWith(measurement);
      expect(handler.getStats().processed).toBe(1);
    });

    it('should reject invalid topic format', async () => {
      await handler.handleMessage('invalid/topic', Buffer.from('{}'));
      expect(mockMeasurementService.processMeasurement).not.toHaveBeenCalled();
    });

    it('should reject invalid JSON payload', async () => {
      await handler.handleMessage('containers/CAP-001/data', Buffer.from('not json'));
      expect(mockMeasurementService.processMeasurement).not.toHaveBeenCalled();
      expect(handler.getStats().errors).toBe(1);
    });

    it('should reject fill_level out of range', async () => {
      await handler.handleMessage(
        'containers/CAP-001/data',
        Buffer.from(JSON.stringify({ fill_level: 150, battery: 90 }))
      );
      expect(mockMeasurementService.processMeasurement).not.toHaveBeenCalled();
      expect(handler.getStats().errors).toBe(1);
    });

    it('should reject negative battery', async () => {
      await handler.handleMessage(
        'containers/CAP-001/data',
        Buffer.from(JSON.stringify({ fill_level: 50, battery: -10 }))
      );
      expect(mockMeasurementService.processMeasurement).not.toHaveBeenCalled();
    });

    it('should reject missing required fields', async () => {
      await handler.handleMessage(
        'containers/CAP-001/data',
        Buffer.from(JSON.stringify({ fill_level: 50 }))
      );
      expect(mockMeasurementService.processMeasurement).not.toHaveBeenCalled();
    });

    it('should accept data without temperature', async () => {
      mockMeasurementService.processMeasurement.mockResolvedValue({
        id_mesure: 1,
        niveau_remplissage_pct: 50,
        batterie_pct: 80,
        temperature: null,
        id_conteneur: 1
      });
      mockAlertService.checkThresholds.mockResolvedValue([]);

      await handler.handleMessage(
        'containers/CAP-001/data',
        Buffer.from(JSON.stringify({ fill_level: 50, battery: 80 }))
      );

      expect(mockMeasurementService.processMeasurement).toHaveBeenCalledWith('CAP-001', {
        niveau_remplissage_pct: 50,
        batterie_pct: 80,
        temperature: null
      });
    });

    it('should handle sensor not found', async () => {
      mockMeasurementService.processMeasurement.mockResolvedValue(null);

      await handler.handleMessage(
        'containers/UNKNOWN/data',
        Buffer.from(JSON.stringify({ fill_level: 50, battery: 80 }))
      );

      expect(mockAlertService.checkThresholds).not.toHaveBeenCalled();
      expect(handler.getStats().errors).toBe(1);
    });
  });

  describe('_validateData', () => {
    it('should validate correct data', () => {
      const result = handler._validateData({ fill_level: 50, battery: 80, temperature: 22 });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject fill_level > 100', () => {
      const result = handler._validateData({ fill_level: 101, battery: 80 });
      expect(result.valid).toBe(false);
    });

    it('should reject battery < 0', () => {
      const result = handler._validateData({ fill_level: 50, battery: -1 });
      expect(result.valid).toBe(false);
    });

    it('should reject extreme temperature', () => {
      const result = handler._validateData({ fill_level: 50, battery: 80, temperature: 200 });
      expect(result.valid).toBe(false);
    });

    it('should allow null temperature', () => {
      const result = handler._validateData({ fill_level: 50, battery: 80, temperature: null });
      expect(result.valid).toBe(true);
    });

    it('should allow missing temperature', () => {
      const result = handler._validateData({ fill_level: 50, battery: 80 });
      expect(result.valid).toBe(true);
    });

    it('should collect multiple errors', () => {
      const result = handler._validateData({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
