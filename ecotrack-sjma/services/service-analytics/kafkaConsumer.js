const { Kafka } = require('kafkajs');
const logger = require('./src/utils/logger.js');

const kafka = new Kafka({
  clientId: 'service-analytics',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const consumer = kafka.consumer({ groupId: 'analytics-group' });
let isRunning = false;

const TOPICS = {
  SENSOR_DATA: 'ecotrack.sensor.data',
  ALERTS: 'ecotrack.alerts',
  CONTAINER_STATUS: 'ecotrack.container.status'
};

const handlers = {
  onSensorData: null,
  onAlert: null,
  onContainerStatus: null
};

const connect = async () => {
  if (isRunning) return;
  try {
    await consumer.connect();
    isRunning = true;
    logger.info({ brokers: kafka.brokers }, 'Kafka Consumer connected');

    await consumer.subscribe({ 
      topics: Object.values(TOPICS), 
      fromBeginning: false 
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = JSON.parse(message.value.toString());
          const timestamp = value.timestamp || new Date().toISOString();
          
          switch (topic) {
            case TOPICS.SENSOR_DATA:
              if (handlers.onSensorData) {
                await handlers.onSensorData(value.data, { topic, partition, timestamp });
              }
              break;
            case TOPICS.ALERTS:
              if (handlers.onAlert) {
                await handlers.onAlert(value.alert, { topic, partition, timestamp });
              }
              break;
            case TOPICS.CONTAINER_STATUS:
              if (handlers.onContainerStatus) {
                await handlers.onContainerStatus(value, { topic, partition, timestamp });
              }
              break;
          }
        } catch (err) {
          logger.error({ err: err.message, topic }, 'Error processing Kafka message');
        }
      }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Kafka Consumer connection failed');
    isRunning = false;
  }
};

const disconnect = async () => {
  if (!isRunning) return;
  try {
    await consumer.disconnect();
    isRunning = false;
    logger.info('Kafka Consumer disconnected');
  } catch (err) {
    logger.error({ err: err.message }, 'Kafka Consumer disconnect failed');
  }
};

const onSensorData = (handler) => {
  handlers.onSensorData = handler;
};

const onAlert = (handler) => {
  handlers.onAlert = handler;
};

const onContainerStatus = (handler) => {
  handlers.onContainerStatus = handler;
};

module.exports = {
  connect,
  disconnect,
  onSensorData,
  onAlert,
  onContainerStatus,
  TOPICS,
  isRunning: () => isRunning
};
