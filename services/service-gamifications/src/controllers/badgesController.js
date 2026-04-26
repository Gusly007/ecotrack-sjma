// Rôle du fichier : controller pour la liste des badges.
import { z } from 'zod';
import {
  listerBadges,
  listerBadgesUtilisateur
} from '../services/badges.service.js';

// Retourne le catalogue des badges.
export const obtenirBadges = async (req, res, next) => {
  try {
    const options = {};
    if (req.query.page || req.query.limit) {
      options.page = parseInt(req.query.page, 10) || 1;
      options.limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    }

    const badges = await listerBadges(options);
    res.json(badges);
  } catch (error) {
    next(error);
  }
};

// Retourne les badges d'un utilisateur via son id.
export const obtenirBadgesUtilisateur = async (req, res, next) => {
  try {
    const id_utilisateur = parseInt(req.params.idUtilisateur, 10);
    const hasPagination = req.query.page || req.query.limit;
    const badges = hasPagination
      ? await listerBadgesUtilisateur(id_utilisateur, {
          page: parseInt(req.query.page, 10) || 1,
          limit: Math.min(100, parseInt(req.query.limit, 10) || 20)
        })
      : await listerBadgesUtilisateur(id_utilisateur);
    res.json(badges);
  } catch (error) {
    next(error);
  }
};
