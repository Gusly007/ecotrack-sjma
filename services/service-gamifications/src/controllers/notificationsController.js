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

const listeSchema = z.object({
  id_utilisateur: z.coerce.number().int().positive()
});

// Liste les notifications pour un utilisateur donné.
export const listerNotificationsHandler = async (req, res, next) => {
  try {
    const { id_utilisateur } = listeSchema.parse(req.query);
    const notifications = await listerNotifications({ idUtilisateur: id_utilisateur });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};
