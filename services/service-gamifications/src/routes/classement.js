// Rôle du fichier : routes HTTP pour le classement.
import { Router } from 'express';
import { obtenirClassement } from '../controllers/classementController.js';

const router = Router();

/**
 * @swagger
 * /classement:
 *   get:
 *     summary: Classement des utilisateurs
 *     tags: [Classement]
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_utilisateur
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Classement des utilisateurs
 */
router.get('/', obtenirClassement);

export default router;
