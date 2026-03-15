const router = require('express').Router();

/**
 * @swagger
 * tags:
 *   - name: Collectes
 *     description: Enregistrement des collectes et anomalies
 */

/**
 * @swagger
 * /routes/tournees/{id}/collecte:
 *   post:
 *     summary: Enregistre une collecte (conteneur vidé)
 *     tags: [Agent, Collectes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la tournée
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_conteneur, quantite_kg]
 *             properties:
 *               id_conteneur:
 *                 type: integer
 *                 description: Conteneur collecté
 *               quantite_kg:
 *                 type: number
 *                 description: Quantité collectée en kg
 *     responses:
 *       201:
 *         description: Collecte enregistrée
 *       400:
 *         description: Tournée non EN_COURS ou conteneur absent de la tournée
 *       404:
 *         description: Tournée introuvable
 */
router.post('/tournees/:id/collecte', (req, res, next) => req.controllers.collecte.recordCollecte(req, res, next));

/**
 * @swagger
 * /routes/tournees/{id}/anomalie:
 *   post:
 *     summary: Signale une anomalie sur un conteneur pendant la tournée
 *     tags: [Agent, Collectes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la tournée
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_conteneur, type_anomalie, description]
 *             properties:
 *               id_conteneur:
 *                 type: integer
 *               type_anomalie:
 *                 type: string
 *                 enum: [CONTENEUR_INACCESSIBLE, CONTENEUR_ENDOMMAGE, CAPTEUR_DEFAILLANT]
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Anomalie signalée
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Tournée introuvable
 */
router.post('/tournees/:id/anomalie', (req, res, next) => req.controllers.collecte.reportAnomalie(req, res, next));

/**
 * @swagger
 * /routes/tournees/{id}/collectes:
 *   get:
 *     summary: Récupère les collectes d'une tournée
 *     tags: [Collectes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des collectes
 *       404:
 *         description: Tournée introuvable
 */
router.get('/tournees/:id/collectes', (req, res, next) => req.controllers.collecte.getCollectesByTournee(req, res, next));

/**
 * @swagger
 * /routes/tournees/{id}/anomalies:
 *   get:
 *     summary: Récupère les anomalies signalées pour une tournée
 *     tags: [Collectes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des anomalies
 */
router.get('/tournees/:id/anomalies', (req, res, next) => req.controllers.collecte.getAnomaliesByTournee(req, res, next));

module.exports = router;
