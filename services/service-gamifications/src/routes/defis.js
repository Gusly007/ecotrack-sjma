// Rôle du fichier : routes HTTP pour les défis.
import { Router } from 'express';
import {
  creerDefiHandler,
  listerDefisHandler,
  creerParticipationHandler,
  mettreAJourProgressionHandler
} from '../controllers/defisController.js';

const router = Router();

/**
 * @swagger
 * /defis:
 *   get:
 *     summary: Liste des défis
 *     tags: [Défis]
 *     responses:
 *       200:
 *         description: Liste des défis
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
 */
router.get('/', listerDefisHandler);
router.post('/', creerDefiHandler);

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
router.post('/:idDefi/participations', creerParticipationHandler);

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
router.patch('/:idDefi/participations/:idUtilisateur', mettreAJourProgressionHandler);

export default router;
