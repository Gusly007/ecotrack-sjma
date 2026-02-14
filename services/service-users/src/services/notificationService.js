
import { NotificationRepository } from '../repositories/notification.repository.js';

/**
 * Créer une notification
 */
export const createNotification = async (userId, title, message, type = 'SYSTEME') => {
  return await NotificationRepository.createNotification(userId, title, message, type);
};

/**
 * Récupérer les notifications d'un utilisateur
 */
export const getUserNotifications = async (userId, limit = 50) => {
  return await NotificationRepository.getUserNotifications(userId, limit);
};

/**
 * Marquer une notification comme lue
 */
export const markAsRead = async (notificationId) => {
  return await NotificationRepository.markAsRead(notificationId);
};

/**
 * Compter les notifications non lues
 */
export const getUnreadCount = async (userId) => {
  return await NotificationRepository.getUnreadCount(userId);
};

/**
 * Supprimer une notification
 */
export const deleteNotification = async (notificationId) => {
  return await NotificationRepository.deleteNotification(notificationId);
};