// Rôle du fichier : controller pour la liste des badges.
import { z } from 'zod';
import {
  listerBadges,
  listerBadgesUtilisateur
} from '../services/badges.service.js';
import { ApiResponse } from '../utils/api-response.js';

// Retourne le catalogue des badges.
export const obtenirBadges = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const { rows, total } = await listerBadges({ page, limit });
    res.json(ApiResponse.paginated(rows, page, limit, total, 'Badges récupérés'));
  } catch (error) {
    next(error);
  }
};

// Retourne les badges d'un utilisateur via son id.
export const obtenirBadgesUtilisateur = async (req, res, next) => {
  try {
    const id_utilisateur = parseInt(req.params.idUtilisateur, 10);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);

    const { rows, total } = await listerBadgesUtilisateur(id_utilisateur, { page, limit });
    res.json(ApiResponse.paginated(rows, page, limit, total, 'Badges utilisateur récupérés'));
  } catch (error) {
    next(error);
  }
};
