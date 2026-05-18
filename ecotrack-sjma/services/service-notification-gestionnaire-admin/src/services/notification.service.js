'use strict';

const logger = require('../utils/logger');
const CacheService = require('../utils/cache');
const notificationRepository = require('../repositories/notification.repository');

class NotificationService {
  // ─────────────────────────────────────────────────────────────
  //  CRÉATION
  // ─────────────────────────────────────────────────────────────

  /**
   * Crée une notification unique après validation métier.
   *
   * @param {{ id_utilisateur: number, type: string, titre: string, corps: string }} payload
   * @returns {Promise<object>} Notification insérée
   */
  async createNotification(payload) {
    const { id_utilisateur, type, titre, corps } = payload;

    if (!titre || !titre.trim()) {
      const ApiError = require('../utils/api-error');
      throw new ApiError(400, 'Le titre de la notification est obligatoire');
    }
    if (!corps || !corps.trim()) {
      const ApiError = require('../utils/api-error');
      throw new ApiError(400, 'Le corps de la notification est obligatoire');
    }

    const notification = await notificationRepository.createNotification({
      id_utilisateur,
      type,
      titre: titre.trim(),
      corps: corps.trim(),
    });

    logger.info(
      { id_notification: notification.id_notification, id_utilisateur, type },
      'Notification créée'
    );

    // Invalider le cache de compteur non lues et des listes récentes
    await this._invalidateUserCache(id_utilisateur);

    return notification;
  }

  /**
   * Crée plusieurs notifications en une seule transaction atomique.
   *
   * @param {Array<{ id_utilisateur: number, type: string, titre: string, corps: string }>} notifications
   * @returns {Promise<object[]>} Notifications insérées
   */
  async createBulkNotifications(notifications) {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      const ApiError = require('../utils/api-error');
      throw new ApiError(400, 'Le tableau de notifications ne peut pas être vide');
    }

    const sanitized = notifications.map(({ id_utilisateur, type, titre, corps }) => ({
      id_utilisateur,
      type,
      titre: titre?.trim(),
      corps: corps?.trim(),
    }));

    const inserted = await notificationRepository.createBulkNotifications(sanitized);

    logger.info(
      { count: inserted.length },
      'Notifications en masse créées'
    );

    // Invalider le cache de compteur pour TOUS les utilisateurs affectés
    const uniqueUserIds = [...new Set(inserted.map(n => n.id_utilisateur))];
    for (const userId of uniqueUserIds) {
      await this._invalidateUserCache(userId);
    }

    return inserted;
  }

  // ─────────────────────────────────────────────────────────────
  //  LECTURE / MISE À JOUR
  // ─────────────────────────────────────────────────────────────

  /**
   * Marque une notification comme lue.
   *
   * @param {number} id_notification
   * @param {number} id_utilisateur   Utilisateur authentifié
   * @param {string} [role]           Rôle de l'utilisateur
   * @returns {Promise<object>} Notification mise à jour
   */
  async markAsRead(id_notification, id_utilisateur, role) {
    const notification = await notificationRepository.markAsRead(
      id_notification,
      id_utilisateur,
      role
    );

    logger.info(
      { id_notification, id_utilisateur },
      'Notification marquée comme lue'
    );

    // Invalider le cache de compteur
    await this._invalidateUserCache(id_utilisateur);

    return notification;
  }

  /**
   * Marque toutes les notifications non lues d'un utilisateur comme lues.
   *
   * @param {number} id_utilisateur
   * @returns {Promise<{ updated: number }>} Nombre de notifications mises à jour
   */
  async markAllAsRead(id_utilisateur) {
    const count = await notificationRepository.markAllAsRead(id_utilisateur);

    logger.info(
      { id_utilisateur, updated: count },
      'Toutes les notifications marquées comme lues'
    );

    // Invalider le cache de compteur
    await this._invalidateUserCache(id_utilisateur);

    return { updated: count };
  }

  // ─────────────────────────────────────────────────────────────
  //  SUPPRESSION
  // ─────────────────────────────────────────────────────────────

  /**
   * Supprime une notification après vérification de propriété.
   *
   * @param {number} id_notification
   * @param {number} id_utilisateur
   * @param {string} [role]
   * @returns {Promise<void>}
   */
  async deleteNotification(id_notification, id_utilisateur, role) {
    await notificationRepository.deleteNotification(id_notification, id_utilisateur, role);

    logger.info(
      { id_notification, id_utilisateur },
      'Notification supprimée'
    );

    // Invalider le cache de compteur
    await this._invalidateUserCache(id_utilisateur);
  }

  // ─────────────────────────────────────────────────────────────
  //  CACHE
  // ─────────────────────────────────────────────────────────────

  /**
   * Récupère le nombre de notifications non lues d'un utilisateur
   * AVEC CACHE (TTL 30s)
   *
   * @param {number} id_utilisateur
   * @returns {Promise<number>}
   */
  async getUnreadCountCached(id_utilisateur) {
    const cacheKey = `ecotrack:notifications:unread:${id_utilisateur}`;

    return CacheService.getOrCache(cacheKey, 30, () =>
      notificationRepository.getUnreadCount(id_utilisateur)
    );
  }

  /**
   * Récupère la matrice des types de notifications valides
   * AVEC CACHE (TTL 1h - configuration système)
   *
   * @returns {Promise<object>} Matrice TYPE_ROLE_MAP
   */
  async getValidTypesCached() {
    const cacheKey = 'ecotrack:notification:types';

    return CacheService.getOrCache(cacheKey, 3600, () =>
      notificationRepository.getValidTypesList()
    );
  }

  /**
   * Récupère les notifications d'un utilisateur avec pagination
   * CACHE COURT (TTL 10s) car liste peut changer
   *
   * @param {number} id_utilisateur
   * @param {number} [page=1]
   * @param {number} [limit=20]
   * @returns {Promise<object>}
   */
  async getNotificationsByUserCached(id_utilisateur, page = 1, limit = 20) {
    const cacheKey = `ecotrack:notifications:recent:${id_utilisateur}:page:${page}:limit:${limit}`;

    return CacheService.getOrCache(cacheKey, 10, () =>
      notificationRepository.getNotificationsByUser(id_utilisateur, page, limit)
    );
  }

  /**
   * Invalide TOUS les caches d'un utilisateur
   * Appelé lors de modifications
   *
   * @param {number} id_utilisateur
   * @returns {Promise<void>}
   */
  async _invalidateUserCache(id_utilisateur) {
    const patterns = [
      `ecotrack:notifications:unread:${id_utilisateur}`,
      `ecotrack:notifications:recent:${id_utilisateur}:*`
    ];

    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        await CacheService.invalidatePattern(pattern);
      } else {
        await CacheService.invalidate(pattern);
      }
    }

    logger.debug({ id_utilisateur }, 'User notification cache invalidated');
  }
}

module.exports = new NotificationService();
