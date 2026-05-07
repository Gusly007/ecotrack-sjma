'use strict';

const { Kafka } = require('kafkajs');
const logger = require('./src/utils/logger');

const kafka = new Kafka({
  clientId: 'service-routes',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  retry: { initialRetryTime: 100, retries: 8 }
});

const producer = kafka.producer();
let isConnected = false;

const TOPICS = {
  SIGNALEMENTS: 'ecotrack.signalements.nouveau'
};

const connect = async () => {
  if (isConnected) return;
  try {
    await producer.connect();
    isConnected = true;
    logger.info({ brokers: process.env.KAFKA_BROKERS || 'localhost:9092' }, 'Kafka Producer connecté');
  } catch (err) {
    logger.error({ err: err.message }, 'Kafka Producer — connexion échouée');
    isConnected = false;
  }
};

const disconnect = async () => {
  if (!isConnected) return;
  try {
    await producer.disconnect();
    isConnected = false;
    logger.info('Kafka Producer déconnecté');
  } catch (err) {
    logger.error({ err: err.message }, 'Kafka Producer — déconnexion échouée');
  }
};

/**
 * Publie un nouveau signalement sur le topic ecotrack.signalements.nouveau.
 * Utilisé par le service-notification-gestionnaire pour notifier automatiquement
 * le gestionnaire de la zone concernée.
 *
 * @param {object} signalement - Ligne insérée en base
 */
const sendSignalement = async (signalement) => {
  if (!isConnected) {
    logger.warn({ topic: TOPICS.SIGNALEMENTS }, 'Kafka non connecté — événement signalement ignoré');
    return false;
  }

  try {
    await producer.send({
      topic: TOPICS.SIGNALEMENTS,
      messages: [
        {
          key: String(signalement.id_conteneur),
          value: JSON.stringify({
            timestamp: new Date().toISOString(),
            signalement: {
              id_signalement: signalement.id_signalement,
              description:    signalement.description,
              id_conteneur:   signalement.id_conteneur,
              id_citoyen:     signalement.id_citoyen,
              id_type:        signalement.id_type,
              statut:         signalement.statut
            }
          })
        }
      ]
    });

    logger.info(
      { id_signalement: signalement.id_signalement, id_conteneur: signalement.id_conteneur },
      'Événement signalement publié sur Kafka'
    );
    return true;
  } catch (err) {
    logger.error({ err: err.message, topic: TOPICS.SIGNALEMENTS }, 'Kafka — envoi signalement échoué');
    return false;
  }
};

module.exports = {
  connect,
  disconnect,
  sendSignalement,
  TOPICS,
  isConnected: () => isConnected
};
