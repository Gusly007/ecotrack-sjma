// Rôle du fichier : controller pour enregistrer une action utilisateur.
import { z } from 'zod';
import { enregistrerAction as enregistrerActionService } from '../services/gamificationService.js';

const actionSchema = z.object({
  id_utilisateur: z.number().int().positive(),
  type_action: z.string().min(2),
  points: z.number().int().positive().optional()
});

// Valide l'entrée et déclenche l'orchestration d'une action.
export const enregistrerAction = async (req, res, next) => {
  try {
    const payload = actionSchema.parse(req.body);

    // On mappe vers les noms attendus par le service métier.
    const resultat = await enregistrerActionService({
      idUtilisateur: payload.id_utilisateur,
      typeAction: payload.type_action,
      pointsCustom: payload.points
    });

    res.status(201).json({
      message: 'Action enregistrée',
      pointsAjoutes: resultat.pointsAjoutes,
      totalPoints: resultat.totalPoints,
      nouveauxBadges: resultat.nouveauxBadges
    });
  } catch (error) {
    next(error);
  }
};
