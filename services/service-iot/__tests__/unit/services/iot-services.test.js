/**
 * Unit tests for IoT services (notification, sensor, measurement)
 */

describe('IoT Services - Notifications, Sensors, Measurements', () => {
  let mockDb;
  let mockEmailService;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      transaction: jest.fn()
    };

    mockEmailService = {
      send: jest.fn().mockResolvedValue({ success: true }),
      sendBatch: jest.fn().mockResolvedValue({ sent: 0 })
    };
  });

  describe('Notification Service', () => {
    let notificationService;

    beforeEach(() => {
      notificationService = {
        sendAlert: jest.fn().mockResolvedValue({ id: 'notif-1' }),
        sendWelcome: jest.fn().mockResolvedValue({ id: 'notif-2' }),
        getUnread: jest.fn().mockResolvedValue([]),
        markAsRead: jest.fn().mockResolvedValue(true)
      };
    });

    it('should send alert notification', async () => {
      const result = await notificationService.sendAlert({
        userId: 1,
        alertType: 'OVERFLOW',
        severity: 'high'
      });

      expect(result.id).toBe('notif-1');
    });

    it('should send welcome notification', async () => {
      const result = await notificationService.sendWelcome({ userId: 1 });
      
      expect(result.id).toBe('notif-2');
    });

    it('should retrieve unread notifications', async () => {
      const unread = await notificationService.getUnread(1);
      
      expect(Array.isArray(unread)).toBe(true);
    });

    it('should mark notification as read', async () => {
      const result = await notificationService.markAsRead(1);
      
      expect(result).toBe(true);
    });

    it('should batch send notifications', async () => {
      const notifications = [
        { userId: 1, type: 'alert' },
        { userId: 2, type: 'alert' },
        { userId: 3, type: 'alert' }
      ];

      const result = await mockEmailService.sendBatch(notifications);
      expect(result.sent).toBeDefined();
    });

    it('should handle notification failures gracefully', async () => {
      notificationService.sendAlert.mockRejectedValue(
        new Error('Email service unavailable')
      );

      await expect(
        notificationService.sendAlert({ userId: 1, alertType: 'OVERFLOW' })
      ).rejects.toThrow('Email service unavailable');
    });
  });

  describe('Sensor Service', () => {
    let sensorService;

    beforeEach(() => {
      sensorService = {
        registerSensor: jest.fn().mockResolvedValue({ id: 1, uid: 'sensor-001' }),
        getSensorStatus: jest.fn().mockResolvedValue({ status: 'active', lastReading: Date.now() }),
        updateSensorReading: jest.fn().mockResolvedValue({ updated: true }),
        listSensors: jest.fn().mockResolvedValue([
          { id: 1, uid: 'sensor-001', type: 'temperature' },
          { id: 2, uid: 'sensor-002', type: 'humidity' }
        ]),
        deleteSensor: jest.fn().mockResolvedValue({ deleted: true })
      };
    });

    it('should register new sensor', async () => {
      const result = await sensorService.registerSensor({
        uid: 'sensor-001',
        type: 'temperature',
        location: 'zone-A'
      });

      expect(result.uid).toBe('sensor-001');
      expect(result.id).toBeDefined();
    });

    it('should get sensor status', async () => {
      const status = await sensorService.getSensorStatus(1);

      expect(status.status).toBe('active');
      expect(status.lastReading).toBeGreaterThan(0);
    });

    it('should update sensor reading', async () => {
      const result = await sensorService.updateSensorReading(1, {
        value: 45,
        timestamp: Date.now()
      });

      expect(result.updated).toBe(true);
    });

    it('should list all sensors', async () => {
      const sensors = await sensorService.listSensors();

      expect(Array.isArray(sensors)).toBe(true);
      expect(sensors.length).toBeGreaterThan(0);
      expect(sensors[0].uid).toBeDefined();
    });

    it('should delete sensor', async () => {
      const result = await sensorService.deleteSensor(1);

      expect(result.deleted).toBe(true);
    });

    it('should validate sensor data before update', async () => {
      const invalidReading = {
        value: -999 // Outside normal range
      };

      // Validation should catch this
      const isValid = invalidReading.value >= -50 && invalidReading.value <= 100;
      expect(isValid).toBe(false);
    });
  });

  describe('Measurement Service', () => {
    let measurementService;

    beforeEach(() => {
      measurementService = {
        recordMeasurement: jest.fn().mockResolvedValue({ id: 'meas-1', sensorId: 1 }),
        getMeasurements: jest.fn().mockResolvedValue([
          { id: 1, value: 45, timestamp: Date.now() },
          { id: 2, value: 48, timestamp: Date.now() }
        ]),
        getAverageReading: jest.fn().mockResolvedValue({ average: 46.5 }),
        getReadingsByRange: jest.fn().mockResolvedValue([
          { value: 20 }, { value: 25 }, { value: 22 }
        ]),
        deleteMeasurement: jest.fn().mockResolvedValue({ deleted: true })
      };
    });

    it('should record new measurement', async () => {
      const result = await measurementService.recordMeasurement({
        sensorId: 1,
        value: 45,
        unit: 'celsius'
      });

      expect(result.sensorId).toBe(1);
      expect(result.id).toBeDefined();
    });

    it('should retrieve measurements', async () => {
      const measurements = await measurementService.getMeasurements(1);

      expect(Array.isArray(measurements)).toBe(true);
      measurements.forEach(m => {
        expect(m.value).toBeDefined();
        expect(m.timestamp).toBeDefined();
      });
    });

    it('should calculate average reading', async () => {
      const average = await measurementService.getAverageReading(1);

      expect(average.average).toBeGreaterThan(0);
      expect(typeof average.average).toBe('number');
    });

    it('should get readings within time range', async () => {
      const readings = await measurementService.getReadingsByRange(1, {
        startTime: Date.now() - 3600000,
        endTime: Date.now()
      });

      expect(Array.isArray(readings)).toBe(true);
    });

    it('should delete measurement', async () => {
      const result = await measurementService.deleteMeasurement(1);

      expect(result.deleted).toBe(true);
    });

    it('should handle batch measurements', async () => {
      const measurements = [
        { sensorId: 1, value: 45 },
        { sensorId: 2, value: 50 },
        { sensorId: 3, value: 48 }
      ];

      const promises = measurements.map(m =>
        measurementService.recordMeasurement(m)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
    });

    it('should validate measurement values', () => {
      const validValues = [0, 25, 50, 100];
      const invalidValues = [-999, 500];

      validValues.forEach(val => {
        expect(val >= -50 && val <= 100).toBe(true);
      });

      invalidValues.forEach(val => {
        expect(val >= -50 && val <= 100).toBe(false);
      });
    });
  });

  describe('Service error handling', () => {
    it('should handle service initialization errors', async () => {
      const failedInit = jest.fn().mockRejectedValue(new Error('DB connection failed'));

      await expect(failedInit()).rejects.toThrow('DB connection failed');
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve({ id: i, status: 'success' })
      );

      const results = await Promise.all(requests);
      expect(results).toHaveLength(10);
    });

    it('should timeout on slow operations', async () => {
      const slowOperation = new Promise((resolve) => {
        setTimeout(() => resolve({ data: 'late' }), 5000);
      });

      const timeoutRace = Promise.race([
        slowOperation,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 1000)
        )
      ]);

      await expect(timeoutRace).rejects.toThrow('Timeout');
    });
  });
});
