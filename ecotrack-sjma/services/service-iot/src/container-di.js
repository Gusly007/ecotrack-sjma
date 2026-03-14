/**
 * Dependency Injection container pour le service IoT
 */
const pool = require('./db/connexion').pool;

// Repositories
const MeasurementRepository = require('./repositories/measurement-repository');
const SensorRepository = require('./repositories/sensor-repository');
const AlertRepository = require('./repositories/alert-repository');

// Services
const MeasurementService = require('./services/measurement-service');
const SensorService = require('./services/sensor-service');
const AlertService = require('./services/alert-service');
const NotificationService = require('./services/notification-service');

// MQTT
const MqttHandler = require('./mqtt/mqtt-handler');
const MqttBroker = require('./mqtt/mqtt-broker');

// Controller
const IotController = require('./controllers/iot-controller');

// Instanciation des repositories
const measurementRepository = new MeasurementRepository(pool);
const sensorRepository = new SensorRepository(pool);
const alertRepository = new AlertRepository(pool);

// Instanciation des services
const notificationService = new NotificationService();
const measurementService = new MeasurementService(measurementRepository, sensorRepository);
const sensorService = new SensorService(sensorRepository);
const alertService = new AlertService(alertRepository, sensorRepository, notificationService);

// MQTT Handler
const mqttHandler = new MqttHandler(measurementService, alertService);

// MQTT Broker
const mqttBroker = new MqttBroker(mqttHandler);

// Controller
const iotController = new IotController(measurementService, sensorService, alertService, mqttHandler);

module.exports = {
  iotController,
  measurementService,
  sensorService,
  alertService,
  notificationService,
  mqttHandler,
  mqttBroker,
  // Pour les tests
  measurementRepository,
  sensorRepository,
  alertRepository
};
