// Rôle du fichier : routes HTTP pour les badges.
import { Router } from 'express';
import { obtenirBadges, obtenirBadgesUtilisateur } from '../controllers/badgesController.js';
import { validateQuery } from '../middleware/validation.js';
import { badgesQuerySchema } from '../validators/schemas.js';

const router = Router();

/**
 * @swagger
 * /badges:
 *   get:
 *     summary: Liste des badges disponibles
 *     tags: [Badges]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Liste des badges paginée
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Liste des badges utilisateur paginée
 */
router.get('/utilisateurs/:idUtilisateur', validateQuery(badgesQuerySchema), obtenirBadgesUtilisateur);

export default router;
