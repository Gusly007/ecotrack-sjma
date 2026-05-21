// Rôle du fichier : routes HTTP pour les actions utilisateur.
import { Router } from 'express';
import { enregistrerAction } from '../controllers/actionsController.js';
import { requirePermissions } from '../middleware/rbac.js';

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
// `self_action` suffit pour un citoyen qui agit sur lui-même ; le controller
// vérifie que req.user.id === id_utilisateur dans ce cas. Les rôles privilégiés
// (GESTIONNAIRE, ADMIN) gardent `gamification:create` pour agir sur autrui.
router.post('/', requirePermissions(['gamification:self_action', 'gamification:create']), enregistrerAction);

export default router;
