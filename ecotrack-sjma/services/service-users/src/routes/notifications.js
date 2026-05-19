import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { publicLimiter } from '../config/rateLimit.js';

const router = express.Router();

router.use(publicLimiter);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications utilisateur
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id_notification:
 *           type: integer
 *           example: 12
 *         id_utilisateur:
 *           type: integer
 *           example: 5
 *         type:
 *           type: string
 *           example: "SYSTEME"
 *         titre:
 *           type: string
 *           example: "Nouvelle mission disponible"
 *         corps:
 *           type: string
 *           example: "Participez au nettoyage du parc samedi"
 *         est_lu:
 *           type: boolean
 *           example: false
 *         date_creation:
 *           type: string
 *           format: date-time
 *           example: "2025-01-04T10:00:00Z"
 *     NotificationListResponse:
 *       type: object
 *       properties:
 *         count:
 *           type: integer
 *           example: 3
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notification'
 *     UnreadCountResponse:
 *       type: object
 *       properties:
 *         unreadCount:
 *           type: integer
 *           example: 2
 */

/**
 * POST /notifications
 * Créer une notification (interne - vérifié par x-internal-key)
 */
router.post('/', async (req, res) => {
  const { id_utilisateur, type, titre, corps } = req.body;
  if (!id_utilisateur || !titre || !corps) {
    return res.status(400).json({ error: 'Missing required fields: id_utilisateur, titre, corps' });
  }
  try {
    const { createNotification } = await import('../services/notificationService.js');
    const notification = await createNotification(id_utilisateur, titre, corps, type || 'SYSTEME');
    res.status(201).json({ data: notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(authenticateToken);

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Récupérer les notifications de l'utilisateur connecté
 *     description: Retourne la liste des notifications classées par date décroissante.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Nombre maximum de notifications à retourner
 *     responses:
 *       200:
 *         description: Notifications récupérées
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationListResponse'
 *       401:
 *         description: Authentification requise
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Compter les notifications non lues
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compteur retourné
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnreadCountResponse'
 *       401:
 *         description: Authentification requise
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Marquer une notification comme lue
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
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notification marked as read"
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Notification introuvable
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Supprimer une notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification supprimée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notification deleted"
 *       404:
 *         description: Notification introuvable
 */
router.delete('/:id', notificationController.deleteNotification);

export default router;