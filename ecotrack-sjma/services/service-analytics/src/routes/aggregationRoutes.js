const express = require('express');
const router = express.Router();
const AggregationController = require('../controllers/aggregationController');

/**
 * @swagger
 * /api/analytics/aggregations:
 *   get:
 *     summary: Récupérer toutes les agrégations
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: month
 *         description: Période d'agrégation
 *     responses:
 *       200:
 *         description: Données agrégées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get('/aggregations', AggregationController.getAggregations);

/**
 * @swagger
 * /api/analytics/aggregations/refresh:
 *   post:
 *     summary: Rafraîchir les vues matérialisées
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Vues rafraîchies
 */
router.post('/aggregations/refresh', AggregationController.refreshAggregations);

/**
 * @swagger
 * /api/analytics/aggregations/zones:
 *   get:
 *     summary: Statistiques par zone
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Statistiques par zone
 */
router.get('/aggregations/zones', AggregationController.getZoneAggregations);

/**
 * @swagger
 * /api/analytics/aggregations/agents:
 *   get:
 *     summary: Performances des agents
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Performances des agents
 */
router.get('/aggregations/agents', AggregationController.getAgentPerformances);

module.exports = router;
