import { Kafka } from 'kafkajs';
import logger from '../utils/logger.js';

const kafka = new Kafka({
  clientId: 'service-users',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const consumer = kafka.consumer({ groupId: 'users-notifications-group' });
let isRunning = false;

const TOPICS = {
  ALERTS: 'ecotrack.alerts',
  NOTIFICATIONS: 'ecotrack.notifications'
};

const handlers = {
  onAlert: null,
  onNotification: null
};

export const connectKafkaConsumer = async () => {
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
          
          switch (topic) {
            case TOPICS.ALERTS:
              if (handlers.onAlert) {
                await handlers.onAlert(value.alert, { topic, partition, timestamp: value.timestamp });
              }
              break;
            case TOPICS.NOTIFICATIONS:
              if (handlers.onNotification) {
                await handlers.onNotification(value, { topic, partition, timestamp: value.timestamp });
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

export const disconnectKafkaConsumer = async () => {
  if (!isRunning) return;
  try {
    await consumer.disconnect();
    isRunning = false;
    logger.info('Kafka Consumer disconnected');
  } catch (err) {
    logger.error({ err: err.message }, 'Kafka Consumer disconnect failed');
  }
};

export const onAlert = (handler) => {
  handlers.onAlert = handler;
};

export const onNotification = (handler) => {
  handlers.onNotification = handler;
};

export const isKafkaRunning = () => isRunning;

export default {
  connect: connectKafkaConsumer,
  disconnect: disconnectKafkaConsumer,
  onAlert,
  onNotification,
  isRunning: isKafkaRunning,
  TOPICS
};
