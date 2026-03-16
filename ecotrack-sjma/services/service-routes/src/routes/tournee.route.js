const router = require('express').Router();

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
 *       500:
 *         description: Erreur serveur
 */
router.get('/tournees', (req, res, next) => req.controllers.tournee.getAll(req, res, next));

/**
 * @swagger
 * /routes/tournees/active:
 *   get:
 *     summary: Liste les tournées actives (EN_COURS)
 *     tags: [Tournées]
 *     responses:
 *       200:
 *         description: Tournées en cours
 */
router.get('/tournees/active', (req, res, next) => req.controllers.tournee.getActive(req, res, next));

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
router.get('/my-tournee', (req, res, next) => req.controllers.tournee.getMyTournee(req, res, next));

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
 *               id_zone:
 *                 type: integer
 *                 description: Zone à couvrir
 *               date_tournee:
 *                 type: string
 *                 format: date
 *                 description: Date de la tournée (YYYY-MM-DD)
 *               seuil_remplissage:
 *                 type: number
 *                 default: 70
 *                 description: Seuil min de remplissage (%) pour inclure un conteneur
 *               id_agent:
 *                 type: integer
 *                 description: Agent assigné
 *               id_vehicule:
 *                 type: integer
 *                 description: Véhicule assigné (optionnel)
 *               algorithme:
 *                 type: string
 *                 enum: [nearest_neighbor, 2opt]
 *                 default: 2opt
 *     responses:
 *       201:
 *         description: Tournée optimisée créée
 *       400:
 *         description: Données invalides ou aucun conteneur éligible
 */
router.post('/optimize', (req, res, next) => req.controllers.tournee.optimize(req, res, next));

/**
 * @swagger
 * /routes/tournees:
 *   post:
 *     summary: Crée une nouvelle tournée manuellement
 *     tags: [Tournées]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date_tournee, duree_prevue_min, id_zone, id_agent]
 *             properties:
 *               date_tournee:
 *                 type: string
 *                 format: date
 *               statut:
 *                 type: string
 *                 enum: [PLANIFIEE, EN_COURS, TERMINEE, ANNULEE]
 *                 default: PLANIFIEE
 *               distance_prevue_km:
 *                 type: number
 *               duree_prevue_min:
 *                 type: integer
 *               id_vehicule:
 *                 type: integer
 *               id_zone:
 *                 type: integer
 *               id_agent:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tournée créée
 *       400:
 *         description: Données invalides
 */
router.post('/tournees', (req, res, next) => req.controllers.tournee.create(req, res, next));

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
 */
router.get('/tournees/:id', (req, res, next) => req.controllers.tournee.getById(req, res, next));

/**
 * @swagger
 * /routes/tournees/{id}:
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
 *       404:
 *         description: Tournée introuvable
 */
router.patch('/tournees/:id', (req, res, next) => req.controllers.tournee.update(req, res, next));

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
 *       400:
 *         description: Statut invalide
 *       404:
 *         description: Tournée introuvable
 */
router.patch('/tournees/:id/statut', (req, res, next) => req.controllers.tournee.updateStatut(req, res, next));

/**
 * @swagger
 * /routes/tournees/{id}:
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
 *       404:
 *         description: Tournée introuvable
 */
router.delete('/tournees/:id', (req, res, next) => req.controllers.tournee.delete(req, res, next));

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
 *       404:
 *         description: Tournée introuvable
 */
router.get('/tournees/:id/etapes', (req, res, next) => req.controllers.tournee.getEtapes(req, res, next));

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
 *         description: Détails de progression (étapes collectées/totales)
 */
router.get('/tournees/:id/progress', (req, res, next) => req.controllers.tournee.getProgress(req, res, next));

/**
 * @swagger
 * /routes/tournees/{id}/pdf:
 *   get:
 *     summary: Génère une feuille de route PDF
 *     tags: [Tournées]
 *     produces:
 *       - application/pdf
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la tournée
 *     responses:
 *       200:
 *         description: PDF de la feuille de route
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Tournée introuvable
 */
router.get('/tournees/:id/pdf', (req, res, next) => req.controllers.export.generatePDF(req, res, next));

/**
 * @swagger
 * /routes/tournees/{id}/map:
 *   get:
 *     summary: Données cartographiques GeoJSON pour affichage sur carte
 *     tags: [Tournées]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la tournée
 *     responses:
 *       200:
 *         description: Données GeoJSON avec les points des conteneurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tournee:
 *                       type: object
 *                     agent:
 *                       type: object
 *                     vehicule:
 *                       type: object
 *                     geojson:
 *                       type: object
 *       404:
 *         description: Tournée introuvable
 */
router.get('/tournees/:id/map', (req, res, next) => req.controllers.export.getMapData(req, res, next));

module.exports = router;
