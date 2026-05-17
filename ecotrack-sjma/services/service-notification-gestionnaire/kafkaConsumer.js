'use strict';

require('dotenv').config();

const { Kafka } = require('kafkajs');
const logger = require('./src/utils/logger');
const notificationService = require('./src/services/notification.service');
const adminNotificationService = require('./src/services/adminNotificationService');
const zoneRepository = require('./src/repositories/zone.repository');

// ─── Client Kafka ─────────────────────────────────────────────
const kafka = new Kafka({
  clientId: 'service-notification-gestionnaire',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  retry: { initialRetryTime: 100, retries: 8 }
});

const consumer = kafka.consumer({
  groupId: 'notification-gestionnaire-group'
});

let isRunning = false;

// ─── Topics écoutés ───────────────────────────────────────────
const TOPICS = {
  ALERTS:             'ecotrack.alerts',
  SIGNALEMENTS:       'ecotrack.signalements.nouveau',
  ADMIN_NOTIFICATIONS: 'ecotrack.admin.notifications'
};

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Construit le tableau de notifications à créer pour les responsables d'une zone.
 * Retourne [] si la zone n'a aucun responsable assigné.
 */
async function buildNotificationsForContainer(id_conteneur, type, titre, corps) {
  const zone = await zoneRepository.findResponsablesByContainer(id_conteneur);

  if (!zone) {
    logger.warn({ id_conteneur }, 'Conteneur sans zone — notification ignorée');
    return [];
  }

  const { id_gestionnaire, zone_nom, zone_code } = zone;

  if (!id_gestionnaire) return [];

  const titreZone = `[${zone_code}] ${titre}`;
  const corpsZone = `Zone : ${zone_nom}\n${corps}`;

  return [{ id_utilisateur: id_gestionnaire, type, titre: titreZone, corps: corpsZone }];
}

// ─── Handlers par topic ───────────────────────────────────────

/**
 * Traite un event ecotrack.alerts
 * Payload : { timestamp, alert: { id_alerte, type_alerte, description, id_conteneur, ... } }
 */
async function handleAlert(payload) {
  const alert = payload.alert || payload;

  if (!alert.id_conteneur) {
    logger.warn({ payload }, 'Alert sans id_conteneur — ignorée');
    return;
  }

  const titre = `Alerte : ${alert.type_alerte || 'Zone'}`;
  const corps = alert.description || `Valeur détectée : ${alert.valeur_detectee} (seuil : ${alert.seuil})`;

  const notifications = await buildNotificationsForContainer(
    alert.id_conteneur,
    'ALERTE',
    titre,
    corps
  );

  if (notifications.length === 0) return;

  await notificationService.createBulkNotifications(notifications);

  logger.info(
    { id_conteneur: alert.id_conteneur, type_alerte: alert.type_alerte, count: notifications.length },
    'Notifications ALERTE créées automatiquement'
  );
}

/**
 * Traite un event ecotrack.signalements.nouveau
 * Payload : { timestamp, signalement: { id_signalement, description, id_conteneur, id_citoyen, statut } }
 */
async function handleSignalement(payload) {
  const signalement = payload.signalement || payload;

  if (!signalement.id_conteneur) {
    logger.warn({ payload }, 'Signalement sans id_conteneur — ignoré');
    return;
  }

  const titre = `Nouveau signalement #${signalement.id_signalement || '?'}`;
  const corps = signalement.description || 'Un nouveau signalement a été déposé sur un conteneur de votre zone.';

  const notifications = await buildNotificationsForContainer(
    signalement.id_conteneur,
    'ALERTE',
    titre,
    corps
  );

  if (notifications.length === 0) return;

  await notificationService.createBulkNotifications(notifications);

  logger.info(
    { id_conteneur: signalement.id_conteneur, id_signalement: signalement.id_signalement, count: notifications.length },
    'Notifications SIGNALEMENT créées automatiquement'
  );
}

/**
 * Traite un event ecotrack.admin.notifications
 * Payload : { type, data, source, ... }
 */
async function handleAdminNotification(payload) {
  const event = payload.event || payload;

  if (!event.type) {
    logger.warn({ payload }, 'Événement admin sans type — ignoré');
    return;
  }

  await adminNotificationService.processKafkaEvent(event);

  logger.info(
    { type: event.type, source: event.source || 'kafka' },
    'Notification admin traitée depuis Kafka'
  );
}

// ─── Dispatch principal ───────────────────────────────────────

async function dispatch(topic, value) {
  switch (topic) {
    case TOPICS.ALERTS:
      await handleAlert(value);
      break;
    case TOPICS.SIGNALEMENTS:
      await handleSignalement(value);
      break;
    case TOPICS.ADMIN_NOTIFICATIONS:
      await handleAdminNotification(value);
      break;
    default:
      logger.debug({ topic }, 'Topic non géré — ignoré');
  }
}

// ─── Connexion / démarrage ─────────────────────────────────────

const connect = async () => {
  if (isRunning) return;

  try {
    await consumer.connect();
    isRunning = true;
    logger.info({
      brokers: process.env.KAFKA_BROKERS || 'localhost:9092',
      topics: Object.values(TOPICS)
    }, 'Kafka Consumer connecté');

    await consumer.subscribe({
      topics: Object.values(TOPICS),
      fromBeginning: false
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = JSON.parse(message.value.toString());
          logger.debug({ 
            topic, 
            partition, 
            offset: message.offset,
            payload: value 
          }, 'Message Kafka reçu');
          await dispatch(topic, value);
        } catch (err) {
          logger.error({ 
            err: err.message, 
            topic,
            rawMessage: message.value?.toString()
          }, 'Erreur traitement message Kafka');
        }
      }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Kafka Consumer — connexion échouée');
    isRunning = false;
  }
};

const disconnect = async () => {
  if (!isRunning) return;
  try {
    await consumer.disconnect();
    isRunning = false;
    logger.info('Kafka Consumer déconnecté');
  } catch (err) {
    logger.error({ err: err.message }, 'Kafka Consumer — déconnexion échouée');
  }
};

module.exports = { connect, disconnect, TOPICS, isRunning: () => isRunning };
