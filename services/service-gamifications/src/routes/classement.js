// Rôle du fichier : routes HTTP pour le classement.
import { Router } from 'express';
import { obtenirClassement } from '../controllers/classementController.js';
import { classementQuerySchema } from '../validators/schemas.js';
import { validateQuery } from '../middleware/validation.js';

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
router.get('/', validateQuery(classementQuerySchema), obtenirClassement);

export default router;
