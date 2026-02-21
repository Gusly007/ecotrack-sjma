// Rôle du fichier : création et lecture des notifications de gamification.
import { NotificationsRepository } from '../repositories/notifications.repository.js';


// Crée une notification pour un utilisateur.
export const creerNotification = async ({ idUtilisateur, type, titre, corps }, client) => {
  return await NotificationsRepository.creerNotification({ idUtilisateur, type, titre, corps }, client);
};

// Liste les notifications d'un utilisateur, les plus récentes d'abord.
export const listerNotifications = async ({ idUtilisateur }) => {
  return await NotificationsRepository.listerNotifications({ idUtilisateur });
};
