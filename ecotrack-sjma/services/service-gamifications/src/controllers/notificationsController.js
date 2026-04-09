// Rôle du fichier : controller des notifications.
import { z } from 'zod';
import { creerNotification, listerNotifications } from '../services/notifications.service.js';

const creationSchema = z.object({
  id_utilisateur: z.number().int().positive(),
  type: z.enum(['ALERTE', 'TOURNEE', 'BADGE', 'SYSTEME']),
  titre: z.string().min(3),
  corps: z.string().min(3)
});

// Crée une notification via le payload fourni.
export const creerNotificationHandler = async (req, res, next) => {
  try {
    const payload = creationSchema.parse(req.body);
    const notification = await creerNotification({
      idUtilisateur: payload.id_utilisateur,
      type: payload.type,
      titre: payload.titre,
      corps: payload.corps
    });
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};

// Liste les notifications pour un utilisateur donné.
export const listerNotificationsHandler = async (req, res, next) => {
  try {
    const id_utilisateur = parseInt(req.query.id_utilisateur, 10);
    const options = { idUtilisateur: id_utilisateur };
    if (req.query.page || req.query.limit) {
      options.page = parseInt(req.query.page, 10) || 1;
      options.limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    }
    const notifications = await listerNotifications(options);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};
