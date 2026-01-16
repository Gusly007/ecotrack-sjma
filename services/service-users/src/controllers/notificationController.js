import * as notificationService from '../services/notificationService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * GET /notifications
 * Récupérer les notifications de l'utilisateur
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;

  const notifications = await notificationService.getUserNotifications(userId, limit);

  res.json({
    count: notifications.length,
    data: notifications
  });
});

/**
 * GET /notifications/unread-count
 * Compter les non-lues
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await notificationService.getUnreadCount(userId);

  res.json({ unreadCount: count });
});

/**
 * PUT /notifications/:id/read
 * Marquer comme lue
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const notificationId = parseInt(req.params.id);

  const notification = await notificationService.markAsRead(notificationId);

  res.json({
    message: 'Notification marked as read',
    data: notification
  });
});

/**
 * DELETE /notifications/:id
 * Supprimer une notification
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const notificationId = parseInt(req.params.id);

  await notificationService.deleteNotification(notificationId);

  res.json({ message: 'Notification deleted' });
});