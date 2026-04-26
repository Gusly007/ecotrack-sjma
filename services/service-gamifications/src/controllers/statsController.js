// Rôle du fichier : controller des statistiques utilisateur.
import { z } from 'zod';
import { recupererStatsUtilisateur } from '../services/stats.service.js';

const statsSchema = z.object({
  id_utilisateur: z.coerce.number().int().positive()
});

// Valide l'id et renvoie les stats agrégées.
export const obtenirStatsUtilisateur = async (req, res, next) => {
  try {
    const { id_utilisateur } = statsSchema.parse({
      id_utilisateur: req.params.idUtilisateur
    });

    const stats = await recupererStatsUtilisateur({ idUtilisateur: id_utilisateur });
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
