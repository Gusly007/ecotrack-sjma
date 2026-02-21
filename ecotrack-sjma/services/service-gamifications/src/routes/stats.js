// Rôle du fichier : routes HTTP pour les statistiques utilisateur.
import { Router } from 'express';
import { obtenirStatsUtilisateur } from '../controllers/statsController.js';

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
router.get('/utilisateurs/:idUtilisateur/stats', obtenirStatsUtilisateur);

export default router;
