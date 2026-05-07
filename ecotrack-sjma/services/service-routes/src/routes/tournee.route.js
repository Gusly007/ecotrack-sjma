/**
 * @swagger
 * tags:
 *   - name: Tournées
 *     description: Gestion des tournées de collecte
 *   - name: Agent
 *     description: Actions de l'agent sur le terrain
 *   - name: Optimisation
 *     description: Optimisation des routes de collecte
 */

const router = require('express').Router();
const { requirePermission } = require('../middleware/rbac');

/**
 * @swagger
 * /routes/tournees:
 *   get:
 *     summary: Liste toutes les tournées
 *     tags: [Tournées]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: statut
 *         schema: { type: string, enum: [PLANIFIEE, EN_COURS, TERMINEE, ANNULEE] }
 *       - in: query
 *         name: id_zone
 *         schema: { type: integer }
 *       - in: query
 *         name: id_agent
 *         schema: { type: integer }
 *       - in: query
 *         name: date_debut
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_fin
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Liste des tournées
 *   post:
 *     summary: Crée une nouvelle tournée
 *     tags: [Tournées]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date_tournee, duree_prevue_min, id_zone, id_agent]
 *             properties:
 *               date_tournee: { type: string, format: date }
 *               statut: { type: string, enum: [PLANIFIEE, EN_COURS, TERMINEE, ANNULEE] }
 *               distance_prevue_km: { type: number }
 *               duree_prevue_min: { type: integer }
 *               id_vehicule: { type: integer }
 *               id_zone: { type: integer }
 *               id_agent: { type: integer }
 *     responses:
 *       201:
 *         description: Tournée créée
 */

/**
 * @swagger
 * /routes/tournees/active:
 *   get:
 *     summary: Liste des tournées actives
 *     tags: [Tournées]
 *     responses:
 *       200:
 *         description: Liste des tournées en cours
 */

/**
 * @swagger
 * /routes/my-tournee:
 *   get:
 *     summary: Tournée du jour de l'agent connecté
 *     tags: [Agent]
 *     responses:
 *       200:
 *         description: Tournée avec ses étapes
 *       404:
 *         description: Aucune tournée assignée aujourd'hui
 */

/**
 * @swagger
 * /routes/optimize:
 *   post:
 *     summary: Génère une tournée optimisée
 *     tags: [Optimisation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_zone, date_tournee, id_agent]
 *             properties:
 *               id_zone: { type: integer }
 *               date_tournee: { type: string, format: date }
 *               seuil_remplissage: { type: number, default: 70 }
 *               id_agent: { type: integer }
 *               id_vehicule: { type: integer }
 *               algorithme: { type: string, enum: [nearest_neighbor, 2opt], default: 2opt }
 *     responses:
 *       201:
 *         description: Tournée optimisée créée
 */

/**
 * @swagger
 * /routes/tournees/{id}:
 *   get:
 *     summary: Récupère une tournée par ID
 *     tags: [Tournées]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Tournée trouvée
 *       404:
 *         description: Tournée introuvable
 *   patch:
 *     summary: Met à jour une tournée
 *     tags: [Tournées]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date_tournee: { type: string, format: date }
 *               distance_prevue_km: { type: number }
 *               duree_prevue_min: { type: integer }
 *               duree_reelle_min: { type: integer }
 *               distance_reelle_km: { type: number }
 *               id_vehicule: { type: integer }
 *               id_zone: { type: integer }
 *               id_agent: { type: integer }
 *     responses:
 *       200:
 *         description: Tournée mise à jour
 *   delete:
 *     summary: Supprime une tournée
 *     tags: [Tournées]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Tournée supprimée
 *       400:
 *         description: Impossible de supprimer une tournée EN_COURS
 */

/**
 * @swagger
 * /routes/tournees/{id}/statut:
 *   patch:
 *     summary: Change le statut d'une tournée
 *     tags: [Tournées]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [statut]
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [PLANIFIEE, EN_COURS, TERMINEE, ANNULEE]
 *     responses:
 *       200:
 *         description: Statut mis à jour
 */

/**
 * @swagger
 * /routes/tournees/{id}/etapes:
 *   get:
 *     summary: Récupère les étapes d'une tournée
 *     tags: [Tournées]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des étapes avec coordonnées conteneurs
 */

/**
 * @swagger
 * /routes/tournees/{id}/progress:
 *   get:
 *     summary: Progression d'une tournée
 *     tags: [Tournées]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Détails de progression
 */

/**
 * @swagger
 * /routes/tournees/{id}/pdf:
 *   get:
 *     summary: Génère une feuille de route PDF
 *     tags: [Tournées]
 *     produces: [application/pdf]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: PDF de la feuille de route
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /routes/tournees/{id}/map:
 *   get:
 *     summary: Données cartographiques GeoJSON
 *     tags: [Tournées]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Données GeoJSON avec les points des conteneurs
 */

router.get('/tournees', requirePermission('tournee:read'), (req, res, next) => req.controllers.tournee.getAll(req, res, next));
router.get('/tournees/active', requirePermission('tournee:read'), (req, res, next) => req.controllers.tournee.getActive(req, res, next));
router.get('/my-tournee', requirePermission('tournee:read'), (req, res, next) => req.controllers.tournee.getMyTournee(req, res, next));
router.post('/optimize', requirePermission('tournee:read'), (req, res, next) => req.controllers.tournee.optimize(req, res, next));
router.post('/tournees', requirePermission('tournee:create'), (req, res, next) => req.controllers.tournee.create(req, res, next));
router.get('/tournees/:id', requirePermission('tournee:read'), (req, res, next) => req.controllers.tournee.getById(req, res, next));
router.patch('/tournees/:id', requirePermission('tournee:update'), (req, res, next) => req.controllers.tournee.update(req, res, next));
router.patch('/tournees/:id/statut', requirePermission('tournee:update'), (req, res, next) => req.controllers.tournee.updateStatut(req, res, next));
router.delete('/tournees/:id', requirePermission('tournee:delete'), (req, res, next) => req.controllers.tournee.delete(req, res, next));
router.get('/tournees/:id/etapes', requirePermission('tournee:read'), (req, res, next) => req.controllers.tournee.getEtapes(req, res, next));
router.get('/tournees/:id/progress', requirePermission('tournee:read'), (req, res, next) => req.controllers.tournee.getProgress(req, res, next));
router.get('/tournees/:id/pdf', requirePermission('tournee:read'), (req, res, next) => req.controllers.export.generatePDF(req, res, next));
router.get('/tournees/:id/map', requirePermission('tournee:read'), (req, res, next) => req.controllers.export.getMapData(req, res, next));

module.exports = router;
