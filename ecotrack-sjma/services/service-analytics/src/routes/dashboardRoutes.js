const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Dashboard complet avec KPIs, évolutions et insights
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: Période pour les données (day, week, month)
 *     responses:
 *       200:
 *         description: Données du dashboard
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
 *                     realTime:
 *                       type: object
 *                     evolution:
 *                       type: object
 *                     heatmap:
 *                       type: object
 *                     insights:
 *                       type: array
 *                     chartData:
 *                       type: object
 *       401:
 *         description: Non autorisé
 */
router.get('/dashboard', authMiddleware, DashboardController.getDashboard);

/**
 * @swagger
 * /api/analytics/realtime:
 *   get:
 *     summary: Statistiques temps réel avec KPIs et conteneurs critiques
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données temps réel
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
 *                     kpis:
 *                       type: object
 *                     criticalContainers:
 *                       type: array
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get('/realtime', authMiddleware, DashboardController.getRealTimeStats);

/**
 * @swagger
 * /api/analytics/heatmap:
 *   get:
 *     summary: Heatmap des zones au format GeoJSON
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données heatmap GeoJSON
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
 *                     type:
 *                       type: string
 *                     features:
 *                       type: array
 */
router.get('/heatmap', authMiddleware, DashboardController.getHeatmap);

/**
 * @swagger
 * /api/analytics/evolution:
 *   get:
 *     summary: Évolution temporelle du niveau de remplissage
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Nombre de jours d'historique
 *     responses:
 *       200:
 *         description: Données d'évolution
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
 *                     evolution:
 *                       type: array
 *                     chartData:
 *                       type: object
 */
router.get('/evolution', authMiddleware, DashboardController.getEvolution);

module.exports = router;