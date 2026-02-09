// Rôle du fichier : routes HTTP pour les notifications.
import { Router } from 'express';
import {
  creerNotificationHandler,
  listerNotificationsHandler
} from '../controllers/notificationsController.js';

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Lister les notifications d'un utilisateur
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: id_utilisateur
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notifications
 *   post:
 *     summary: Créer une notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_utilisateur:
 *                 type: integer
 *               type:
 *                 type: string
 *               titre:
 *                 type: string
 *               corps:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification créée
 */
router.get('/', listerNotificationsHandler);
router.post('/', creerNotificationHandler);

export default router;
