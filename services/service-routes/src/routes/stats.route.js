const router = require('express').Router();

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
router.get('/stats/dashboard', (req, res, next) => req.controllers.stats.getDashboard(req, res, next));

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
router.get('/stats/kpis', (req, res, next) => req.controllers.stats.getKpis(req, res, next));

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
router.get('/stats/collectes', (req, res, next) => req.controllers.stats.getCollecteStats(req, res, next));

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
router.get('/stats/algorithm-comparison', (req, res, next) => req.controllers.stats.getAlgorithmComparison(req, res, next));

module.exports = router;
