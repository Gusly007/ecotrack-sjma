// Rôle du fichier : controller des statistiques utilisateur.
import { z } from 'zod';
import {
  recupererStatsUtilisateur,
  recupererHistoriquePoints
} from '../services/stats.service.js';

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

// Retourne la liste brute des événements `historique_points` du citoyen
// (une ligne par gain/dépense, avec la raison). Le citoyen ne peut consulter
// que son propre historique, sauf ADMIN/GESTIONNAIRE.
const historiqueQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).optional()
});

export const obtenirHistoriquePoints = async (req, res, next) => {
  try {
    const { id_utilisateur } = statsSchema.parse({
      id_utilisateur: req.params.idUtilisateur
    });
    const { limit } = historiqueQuerySchema.parse(req.query || {});

    // Scope check: un CITOYEN ne peut lire que son propre historique.
    const callerRole = req.user?.role;
    const callerId = req.user?.id;
    const isPrivileged = callerRole === 'ADMIN' || callerRole === 'GESTIONNAIRE';
    if (!isPrivileged && callerId && callerId !== id_utilisateur) {
      return res.status(403).json({
        error: 'Forbidden',
        message: "Accès refusé à l'historique d'un autre utilisateur"
      });
    }

    const rows = await recupererHistoriquePoints({
      idUtilisateur: id_utilisateur,
      limit: limit ?? 100
    });
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
};
