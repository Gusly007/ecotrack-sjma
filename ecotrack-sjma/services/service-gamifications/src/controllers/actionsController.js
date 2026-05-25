// Rôle du fichier : controller pour enregistrer une action utilisateur.
import { z } from 'zod';
import { enregistrerAction as enregistrerActionService } from '../services/gamificationService.js';

const actionSchema = z.object({
  id_utilisateur: z.number().int().positive(),
  type_action: z.string().min(2),
  points: z.number().int().positive().optional()
});

const PRIVILEGED_ROLES = new Set(['ADMIN', 'GESTIONNAIRE']);

// Valide l'entrée et déclenche l'orchestration d'une action.
export const enregistrerAction = async (req, res, next) => {
  try {
    const payload = actionSchema.parse(req.body);

    // Un CITOYEN/AGENT avec `gamification:self_action` ne peut agir que sur
    // son propre id_utilisateur. Les rôles privilégiés peuvent agir sur autrui.
    const callerId = Number(req.user?.id);
    const callerRole = req.user?.role;
    if (!PRIVILEGED_ROLES.has(callerRole) && callerId !== payload.id_utilisateur) {
      return res.status(403).json({
        error: 'Forbidden',
        message: "Vous ne pouvez enregistrer une action que pour votre propre compte"
      });
    }

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
      nouveauxBadges: resultat.nouveauxBadges,
      defisTermines: resultat.defisTermines || []
    });
  } catch (error) {
    next(error);
  }
};
