'use strict';

const adminNotificationService = require('../services/adminNotificationService');
const { VALID_TYPES, PRIORITES } = require('../services/adminNotificationService');

class AdminNotificationController {
  constructor() {
    this.create = this.create.bind(this);
    this.createBulk = this.createBulk.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.list = this.list.bind(this);
    this.stats = this.stats.bind(this);
    this.getPriorities = this.getPriorities.bind(this);
    this.getTypes = this.getTypes.bind(this);
  }

  async create(req, res, next) {
    try {
      const { id_utilisateur, type, titre, corps, priorite, categorie, metadata } = req.body;

      if (!id_utilisateur || !type || !titre || !corps) {
        return res.status(400).json({
          message: 'Champs requis : id_utilisateur, type, titre, corps'
        });
      }

      const notification = await adminNotificationService.createAdminNotification({
        id_utilisateur,
        type,
        titre,
        corps,
        priorite: priorite || PRIORITES.MOYENNE,
        categorie,
        metadata
      });

      return res.status(201).json(notification);
    } catch (err) {
      next(err);
    }
  }

  async createBulk(req, res, next) {
    try {
      const notifications = req.body;

      if (!Array.isArray(notifications) || notifications.length === 0) {
        return res.status(400).json({
          message: 'Le body doit être un tableau non vide'
        });
      }

      const inserted = await adminNotificationService.createBulkAdminNotifications(notifications);

      return res.status(201).json({
        count: inserted.length,
        data: inserted
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const id_notification = parseInt(req.params.id, 10);
      const id_utilisateur = req.user.id;
      const role = req.user.role;

      if (isNaN(id_notification)) {
        return res.status(400).json({ message: 'Paramètre :id invalide' });
      }

      const notification = await adminNotificationService.markAsRead(
        id_notification,
        id_utilisateur,
        role
      );

      return res.status(200).json(notification);
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const id_utilisateur = req.user.id;
      const result = await adminNotificationService.markAllAsRead(id_utilisateur);

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const id_utilisateur = req.user.id;
      const filters = {
        id_utilisateur,
        type: req.query.type,
        priorite: req.query.priorite ? parseInt(req.query.priorite, 10) : undefined,
        est_lu: req.query.est_lu !== undefined ? req.query.est_lu === 'true' : undefined,
        categorie: req.query.categorie,
        page: Math.max(1, parseInt(req.query.page, 10) || 1),
        limit: Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20))
      };

      const result = await adminNotificationService.getAdminNotifications(filters);

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async stats(req, res, next) {
    try {
      const id_utilisateur = req.user.id;
      const stats = await adminNotificationService.getAdminNotificationStats(id_utilisateur);
      return res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }

  async getPriorities(req, res, next) {
    try {
      return res.status(200).json(PRIORITES);
    } catch (err) {
      next(err);
    }
  }

  async getTypes(req, res, next) {
    try {
      return res.status(200).json({ types: VALID_TYPES, labels: {
        ADMIN_ALERTE: 'Alertes critiques',
        ADMIN_SERVICE: 'Santé des services',
        ADMIN_SEUIL: 'Seuils conteneurs',
        ADMIN_ML: 'ML & Anomalies',
        ADMIN_SECURITE: 'Sécurité',
        ADMIN_PERFORMANCE: 'Performance système',
        ADMIN_IOT: 'IoT & Capteurs'
      }});
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminNotificationController();
