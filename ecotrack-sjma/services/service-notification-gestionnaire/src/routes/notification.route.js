'use strict';

const router = require('express').Router();
const controller = require('../controllers/notification.controller');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { validateCreateNotification, validateBulkNotifications } = require('../middleware/validation');

router.use(authenticateToken);

// ─────────────────────────────────────────────────────────────
//  POST /notifications
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Crée une notification pour un utilisateur cible
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_utilisateur, type, titre, corps]
 *             properties:
 *               id_utilisateur:
 *                 type: integer
 *                 example: 42
 *               type:
 *                 type: string
 *                 enum: [ALERTE, TOURNEE, BADGE, SYSTEME]
 *                 example: ALERTE
 *               titre:
 *                 type: string
 *                 example: "Zone saturée"
 *               corps:
 *                 type: string
 *                 example: "Le taux de remplissage dépasse 90 % sur la zone Nord."
 *     responses:
 *       201:
 *         description: Notification créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Champs manquants ou type invalide
 *       404:
 *         description: Utilisateur introuvable
 *       422:
 *         description: Rôle du destinataire incompatible avec le type
 */
router.post(
  '/notifications',
  requirePermission('notifications:create'),
  validateCreateNotification,
  controller.create
);

// ─────────────────────────────────────────────────────────────
//  POST /notifications/bulk
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /notifications/bulk:
 *   post:
 *     summary: Crée plusieurs notifications en une seule transaction
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required: [id_utilisateur, type, titre, corps]
 *               properties:
 *                 id_utilisateur:
 *                   type: integer
 *                 type:
 *                   type: string
 *                   enum: [ALERTE, TOURNEE, BADGE, SYSTEME]
 *                 titre:
 *                   type: string
 *                 corps:
 *                   type: string
 *     responses:
 *       201:
 *         description: Notifications insérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Tableau vide ou type invalide
 *       422:
 *         description: Rôle incompatible pour l'une des entrées
 */
router.post(
  '/notifications/bulk',
  requirePermission('notifications:bulk'),
  validateBulkNotifications,
  controller.createBulk
);

// ─────────────────────────────────────────────────────────────
//  PATCH /notifications/read-all  (avant /:id pour éviter le conflit de route)
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Marque toutes les notifications non lues comme lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de notifications mises à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updated:
 *                   type: integer
 *                   example: 5
 */
router.patch(
  '/notifications/read-all',
  requirePermission('notifications:own'),
  controller.markAllAsRead
);

// ─────────────────────────────────────────────────────────────
//  PATCH /notifications/:id/read
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Marque une notification comme lue
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de la notification
 *     responses:
 *       200:
 *         description: Notification mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       403:
 *         description: Non propriétaire de la notification
 *       404:
 *         description: Notification introuvable
 */
router.patch(
  '/notifications/:id/read',
  requirePermission('notifications:own'),
  controller.markAsRead
);

// ─────────────────────────────────────────────────────────────
//  DELETE /notifications/:id
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Supprime une notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de la notification
 *     responses:
 *       204:
 *         description: Notification supprimée
 *       403:
 *         description: Non propriétaire de la notification
 *       404:
 *         description: Notification introuvable
 */
router.delete(
  '/notifications/:id',
  requirePermission('notifications:own'),
  controller.delete
);

// ─────────────────────────────────────────────────────────────
//  GET /notifications/unread/count (AVEC CACHE)
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /notifications/unread/count:
 *   get:
 *     summary: Récupère le nombre de notifications non lues
 *     description: Retourne le compteur de notifications non lues. ⚡ AVEC CACHE (30s)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compteur récupéré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unread_count:
 *                   type: integer
 *                   example: 5
 */
router.get('/notifications/unread/count', controller.getUnreadCount);

// ─────────────────────────────────────────────────────────────
//  GET /notifications/list (AVEC CACHE)
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /notifications/list:
 *   get:
 *     summary: Liste les notifications avec pagination
 *     description: Retourne les notifications de l'utilisateur. ⚡ AVEC CACHE (10s)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get('/notifications/list', controller.getNotifications);

module.exports = router;
