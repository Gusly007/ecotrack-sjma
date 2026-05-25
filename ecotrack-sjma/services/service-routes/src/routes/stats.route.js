const router = require('express').Router();
const { requirePermission } = require('../middleware/rbac');

/**
 * @swagger
 * tags:
 *   - name: Statistiques Routes
 *     description: Statistiques et KPIs des tournées
 */

/**
 * @swagger
 * /routes/stats/dashboard:
 *   get:
 *     summary: Dashboard global des tournées
 *     tags: [Statistiques Routes]
 *     responses:
 *       200:
 *         description: Données du dashboard (tournées, collectes 30j, véhicules)
 */
router.get('/stats/dashboard', requirePermission('tournee:read'), (req, res, next) => req.controllers.stats.getDashboard(req, res, next));

/**
 * @swagger
 * /routes/stats/kpis:
 *   get:
 *     summary: KPIs de performance des tournées
 *     tags: [Statistiques Routes]
 *     parameters:
 *       - in: query
 *         name: date_debut
 *         schema: { type: string, format: date }
 *         description: Date de début de la période
 *       - in: query
 *         name: date_fin
 *         schema: { type: string, format: date }
 *         description: Date de fin de la période
 *       - in: query
 *         name: id_zone
 *         schema: { type: integer }
 *         description: Filtrer par zone
 *     responses:
 *       200:
 *         description: KPIs (taux complétion, distances, quantités, CO2 économisé)
 */
router.get('/stats/kpis', requirePermission('tournee:read'), (req, res, next) => req.controllers.stats.getKpis(req, res, next));

/**
 * @swagger
 * /routes/stats/agent:
 *   get:
 *     summary: Statistiques de l'agent connecté (filtrées par x-user-id)
 *     tags: [Statistiques Routes]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [jour, semaine, mois] }
 *         description: Période d'agrégation (défaut: mois)
 *     responses:
 *       200:
 *         description: Stats personnelles de l'agent (tournées, collectes, kg, CO2, anomalies)
 *       400:
 *         description: Identifiant agent manquant
 */
router.get('/stats/agent', (req, res, next) => req.controllers.stats.getAgentStats(req, res, next));

/**
 * @swagger
 * /routes/stats/collectes:
 *   get:
 *     summary: Statistiques des collectes par période
 *     tags: [Statistiques Routes]
 *     parameters:
 *       - in: query
 *         name: date_debut
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_fin
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: id_zone
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Statistiques groupées par date et zone
 */
router.get('/stats/collectes', requirePermission('tournee:read'), (req, res, next) => req.controllers.stats.getCollecteStats(req, res, next));

/**
 * @swagger
 * /routes/stats/algorithm-comparison:
 *   get:
 *     summary: Comparaison des algorithmes d'optimisation
 *     tags: [Statistiques Routes, Optimisation]
 *     responses:
 *       200:
 *         description: Comparaison Nearest Neighbor vs 2-opt avec données historiques et simulation
 */
router.get('/stats/algorithm-comparison', requirePermission('tournee:read'), (req, res, next) => req.controllers.stats.getAlgorithmComparison(req, res, next));

/**
 * @swagger
 * /routes/stats/nearly-done:
 *   get:
 *     summary: Tournées EN_COURS dont la progression dépasse un seuil
 *     description: >
 *       Retourne toutes les tournées en cours dont le ratio
 *       (étapes collectées / total étapes) dépasse le seuil donné.
 *       Résultat mis en cache Redis 30 s.
 *     tags: [Statistiques Routes]
 *     parameters:
 *       - in: query
 *         name: seuil
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           default: 80
 *         description: Seuil de progression en % (défaut 80)
 *     responses:
 *       200:
 *         description: Tournées presque terminées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Nombre de tournées retournées
 *                   example: 2
 *                 seuil:
 *                   type: number
 *                   description: Seuil appliqué
 *                   example: 80
 *                 tournees:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_tournee:       { type: integer, example: 12 }
 *                       code:             { type: string,  example: "TRN-2026-042" }
 *                       date_tournee:     { type: string,  format: date, example: "2026-05-17" }
 *                       total_etapes:     { type: integer, example: 10 }
 *                       etapes_collectees:{ type: integer, example: 9 }
 *                       progression_pct:  { type: number,  example: 90.0 }
 *                       zone_nom:         { type: string,  example: "Zone Nord" }
 *                       agent_nom:        { type: string,  example: "Dupont Jean" }
 */
router.get('/stats/average-progression', requirePermission('tournee:read'), (req, res, next) => req.controllers.stats.getAverageProgression(req, res, next));
router.get('/stats/nearly-done', requirePermission('tournee:read'), (req, res, next) => req.controllers.stats.getNearlyDone(req, res, next));
/**
 * @swagger
 * /routes/stats/agent:
 *   get:
 *     summary: Statistiques personnelles de l'agent connecté
 *     description: Stats filtrées par x-user-id (collectes, tournées, taux réussite, classement)
 *     tags: [Statistiques Routes]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [jour, semaine, mois]
 *           default: semaine
 *         description: Période d'analyse
 *     responses:
 *       200:
 *         description: Statistiques de l'agent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:              { type: string }
 *                 total_collectes:     { type: integer }
 *                 total_tournees:      { type: integer }
 *                 tournees_terminees:  { type: integer }
 *                 taux_reussite_pct:   { type: number }
 *                 total_kg:            { type: number }
 *                 distance_totale_km:  { type: number }
 *                 co2_economise_kg:    { type: number }
 *                 classement:
 *                   type: object
 *                   properties:
 *                     rang:         { type: integer }
 *                     total_agents: { type: integer }
 *       400:
 *         description: Identifiant agent manquant
 */
router.get('/stats/agent', requirePermission('tournee:read'), (req, res, next) => req.controllers.stats.getAgentStats(req, res, next));

module.exports = router;
