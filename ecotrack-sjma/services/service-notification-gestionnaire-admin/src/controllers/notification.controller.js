'use strict';

const notificationService = require('../services/notification.service');
const { getWebSocketNotifService } = require('../services/websocketNotifService');

class NotificationController {
  constructor() {
    this.create       = this.create.bind(this);
    this.createBulk   = this.createBulk.bind(this);
    this.markAsRead   = this.markAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.delete       = this.delete.bind(this);
  }

  // ─────────────────────────────────────────────────────────────
  //  POST /notifications
  // ─────────────────────────────────────────────────────────────

  /**
   * Crée une notification pour un utilisateur cible.
   * Le destinataire (id_utilisateur) est fourni dans le body ;
   * l'expéditeur est l'utilisateur authentifié (GESTIONNAIRE ou ADMIN).
   */
  async create(req, res, next) {
    try {
      const { id_utilisateur, type, titre, corps } = req.body;

      if (!id_utilisateur || !type || !titre || !corps) {
        return res.status(400).json({
          message: 'Champs requis manquants : id_utilisateur, type, titre, corps'
        });
      }

      const notification = await notificationService.createNotification({
        id_utilisateur,
        type,
        titre,
        corps
      });

      const wsService = getWebSocketNotifService();
      if (wsService) wsService.emitToUser(id_utilisateur, notification);

      return res.status(201).json(notification);
    } catch (err) {
      next(err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  POST /notifications/bulk
  // ─────────────────────────────────────────────────────────────

  /**
   * Crée plusieurs notifications en une seule transaction.
   * Body attendu : tableau d'objets { id_utilisateur, type, titre, corps }.
   */
  async createBulk(req, res, next) {
    try {
      const notifications = req.body;

      if (!Array.isArray(notifications) || notifications.length === 0) {
        return res.status(400).json({
          message: 'Le body doit être un tableau non vide de notifications'
        });
      }

      const inserted = await notificationService.createBulkNotifications(notifications);

      const wsService = getWebSocketNotifService();
      if (wsService) {
        for (const notif of inserted) {
          wsService.emitToUser(notif.id_utilisateur, notif);
        }
      }

      return res.status(201).json({
        count: inserted.length,
        data: inserted
      });
    } catch (err) {
      next(err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  PATCH /notifications/:id/read
  // ─────────────────────────────────────────────────────────────

  /**
   * Marque une notification comme lue.
   * L'utilisateur authentifié ne peut marquer que ses propres notifications,
   * sauf un ADMIN pour les notifications SYSTEME.
   */
  async markAsRead(req, res, next) {
    try {
      const id_notification = parseInt(req.params.id, 10);
      const id_utilisateur  = req.user.id;
      const role            = req.user.role;

      if (isNaN(id_notification)) {
        return res.status(400).json({ message: 'Paramètre :id invalide' });
      }

      const notification = await notificationService.markAsRead(
        id_notification,
        id_utilisateur,
        role
      );

      return res.status(200).json(notification);
    } catch (err) {
      next(err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  PATCH /notifications/read-all
  // ─────────────────────────────────────────────────────────────

  /**
   * Marque toutes les notifications non lues de l'utilisateur authentifié comme lues.
   */
  async markAllAsRead(req, res, next) {
    try {
      const id_utilisateur = req.user.id;

      const result = await notificationService.markAllAsRead(id_utilisateur);

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  DELETE /notifications/:id
  // ─────────────────────────────────────────────────────────────

  /**
   * Supprime une notification.
   * Seul le propriétaire peut supprimer, sauf un ADMIN pour les notifications SYSTEME.
   */
  async delete(req, res, next) {
    try {
      const id_notification = parseInt(req.params.id, 10);
      const id_utilisateur  = req.user.id;
      const role            = req.user.role;

      if (isNaN(id_notification)) {
        return res.status(400).json({ message: 'Paramètre :id invalide' });
      }

      await notificationService.deleteNotification(id_notification, id_utilisateur, role);

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
  // ─────────────────────────────────────────────────────────────
  //  CACHE - GET /notifications/unread/count
  // ─────────────────────────────────────────────────────────────

  /**
   * Récupère le nombre de notifications non lues de l'utilisateur.
   * AVEC CACHE (TTL 30s) pour performances optimales.
   */
  async getUnreadCount(req, res, next) {
    try {
      const id_utilisateur = req.user.id;

      const count = await notificationService.getUnreadCountCached(id_utilisateur);

      return res.status(200).json({ unread_count: count });
    } catch (err) {
      next(err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  CACHE - GET /notifications/list
  // ─────────────────────────────────────────────────────────────

  /**
   * Récupère les notifications de l'utilisateur avec pagination.
   * AVEC CACHE (TTL 10s).
   */
  async getNotifications(req, res, next) {
    try {
      const id_utilisateur = req.user.id;
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));

      const result = await notificationService.getNotificationsByUserCached(
        id_utilisateur,
        page,
        limit
      );

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }}

module.exports = new NotificationController();
