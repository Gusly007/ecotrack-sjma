'use strict';

require('dotenv').config();

const { Kafka } = require('kafkajs');
const logger = require('./src/utils/logger');

const kafka = new Kafka({
  clientId: 'service-notification-gestionnaire-admin',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  retry: { initialRetryTime: 100, retries: 8 }
});

const producer = kafka.producer();
let isConnected = false;

const ADMIN_TOPIC = 'ecotrack.admin.notifications';

const connect = async () => {
  if (isConnected) return;
  try {
    await producer.connect();
    isConnected = true;
    logger.info({ brokers: kafka.brokers, topic: ADMIN_TOPIC }, 'Kafka Admin Producer connecté');
  } catch (err) {
    logger.error({ err: err.message }, 'Kafka Admin Producer connexion échouée');
    isConnected = false;
  }
};

const disconnect = async () => {
  if (!isConnected) return;
  try {
    await producer.disconnect();
    isConnected = false;
    logger.info('Kafka Admin Producer déconnecté');
  } catch (err) {
    logger.error({ err: err.message }, 'Kafka Admin Producer déconnexion échouée');
  }
};

const sendAdminNotification = async (notification) => {
  if (!isConnected) {
    logger.warn({ topic: ADMIN_TOPIC }, 'Kafka Admin Producer non connecté');
    return false;
  }
  try {
    await producer.send({
      topic: ADMIN_TOPIC,
      messages: [{
        key: String(notification.id_notification || notification.notification?.id_notification || Date.now()),
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'admin-notification-service',
          ...notification
        })
      }]
    });
    return true;
  } catch (err) {
    logger.error({ err: err.message, topic: ADMIN_TOPIC }, 'Envoi Kafka admin échoué');
    return false;
  }
};

const sendAdminEvent = async (event) => {
  if (!isConnected) return false;
  try {
    await producer.send({
      topic: ADMIN_TOPIC,
      messages: [{
        key: event.type || 'admin-event',
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: event.source || 'external',
          type: event.type,
          data: event.data
        })
      }]
    });
    return true;
  } catch (err) {
    logger.error({ err: err.message, topic: ADMIN_TOPIC }, 'Envoi événement admin Kafka échoué');
    return false;
  }
};

module.exports = {
  connect,
  disconnect,
  sendAdminNotification,
  sendAdminEvent,
  ADMIN_TOPIC,
  isConnected: () => isConnected
};
