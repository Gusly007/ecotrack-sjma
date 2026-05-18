'use strict';

const router = require('express').Router();
const controller = require('../controllers/adminNotification.controller');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

/**
 * @swagger
 * /admin/notifications/types:
 *   get:
 *     summary: Récupère les types de notifications admin disponibles
 *     tags: [AdminNotifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 types:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/admin/notifications/types', controller.getTypes);

/**
 * @swagger
 * /admin/notifications/priorities:
 *   get:
 *     summary: Récupère la table des priorités disponibles
 *     tags: [AdminNotifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Objet map des priorités
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/admin/notifications/priorities', controller.getPriorities);

/**
 * @swagger
 * /admin/notifications:
 *   post:
 *     summary: Crée une notification admin pour un gestionnaire
 *     tags: [AdminNotifications]
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
 *                 example: 7
 *               type:
 *                 type: string
 *                 example: ADMIN_ALERTE
 *               titre:
 *                 type: string
 *                 example: "Service hors ligne"
 *               corps:
 *                 type: string
 *                 example: "Le service API ne répond plus."
 *               priorite:
 *                 type: integer
 *                 example: 1
 *               categorie:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Notification admin créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminNotification'
 *       400:
 *         description: Données invalides
 */
router.post(
  '/admin/notifications',
  requirePermission('notifications:create'),
  controller.create
);

/**
 * @swagger
 * /admin/notifications/bulk:
 *   post:
 *     summary: Crée plusieurs notifications admin en masse
 *     tags: [AdminNotifications]
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
 *                 titre:
 *                   type: string
 *                 corps:
 *                   type: string
 *                 priorite:
 *                   type: integer
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdminNotification'
 */
router.post(
  '/admin/notifications/bulk',
  requirePermission('notifications:bulk'),
  controller.createBulk
);

/**
 * @swagger
 * /admin/notifications/{id}/read:
 *   patch:
 *     summary: Marque une notification admin comme lue
 *     tags: [AdminNotifications]
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
 *               $ref: '#/components/schemas/AdminNotification'
 *       403:
 *         description: Non autorisé
 */
router.patch(
  '/admin/notifications/:id/read',
  requirePermission('notifications:own'),
  controller.markAsRead
);

/**
 * @swagger
 * /admin/notifications/read-all:
 *   patch:
 *     summary: Marque toutes les notifications admin comme lues
 *     tags: [AdminNotifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications mises à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updated:
 *                   type: integer
 *                   example: 12
 */
router.patch(
  '/admin/notifications/read-all',
  requirePermission('notifications:own'),
  controller.markAllAsRead
);

/**
 * @swagger
 * /admin/notifications:
 *   get:
 *     summary: Liste les notifications admin avec filtres et pagination
 *     tags: [AdminNotifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: priorite
 *         schema:
 *           type: integer
 *       - in: query
 *         name: est_lu
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: categorie
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Liste paginée de notifications admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdminNotification'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get(
  '/admin/notifications',
  requirePermission('notifications:own'),
  controller.list
);

/**
 * @swagger
 * /admin/notifications/stats:
 *   get:
 *     summary: Récupère des statistiques basiques sur les notifications admin
 *     tags: [AdminNotifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get(
  '/admin/notifications/stats',
  requirePermission('notifications:own'),
  controller.stats
);

module.exports = router;
