// Rôle du fichier : routes HTTP pour les statistiques utilisateur.
import { Router } from 'express';
import {
  obtenirStatsUtilisateur,
  obtenirHistoriquePoints
} from '../controllers/statsController.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

/**
 * @swagger
 * /utilisateurs/{idUtilisateur}/stats:
 *   get:
 *     summary: Statistiques de gamification d'un utilisateur
 *     tags: [Statistiques]
 *     parameters:
 *       - in: path
 *         name: idUtilisateur
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Statistiques utilisateur
 */
router.get('/utilisateurs/:idUtilisateur/stats', requirePermission('gamification:read'), obtenirStatsUtilisateur);

/**
 * @swagger
 * /utilisateurs/{idUtilisateur}/historique:
 *   get:
 *     summary: Historique brut des points (une ligne par événement)
 *     tags: [Statistiques]
 *     parameters:
 *       - in: path
 *         name: idUtilisateur
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Liste d'événements historique_points
 *       403:
 *         description: Un citoyen ne peut voir que son propre historique
 */
router.get(
  '/utilisateurs/:idUtilisateur/historique',
  requirePermission('points:read'),
  obtenirHistoriquePoints
);

export default router;
