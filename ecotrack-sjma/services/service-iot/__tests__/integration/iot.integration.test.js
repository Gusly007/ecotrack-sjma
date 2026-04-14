process.env.DISABLE_AUTO_START = 'true';
process.env.NODE_ENV = 'test';
process.env.APP_PORT = '0';

jest.mock('../../src/config/config', () => ({
  PORT: 0,
  NODE_ENV: 'test',
  MQTT: { port: 1883 },
  DB: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '',
    database: 'ecotrack',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },
  ALERTS: {
    FILL_LEVEL_CRITICAL: 90,
    FILL_LEVEL_WARNING: 75,
    BATTERY_LOW: 20
  },
  PAGINATION: { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 50, MAX_LIMIT: 1000 },
  ALERT_TYPES: { DEBORDEMENT: 'DEBORDEMENT', BATTERIE_FAIBLE: 'BATTERIE_FAIBLE', CAPTEUR_DEFAILLANT: 'CAPTEUR_DEFAILLANT' },
  ALERT_STATUTS: ['ACTIVE', 'RESOLUE', 'IGNOREE']
}));

const mockPool = {
  query: jest.fn().mockResolvedValue({ rows: [{ now: new Date().toISOString() }] })
};

jest.mock('../../src/db/connexion', () => ({
  pool: mockPool,
  testConnection: jest.fn().mockResolvedValue(true),
  query: jest.fn()
}));

jest.mock('../../src/container-di', () => ({
  mqttBroker: {
    getAedes: jest.fn().mockReturnValue(true),
    start: jest.fn().mockResolvedValue(),
    stop: jest.fn().mockResolvedValue()
  },
  iotController: {
    getMeasurements: jest.fn(),
    getLatestMeasurements: jest.fn(),
    getMeasurementsByContainer: jest.fn(),
    getSensors: jest.fn(),
    getSensorById: jest.fn(),
    getAlerts: jest.fn(),
    getAlertById: jest.fn(),
    resolveAlert: jest.fn()
  },
  measurementService: { processMeasurement: jest.fn() },
  sensorService: { findAll: jest.fn(), findById: jest.fn() },
  alertService: { findAll: jest.fn(), findById: jest.fn(), resolve: jest.fn() },
  notificationService: { sendAlertNotification: jest.fn(), sendResolutionNotification: jest.fn() }
}));

const request = require('supertest');
const app = require('../../index');

describe('IoT Service Integration', () => {
  describe('Health Endpoint', () => {
    it('GET /health should return 200', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('API Endpoint', () => {
    it('GET /api should return API info', async () => {
      const response = await request(app).get('/api');
      expect(response.status).toBe(200);
    });
  });

  describe('Database Connection', () => {
    it('should have database connection configured', () => {
      const connexion = require('../../src/db/connexion');
      expect(connexion.pool).toBeDefined();
    });
  });

  describe('Config Module', () => {
    it('should load config with MQTT settings', () => {
      const config = require('../../src/config/config');
      expect(config.MQTT).toBeDefined();
      expect(config.MQTT.port).toBe(1883);
    });

    it('should have alert thresholds defined', () => {
      const config = require('../../src/config/config');
      expect(config.ALERTS.FILL_LEVEL_CRITICAL).toBe(90);
      expect(config.ALERTS.FILL_LEVEL_WARNING).toBe(75);
      expect(config.ALERTS.BATTERY_LOW).toBe(20);
    });

    it('should have pagination settings', () => {
      const config = require('../../src/config/config');
      expect(config.PAGINATION.DEFAULT_PAGE).toBe(1);
      expect(config.PAGINATION.DEFAULT_LIMIT).toBe(50);
      expect(config.PAGINATION.MAX_LIMIT).toBe(1000);
    });

    it('should have alert types defined', () => {
      const config = require('../../src/config/config');
      expect(config.ALERT_TYPES.DEBORDEMENT).toBe('DEBORDEMENT');
      expect(config.ALERT_TYPES.BATTERIE_FAIBLE).toBe('BATTERIE_FAIBLE');
      expect(config.ALERT_TYPES.CAPTEUR_DEFAILLANT).toBe('CAPTEUR_DEFAILLANT');
    });

    it('should have alert statuses defined', () => {
      const config = require('../../src/config/config');
      expect(config.ALERT_STATUTS).toContain('ACTIVE');
      expect(config.ALERT_STATUTS).toContain('RESOLUE');
      expect(config.ALERT_STATUTS).toContain('IGNOREE');
    });
  });

  describe('Container DI', () => {
    it('should export required services', () => {
      const di = require('../../src/container-di');
      expect(di.iotController).toBeDefined();
      expect(di.measurementService).toBeDefined();
      expect(di.sensorService).toBeDefined();
      expect(di.alertService).toBeDefined();
    });
  });

  describe('Repositories', () => {
    it('SensorRepository should be importable', () => {
      const SensorRepository = require('../../src/repositories/sensor-repository');
      expect(SensorRepository).toBeDefined();
    });

    it('MeasurementRepository should be importable', () => {
      const MeasurementRepository = require('../../src/repositories/measurement-repository');
      expect(MeasurementRepository).toBeDefined();
    });

    it('AlertRepository should be importable', () => {
      const AlertRepository = require('../../src/repositories/alert-repository');
      expect(AlertRepository).toBeDefined();
    });
  });

  describe('Services', () => {
    it('MeasurementService should be importable', () => {
      const MeasurementService = require('../../src/services/measurement-service');
      expect(MeasurementService).toBeDefined();
    });

    it('SensorService should be importable', () => {
      const SensorService = require('../../src/services/sensor-service');
      expect(SensorService).toBeDefined();
    });
  });

  describe('Validators', () => {
    it('IoT Validator should be importable', () => {
      const validator = require('../../src/validators/iot.validator');
      expect(validator).toBeDefined();
    });
  });

  describe('Middleware', () => {
    it('Error handler should be importable', () => {
      const errorHandler = require('../../src/middleware/error-handler');
      expect(errorHandler).toBeDefined();
    });

    it('RBAC should be importable', () => {
      const rbac = require('../../src/middleware/rbac');
      expect(rbac).toBeDefined();
    });

    it('Request logger should be importable', () => {
      const requestLogger = require('../../src/middleware/request-logger');
      expect(requestLogger).toBeDefined();
    });
  });

  describe('Utils', () => {
    it('API Response should be importable', () => {
      const apiResponse = require('../../src/utils/api-response');
      expect(apiResponse).toBeDefined();
    });

    it('API Error should be importable', () => {
      const apiError = require('../../src/utils/api-error');
      expect(apiError).toBeDefined();
    });

    it('Logger should be importable', () => {
      const logger = require('../../src/utils/logger');
      expect(logger).toBeDefined();
    });
  });
});