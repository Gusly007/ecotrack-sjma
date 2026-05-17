'use strict';

const logger = require('../utils/logger');
const CacheService = require('../utils/cache');
const notificationRepository = require('../repositories/notification.repository');
const kafkaAdminProducer = require('../../kafkaAdminProducer');

const ADMIN_NOTIF_TYPES = {
  ALERTE_CRITIQUE: 'ADMIN_ALERTE',
  SERVICE_DOWN: 'ADMIN_SERVICE',
  SEUIL_DEPASSE: 'ADMIN_SEUIL',
  ANOMALIE_ML: 'ADMIN_ML',
  SECURITE: 'ADMIN_SECURITE',
  PERFORMANCE: 'ADMIN_PERFORMANCE',
  IOT: 'ADMIN_IOT'
};

const PRIORITES = {
  URGENT: 1,
  HAUTE: 2,
  MOYENNE: 3,
  BASSE: 4
};

const VALID_TYPES = Object.values(ADMIN_NOTIF_TYPES);

class AdminNotificationService {
  /**
   * Crée une notification admin et l'émet via WebSocket + Kafka
   */
  async createAdminNotification(payload) {
    const { id_utilisateur, type, titre, corps, priorite = PRIORITES.MOYENNE, categorie = null, metadata = null } = payload;

    if (!VALID_TYPES.includes(type)) {
      const ApiError = require('../utils/api-error');
      throw new ApiError(400, `Type admin invalide : ${type}. Valeurs acceptées : ${VALID_TYPES.join(', ')}`);
    }
    if (!titre || !titre.trim()) {
      const ApiError = require('../utils/api-error');
      throw new ApiError(400, 'Le titre est obligatoire');
    }
    if (!corps || !corps.trim()) {
      const ApiError = require('../utils/api-error');
      throw new ApiError(400, 'Le corps est obligatoire');
    }

    const notification = await notificationRepository.createNotification({
      id_utilisateur,
      type,
      titre: titre.trim(),
      corps: corps.trim(),
      priorite,
      categorie
    });

    logger.info({
      id_notification: notification.id_notification,
      id_utilisateur,
      type,
      priorite,
      categorie
    }, 'Notification admin créée');

    await this._invalidateUserCache(id_utilisateur);

    try {
      const wsService = require('./websocketAdminService');
      wsService.emitAdminNotification({ ...notification, metadata });
    } catch (err) {
      logger.debug({ error: err.message }, 'WebSocket non disponible pour emission');
    }

    try {
      await kafkaAdminProducer.sendAdminNotification({ notification, metadata });
    } catch (err) {
      logger.debug({ error: err.message }, 'Kafka non disponible pour emission admin');
    }

    return notification;
  }

  /**
   * Crée des notifications admin pour plusieurs admins
   */
  async createBulkAdminNotifications(notifications) {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      const ApiError = require('../utils/api-error');
      throw new ApiError(400, 'Le tableau de notifications ne peut pas être vide');
    }

    for (const n of notifications) {
      if (!VALID_TYPES.includes(n.type)) {
        const ApiError = require('../utils/api-error');
        throw new ApiError(400, `Type invalide "${n.type}" pour admin`);
      }
    }

    const enriched = notifications.map(n => ({
      id_utilisateur: n.id_utilisateur,
      type: n.type,
      titre: n.titre?.trim(),
      corps: n.corps?.trim(),
      priorite: n.priorite || PRIORITES.MOYENNE,
      categorie: n.categorie || null
    }));

    const inserted = await notificationRepository.createBulkNotifications(enriched);

    logger.info({ count: inserted.length }, 'Notifications admin en masse créées');

    const uniqueUserIds = [...new Set(inserted.map(n => n.id_utilisateur))];
    for (const userId of uniqueUserIds) {
      await this._invalidateUserCache(userId);
    }

    try {
      const wsService = require('./websocketAdminService');
      for (const notif of inserted) {
        wsService.emitAdminNotification(notif);
      }
    } catch (err) {
      logger.debug({ error: err.message }, 'WebSocket non disponible');
    }

    return inserted;
  }

  /**
   * Récupère les notifications admin avec filtres (type, priorite, est_lu)
   */
  async getAdminNotifications(filters = {}) {
    return notificationRepository.getAdminNotifications(filters);
  }

  /**
   * Récupère les statistiques des notifications admin
   */
  async getAdminNotificationStats(id_utilisateur) {
    return notificationRepository.getAdminNotificationStats(id_utilisateur);
  }

  /**
   * Marque comme lue avec vérification admin
   */
  async markAsRead(id_notification, id_utilisateur, role) {
    return notificationRepository.markAsReadAdmin(id_notification, id_utilisateur, role);
  }

  async _invalidateUserCache(id_utilisateur) {
    const patterns = [
      `ecotrack:notifications:unread:${id_utilisateur}`,
      `ecotrack:notifications:recent:${id_utilisateur}:*`,
      `ecotrack:admin:notifications:${id_utilisateur}:*`
    ];

    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        await CacheService.invalidatePattern(pattern);
      } else {
        await CacheService.invalidate(pattern);
      }
    }
  }

  /**
   * Traite un événement Kafka et crée les notifications appropriées
   */
  async processKafkaEvent(event) {
    const { type, data, source } = event;

    logger.info({ type, source }, 'Traitement événement Kafka admin');

    switch (type) {
      case ADMIN_NOTIF_TYPES.SERVICE_DOWN:
        return this._handleServiceDown(data);
      case ADMIN_NOTIF_TYPES.SEUIL_DEPASSE:
        return this._handleSeuilDepasse(data);
      case ADMIN_NOTIF_TYPES.ANOMALIE_ML:
        return this._handleAnomalieML(data);
      case ADMIN_NOTIF_TYPES.SECURITE:
        return this._handleSecurite(data);
      case ADMIN_NOTIF_TYPES.ALERTE_CRITIQUE:
        return this._handleAlerteCritique(data);
      case ADMIN_NOTIF_TYPES.PERFORMANCE:
        return this._handlePerformance(data);
      case ADMIN_NOTIF_TYPES.IOT:
        return this._handleIOT(data);
      default:
        logger.warn({ type }, 'Type d événement admin non reconnu');
    }
  }

  async _notifyAdmins(type, titre, corps, priorite, categorie, metadata) {
    const adminIds = await notificationRepository.findAllAdminUserIds();
    if (!adminIds || adminIds.length === 0) {
      logger.warn('Aucun admin trouvé pour notification');
      return [];
    }

    const notifications = adminIds.map(id => ({
      id_utilisateur: id,
      type,
      titre,
      corps,
      priorite,
      categorie,
      metadata
    }));

    return this.createBulkAdminNotifications(notifications);
  }

  async _handleServiceDown(data) {
    const { service, url, error, duration } = data;
    return this._notifyAdmins(
      ADMIN_NOTIF_TYPES.SERVICE_DOWN,
      `Service hors ligne : ${service}`,
      `Le service ${service} (${url}) ne répond plus. Délai: ${duration || 'inconnu'}. Erreur: ${error || 'N/A'}`,
      PRIORITES.URGENT,
      'INFRASTRUCTURE',
      { service, url, error, duration }
    );
  }

  async _handleSeuilDepasse(data) {
    const { typeSeuil, valeur, seuil, conteneur, secteur } = data;
    const priorite = data.priorite || (valeur / seuil > 0.95 ? PRIORITES.URGENT : PRIORITES.HAUTE);
    return this._notifyAdmins(
      ADMIN_NOTIF_TYPES.SEUIL_DEPASSE,
      `Seuil dépassé : ${typeSeuil}`,
      `${typeSeuil}: ${valeur} (seuil: ${seuil})${conteneur ? ` - Conteneur #${conteneur}` : ''}${secteur ? ` - Secteur: ${secteur}` : ''}`,
      priorite,
      'CONTENEURS',
      { typeSeuil, valeur, seuil, conteneur, secteur }
    );
  }

  async _handleAnomalieML(data) {
    const { type, description, zScore, prevision, secteur } = data;
    return this._notifyAdmins(
      ADMIN_NOTIF_TYPES.ANOMALIE_ML,
      `Anomalie ML : ${type}`,
      `${description}${zScore ? ` (Z-Score: ${zScore})` : ''}${secteur ? ` - Secteur: ${secteur}` : ''}`,
      zScore > 3 ? PRIORITES.URGENT : PRIORITES.HAUTE,
      'ML_ANOMALIES',
      { type, description, zScore, prevision, secteur }
    );
  }

  async _handleSecurite(data) {
    const { typeSecurite, description, utilisateur, details } = data;
    return this._notifyAdmins(
      ADMIN_NOTIF_TYPES.SECURITE,
      `Sécurité : ${typeSecurite}`,
      `${description}${utilisateur ? ` - Utilisateur: ${utilisateur}` : ''}`,
      PRIORITES.URGENT,
      'SECURITE',
      { typeSecurite, description, utilisateur, details }
    );
  }

  async _handleAlerteCritique(data) {
    const { typeAlerte, valeur, seuil, conteneur, secteur } = data;
    return this._notifyAdmins(
      ADMIN_NOTIF_TYPES.ALERTE_CRITIQUE,
      `Alerte critique : ${typeAlerte}`,
      `${typeAlerte}: ${valeur} (seuil: ${seuil})${conteneur ? ` - Conteneur #${conteneur}` : ''}${secteur ? ` - ${secteur}` : ''}`,
      PRIORITES.URGENT,
      'ALERTES',
      { typeAlerte, valeur, seuil, conteneur, secteur }
    );
  }

  async _handlePerformance(data) {
    const { metric, valeur, seuil, service } = data;
    return this._notifyAdmins(
      ADMIN_NOTIF_TYPES.PERFORMANCE,
      `Performance : ${metric}`,
      `${metric}: ${valeur} (seuil: ${seuil})${service ? ` - Service: ${service}` : ''}`,
      PRIORITES.HAUTE,
      'PERFORMANCE',
      { metric, valeur, seuil, service }
    );
  }

  async _handleIOT(data) {
    const { typeIOT, description, capteur, valeur } = data;
    return this._notifyAdmins(
      ADMIN_NOTIF_TYPES.IOT,
      `IoT : ${typeIOT}`,
      `${description}${capteur ? ` - Capteur: ${capteur}` : ''}${valeur ? ` (${valeur})` : ''}`,
      PRIORITES.MOYENNE,
      'IOT',
      { typeIOT, description, capteur, valeur }
    );
  }
}

module.exports = new AdminNotificationService();
module.exports.ADMIN_NOTIF_TYPES = ADMIN_NOTIF_TYPES;
module.exports.PRIORITES = PRIORITES;
module.exports.VALID_TYPES = VALID_TYPES;
