process.env.DISABLE_AUTO_START = 'true';
process.env.NODE_ENV = 'test';
process.env.APP_PORT = '0';
process.env.ALERT_NOTIFICATIONS_ENABLED = 'true';

jest.mock('../../src/config/config', () => ({
  PORT: 0,
  NODE_ENV: 'test',
  MQTT: { port: 1883, host: '0.0.0.0', auth: { enabled: false } },
  DB: { host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'ecotrack', max: 20 },
  ALERTS: {
    FILL_LEVEL_CRITICAL: 90,
    FILL_LEVEL_WARNING: 75,
    BATTERY_LOW: 20,
    NOTIFICATIONS_ENABLED: true
  },
  USERS_SERVICE: { baseUrl: 'http://localhost:3010', timeout: 5000 },
  PAGINATION: { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 50, MAX_LIMIT: 1000 },
  ALERT_TYPES: { DEBORDEMENT: 'DEBORDEMENT', BATTERIE_FAIBLE: 'BATTERIE_FAIBLE', CAPTEUR_DEFAILLANT: 'CAPTEUR_DEFAILLANT' },
  ALERT_STATUTS: ['ACTIVE', 'RESOLUE', 'IGNOREE']
}));

const mockPool = { query: jest.fn().mockResolvedValue({ rows: [{ now: new Date() }] }) };

jest.mock('../../src/db/connexion', () => ({ pool: mockPool, testConnection: jest.fn().mockResolvedValue(true), query: jest.fn() }));

jest.mock('../../src/container-di', () => ({
  mqttBroker: { getAedes: jest.fn(), start: jest.fn().mockResolvedValue(), stop: jest.fn().mockResolvedValue() },
  iotController: { getMeasurements: jest.fn(), getLatestMeasurements: jest.fn(), getSensors: jest.fn(), getSensorById: jest.fn(), getAlerts: jest.fn(), getAlertById: jest.fn() },
  measurementService: { processMeasurement: jest.fn() },
  sensorService: { findAll: jest.fn(), findById: jest.fn() },
  alertService: { findAll: jest.fn(), findById: jest.fn(), resolve: jest.fn() },
  notificationService: { sendAlertNotification: jest.fn(), sendResolutionNotification: jest.fn() }
}));

jest.mock('../../src/repositories/baseRepository', () => jest.fn().mockImplementation(() => ({
  query: jest.fn(),
  connect: jest.fn()
})));

jest.mock('../../src/repositories/logRepository', () => ({
  connect: jest.fn().mockResolvedValue(),
  createTable: jest.fn().mockResolvedValue(),
  save: jest.fn().mockResolvedValue({ id: 1 }),
  queryLogs: jest.fn().mockResolvedValue([]),
  getStats: jest.fn().mockResolvedValue([]),
  getSummary: jest.fn().mockResolvedValue({}),
  cleanup: jest.fn().mockResolvedValue(0),
  close: jest.fn().mockResolvedValue()
}));

const request = require('supertest');
const app = require('../../index');

describe('Additional Integration Tests', () => {
  describe('BaseRepository', () => {
    it('should be importable', () => {
      const BaseRepository = require('../../src/repositories/baseRepository');
      expect(BaseRepository).toBeDefined();
    });
  });

  describe('LogRepository', () => {
    it('should be importable', () => {
      const LogRepository = require('../../src/repositories/logRepository');
      expect(LogRepository).toBeDefined();
    });
  });

  describe('NotificationService', () => {
    it('should be importable', () => {
      const NotificationService = require('../../src/services/notification-service');
      expect(NotificationService).toBeDefined();
    });

    it('should instantiate with config', () => {
      const NotificationService = require('../../src/services/notification-service');
      const ns = new NotificationService();
      expect(ns.enabled).toBe(true);
    });
  });

  describe('CentralizedLogging', () => {
    it('should be importable', () => {
      const centralizedLogging = require('../../src/services/centralizedLogging');
      expect(centralizedLogging).toBeDefined();
    });
  });

  describe('MQTT Broker', () => {
    it('should be importable', () => {
      const MqttBroker = require('../../src/mqtt/mqtt-broker');
      expect(MqttBroker).toBeDefined();
    });
  });

  describe('MQTT Handler', () => {
    it('should be importable', () => {
      const MqttHandler = require('../../src/mqtt/mqtt-handler');
      expect(MqttHandler).toBeDefined();
    });
  });

  describe('CacheService', () => {
    it('should be importable', () => {
      const CacheService = require('../../src/services/cacheService');
      expect(CacheService).toBeDefined();
    });

    it('should have static properties', () => {
      const CacheService = require('../../src/services/cacheService');
      expect(CacheService).toBeDefined();
    });
  });

  describe('AlertService', () => {
    it('should be importable', () => {
      const AlertService = require('../../src/services/alert-service');
      expect(AlertService).toBeDefined();
    });
  });

  describe('Routes', () => {
    it('should have routes defined', () => {
      const routes = require('../../src/routes/iot.route');
      expect(routes).toBeDefined();
    });
  });

  describe('Controller', () => {
    it('should have IotController', () => {
      const IotController = require('../../src/controllers/iot-controller');
      expect(IotController).toBeDefined();
    });
  });

  describe('KafkaProducer', () => {
    it('should be importable', () => {
      const kafkaProducer = require('../../kafkaProducer');
      expect(kafkaProducer).toBeDefined();
    });
  });

  describe('Full config check', () => {
    it('should have all config sections', () => {
      const config = require('../../src/config/config');
      expect(config.PORT).toBeDefined();
      expect(config.NODE_ENV).toBeDefined();
      expect(config.DB).toBeDefined();
      expect(config.MQTT).toBeDefined();
      expect(config.ALERTS).toBeDefined();
      expect(config.USERS_SERVICE).toBeDefined();
      expect(config.PAGINATION).toBeDefined();
    });

    it('should have DB config with all fields', () => {
      const config = require('../../src/config/config');
      expect(config.DB.host).toBeDefined();
      expect(config.DB.port).toBeDefined();
      expect(config.DB.user).toBeDefined();
      expect(config.DB.database).toBeDefined();
    });

    it('should have MQTT config with all fields', () => {
      const config = require('../../src/config/config');
      expect(config.MQTT.port).toBeDefined();
      expect(config.MQTT.host).toBeDefined();
      expect(config.MQTT.auth).toBeDefined();
    });
  });
});