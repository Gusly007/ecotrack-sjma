// Rôle du fichier : controller pour le classement des utilisateurs.
import { z } from 'zod';
import { recupererClassement } from '../services/leaderboard.service.js';

const classementSchema = z.object({
  limite: z.coerce.number().int().positive().default(10),
  id_utilisateur: z.coerce.number().int().positive().optional()
});

// Valide la query et renvoie le classement.
export const obtenirClassement = async (req, res, next) => {
  try {
    const { limite, id_utilisateur } = classementSchema.parse(req.query);
    const classement = await recupererClassement({
      limite,
      idUtilisateur: id_utilisateur
    });
    res.json(classement);
  } catch (error) {
    next(error);
  }
};
