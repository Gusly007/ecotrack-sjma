// Rôle du fichier : routes HTTP pour les défis.
import { Router } from 'express';
import {
  creerDefiHandler,
  listerDefisHandler,
  creerParticipationHandler,
  mettreAJourProgressionHandler
} from '../controllers/defisController.js';
import { validateQuery } from '../middleware/validation.js';
import { defisQuerySchema } from '../validators/schemas.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

/**
 * @swagger
 * /defis:
 *   get:
 *     summary: Liste des défis
 *     tags: [Défis]
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
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [ACTIF, TERMINE, TOUS]
 *       - in: query
 *         name: type_defi
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des défis paginée
 *   post:
 *     summary: Créer un défi
 *     tags: [Défis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               description:
 *                 type: string
 *               objectif:
 *                 type: integer
 *               recompense_points:
 *                 type: integer
 *               date_debut:
 *                 type: string
 *               date_fin:
 *                 type: string
 *               type_defi:
 *                 type: string
 *             required:
 *               - titre
 *               - objectif
 *               - date_debut
 *               - date_fin
 *     responses:
 *       201:
 *         description: Défi créé
 */
router.get('/', requirePermission('defis:read'), listerDefisHandler);
router.post('/', requirePermission('defis:create'), creerDefiHandler);

/**
 * @swagger
 * /defis/{idDefi}/participations:
 *   post:
 *     summary: Participer à un défi
 *     tags: [Défis]
 *     parameters:
 *       - in: path
 *         name: idDefi
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_utilisateur:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Participation créée
 */
router.post('/:idDefi/participations', requirePermission('defis:read'), creerParticipationHandler);

/**
 * @swagger
 * /defis/{idDefi}/participations/{idUtilisateur}:
 *   patch:
 *     summary: Mettre à jour la progression d'un défi
 *     tags: [Défis]
 *     parameters:
 *       - in: path
 *         name: idDefi
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idUtilisateur
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               progression:
 *                 type: integer
 *               statut:
 *                 type: string
 *     responses:
 *       200:
 *         description: Progression mise à jour
 */
router.patch('/:idDefi/participations/:idUtilisateur', requirePermission('defis:update'), mettreAJourProgressionHandler);

export default router;
