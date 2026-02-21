// Rôle du fichier : controller pour la liste des badges.
import { z } from 'zod';
import {
  listerBadges,
  listerBadgesUtilisateur
} from '../services/badges.service.js';

// Retourne le catalogue des badges.
export const obtenirBadges = async (req, res, next) => {
  try {
    const badges = await listerBadges();
    res.json(badges);
  } catch (error) {
    next(error);
  }
};

const utilisateurSchema = z.object({
  id_utilisateur: z.coerce.number().int().positive()
});

// Retourne les badges d'un utilisateur via son id.
export const obtenirBadgesUtilisateur = async (req, res, next) => {
  try {
    const { id_utilisateur } = utilisateurSchema.parse({
      id_utilisateur: req.params.idUtilisateur
    });

    const badges = await listerBadgesUtilisateur(id_utilisateur);
    res.json(badges);
  } catch (error) {
    next(error);
  }
};
