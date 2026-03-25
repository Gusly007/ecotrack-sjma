const { Kafka } = require('kafkajs');
const logger = require('./src/utils/logger.js');

const kafka = new Kafka({
  clientId: 'service-iot',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer = kafka.producer();
let isConnected = false;

const TOPICS = {
  SENSOR_DATA: 'ecotrack.sensor.data',
  ALERTS: 'ecotrack.alerts',
  CONTAINER_STATUS: 'ecotrack.container.status',
  NOTIFICATIONS: 'ecotrack.notifications'
};

const connect = async () => {
  if (isConnected) return;
  try {
    await producer.connect();
    isConnected = true;
    logger.info({ brokers: kafka.brokers }, 'Kafka Producer connected');
  } catch (err) {
    logger.error({ err: err.message }, 'Kafka Producer connection failed');
    isConnected = false;
  }
};

const disconnect = async () => {
  if (!isConnected) return;
  try {
    await producer.disconnect();
    isConnected = false;
    logger.info('Kafka Producer disconnected');
  } catch (err) {
    logger.error({ err: err.message }, 'Kafka Producer disconnect failed');
  }
};

const sendSensorData = async (sensorData) => {
  if (!isConnected) {
    logger.warn({ topic: TOPICS.SENSOR_DATA }, 'Kafka Producer not connected, skipping message');
    return false;
  }
  try {
    await producer.send({
      topic: TOPICS.SENSOR_DATA,
      messages: [
        {
          key: String(sensorData.capteur_id || sensorData.capteurId),
          value: JSON.stringify({
            timestamp: new Date().toISOString(),
            data: sensorData
          })
        }
      ]
    });
    return true;
  } catch (err) {
    logger.error({ err: err.message, topic: TOPICS.SENSOR_DATA }, 'Failed to send sensor data to Kafka');
    return false;
  }
};

const sendAlert = async (alert) => {
  if (!isConnected) {
    logger.warn({ topic: TOPICS.ALERTS }, 'Kafka Producer not connected, skipping alert');
    return false;
  }
  try {
    await producer.send({
      topic: TOPICS.ALERTS,
      messages: [
        {
          key: String(alert.conteneur_id || alert.conteneurId),
          value: JSON.stringify({
            timestamp: new Date().toISOString(),
            alert
          })
        }
      ]
    });
    return true;
  } catch (err) {
    logger.error({ err: err.message, topic: TOPICS.ALERTS }, 'Failed to send alert to Kafka');
    return false;
  }
};

const sendContainerStatus = async (containerId, status) => {
  if (!isConnected) return false;
  try {
    await producer.send({
      topic: TOPICS.CONTAINER_STATUS,
      messages: [
        {
          key: String(containerId),
          value: JSON.stringify({
            timestamp: new Date().toISOString(),
            containerId,
            status
          })
        }
      ]
    });
    return true;
  } catch (err) {
    logger.error({ err: err.message, topic: TOPICS.CONTAINER_STATUS }, 'Failed to send container status to Kafka');
    return false;
  }
};

module.exports = {
  connect,
  disconnect,
  sendSensorData,
  sendAlert,
  sendContainerStatus,
  TOPICS,
  isConnected: () => isConnected
};
