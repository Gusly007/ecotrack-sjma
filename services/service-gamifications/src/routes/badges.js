// Rôle du fichier : routes HTTP pour les badges.
import { Router } from 'express';
import { obtenirBadges, obtenirBadgesUtilisateur } from '../controllers/badgesController.js';

const router = Router();

/**
 * @swagger
 * /badges:
 *   get:
 *     summary: Liste des badges disponibles
 *     tags: [Badges]
 *     responses:
 *       200:
 *         description: Liste des badges
 */
router.get('/', obtenirBadges);

/**
 * @swagger
 * /badges/utilisateurs/{idUtilisateur}:
 *   get:
 *     summary: Liste des badges d'un utilisateur
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: idUtilisateur
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des badges utilisateur
 */
router.get('/utilisateurs/:idUtilisateur', obtenirBadgesUtilisateur);

export default router;
