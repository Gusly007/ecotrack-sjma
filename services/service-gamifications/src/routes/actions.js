// Rôle du fichier : routes HTTP pour les actions utilisateur.
import { Router } from 'express';
import { enregistrerAction } from '../controllers/actionsController.js';

const router = Router();

/**
 * @swagger
 * /actions:
 *   post:
 *     summary: Enregistrer une action utilisateur et attribuer des points
 *     tags: [Actions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_utilisateur:
 *                 type: integer
 *               type_action:
 *                 type: string
 *               points:
 *                 type: integer
 *             required:
 *               - id_utilisateur
 *               - type_action
 *     responses:
 *       201:
 *         description: Action enregistrée
 */
router.post('/', enregistrerAction);

export default router;
