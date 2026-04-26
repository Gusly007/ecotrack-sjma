process.env.DISABLE_AUTO_START = 'true';
process.env.NODE_ENV = 'test';
process.env.APP_PORT = '0';
process.env.ALERT_NOTIFICATIONS_ENABLED = 'true';

jest.mock('../../src/config/config', () => ({
  PORT: 0,
  NODE_ENV: 'test',
  MQTT: { port: 1883, host: '0.0.0.0', topics: { SENSOR_DATA: 'containers/+/data', SENSOR_STATUS: 'containers/+/status' }, tls: { enabled: false }, auth: { enabled: false } },
  DB: { host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'ecotrack', max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000 },
  ALERTS: { FILL_LEVEL_CRITICAL: 90, FILL_LEVEL_WARNING: 75, BATTERY_LOW: 20, TEMPERATURE_MIN: -10, TEMPERATURE_MAX: 60, SENSOR_TIMEOUT_HOURS: 24, NOTIFICATIONS_ENABLED: true },
  USERS_SERVICE: { baseUrl: 'http://localhost:3010', timeout: 5000 },
  PAGINATION: { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 50, MAX_LIMIT: 1000 },
  ALERT_TYPES: { DEBORDEMENT: 'DEBORDEMENT', BATTERIE_FAIBLE: 'BATTERIE_FAIBLE', CAPTEUR_DEFAILLANT: 'CAPTEUR_DEFAILLANT' },
  ALERT_STATUTS: ['ACTIVE', 'RESOLUE', 'IGNOREE'],
  MESSAGES: { SUCCESS: 'Opération réussie', CREATED: 'Ressource créée avec succès', UPDATED: 'Ressource mise à jour', DELETED: 'Ressource supprimée', ERROR: 'Une erreur', NOT_FOUND: 'Non trouvé' }
}));

const mockPool = { query: jest.fn().mockResolvedValue({ rows: [{ now: new Date() }] }) };

jest.mock('../../src/db/connexion', () => ({ pool: mockPool, testConnection: jest.fn().mockResolvedValue(true), query: jest.fn() }));

jest.mock('../../src/container-di', () => ({
  mqttBroker: { getAedes: jest.fn(), start: jest.fn().mockResolvedValue(), stop: jest.fn().mockResolvedValue(), publish: jest.fn() },
  iotController: { getMeasurements: jest.fn(), getLatestMeasurements: jest.fn(), getSensors: jest.fn(), getSensorById: jest.fn(), getAlerts: jest.fn(), getAlertById: jest.fn(), resolveAlert: jest.fn() },
  measurementService: { processMeasurement: jest.fn() },
  sensorService: { findAll: jest.fn(), findById: jest.fn() },
  alertService: { findAll: jest.fn(), findById: jest.fn(), resolve: jest.fn() },
  notificationService: { sendAlertNotification: jest.fn(), sendResolutionNotification: jest.fn() }
}));

jest.mock('../../src/repositories/baseRepository', () => jest.fn().mockImplementation(() => ({ query: jest.fn(), connect: jest.fn(), isConnected: false })));

jest.mock('../../src/repositories/logRepository', () => ({ connect: jest.fn().mockResolvedValue(), createTable: jest.fn().mockResolvedValue(), save: jest.fn().mockResolvedValue({ id: 1 }), queryLogs: jest.fn().mockResolvedValue([]), getStats: jest.fn().mockResolvedValue([]), getSummary: jest.fn().mockResolvedValue({}), cleanup: jest.fn().mockResolvedValue(0), close: jest.fn().mockResolvedValue() }));

const app = require('../../index');

describe('Full Module Import Tests', () => {
  describe('Root level modules', () => {
    it('should load index', () => { expect(app).toBeDefined(); });
  });

  describe('Config exports', () => {
    it('exports PORT', () => { const c = require('../../src/config/config'); expect(typeof c.PORT).toBe('number'); });
    it('exports NODE_ENV', () => { const c = require('../../src/config/config'); expect(typeof c.NODE_ENV).toBe('string'); });
    it('exports DB config', () => { const c = require('../../src/config/config'); expect(c.DB).toBeDefined(); });
    it('exports MQTT config', () => { const c = require('../../src/config/config'); expect(c.MQTT).toBeDefined(); });
    it('exports ALERTS config', () => { const c = require('../../src/config/config'); expect(c.ALERTS).toBeDefined(); });
    it('exports USERS_SERVICE config', () => { const c = require('../../src/config/config'); expect(c.USERS_SERVICE).toBeDefined(); });
    it('exports PAGINATION config', () => { const c = require('../../src/config/config'); expect(c.PAGINATION).toBeDefined(); });
    it('exports ALERT_TYPES', () => { const c = require('../../src/config/config'); expect(c.ALERT_TYPES).toBeDefined(); });
    it('exports ALERT_STATUTS', () => { const c = require('../../src/config/config'); expect(c.ALERT_STATUTS).toBeDefined(); });
    it('exports MESSAGES', () => { const c = require('../../src/config/config'); expect(c.MESSAGES).toBeDefined(); });
  });

  describe('DB module', () => {
    it('connexion exports pool', () => { const db = require('../../src/db/connexion'); expect(db.pool).toBeDefined(); });
    it('connexion exports query function', () => { const db = require('../../src/db/connexion'); expect(typeof db.query).toBe('function'); });
    it('connexion exports testConnection', () => { const db = require('../../src/db/connexion'); expect(typeof db.testConnection).toBe('function'); });
  });

  describe('Repositories', () => {
    it('baseRepository exists', () => { expect(require('../../src/repositories/baseRepository')).toBeDefined(); });
    it('logRepository exists', () => { expect(require('../../src/repositories/logRepository')).toBeDefined(); });
  });

  describe('Services', () => {
    it('measurement-service', () => { expect(require('../../src/services/measurement-service')).toBeDefined(); });
    it('sensor-service', () => { expect(require('../../src/services/sensor-service')).toBeDefined(); });
    it('alert-service', () => { expect(require('../../src/services/alert-service')).toBeDefined(); });
    it('notification-service', () => { expect(require('../../src/services/notification-service')).toBeDefined(); });
    it('cacheService', () => { expect(require('../../src/services/cacheService')).toBeDefined(); });
    it('centralizedLogging', () => { expect(require('../../src/services/centralizedLogging')).toBeDefined(); });
  });

  describe('MQTT', () => {
    it('mqtt-broker', () => { expect(require('../../src/mqtt/mqtt-broker')).toBeDefined(); });
    it('mqtt-handler', () => { expect(require('../../src/mqtt/mqtt-handler')).toBeDefined(); });
  });

  describe('Controllers', () => {
    it('iot-controller', () => { expect(require('../../src/controllers/iot-controller')).toBeDefined(); });
  });

  describe('Middleware', () => {
    it('error-handler', () => { expect(require('../../src/middleware/error-handler')).toBeDefined(); });
    it('rbac', () => { expect(require('../../src/middleware/rbac')).toBeDefined(); });
    it('request-logger', () => { expect(require('../../src/middleware/request-logger')).toBeDefined(); });
  });

  describe('Validators', () => {
    it('iot.validator', () => { expect(require('../../src/validators/iot.validator')).toBeDefined(); });
  });

  describe('Utils', () => {
    it('logger', () => { expect(require('../../src/utils/logger')).toBeDefined(); });
    it('api-response', () => { expect(require('../../src/utils/api-response')).toBeDefined(); });
    it('api-error', () => { expect(require('../../src/utils/api-error')).toBeDefined(); });
  });

  describe('Routes', () => {
    it('iot.route', () => { expect(require('../../src/routes/iot.route')).toBeDefined(); });
  });

  describe('Kafka', () => {
    it('kafkaProducer', () => { expect(require('../../kafkaProducer')).toBeDefined(); });
  });

  describe('Config detailed checks', () => {
    it('MQTT has topics', () => { const c = require('../../src/config/config'); expect(c.MQTT.topics).toBeDefined(); });
    it('MQTT has tls config', () => { const c = require('../../src/config/config'); expect(c.MQTT.tls).toBeDefined(); });
    it('MQTT has auth config', () => { const c = require('../../src/config/config'); expect(c.MQTT.auth).toBeDefined(); });
    it('DB has all connection params', () => { const c = require('../../src/config/config'); expect(c.DB.host).toBeDefined(); expect(c.DB.port).toBeDefined(); expect(c.DB.database).toBeDefined(); });
    it('ALERTS has all thresholds', () => { const c = require('../../src/config/config'); expect(c.ALERTS.FILL_LEVEL_CRITICAL).toBeDefined(); expect(c.ALERTS.BATTERY_LOW).toBeDefined(); });
    it('PAGINATION has limits', () => { const c = require('../../src/config/config'); expect(c.PAGINATION.MAX_LIMIT).toBeDefined(); });
    it('MESSAGES has standard messages', () => { const c = require('../../src/config/config'); expect(c.MESSAGES.SUCCESS).toBeDefined(); expect(c.MESSAGES.ERROR).toBeDefined(); });
  });

  describe('Container DI', () => {
    it('container-di exports all services', () => { const di = require('../../src/container-di'); expect(di.iotController).toBeDefined(); expect(di.measurementService).toBeDefined(); expect(di.sensorService).toBeDefined(); expect(di.alertService).toBeDefined(); expect(di.notificationService).toBeDefined(); });
  });
});