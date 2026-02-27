const express = require('express');
const router = express.Router();
const PerformanceController = require('../controllers/performanceController');
const authMiddleware = require('../middleware/authMiddleware');
const ValidationMiddleware = require('../middleware/validationMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');

/**
 * @swagger
 * /api/analytics/performance/dashboard:
 *   get:
 *     summary: Dashboard complet de performance (agents + environnement)
 *     tags: [Performance]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: Période de analyse
 *     responses:
 *       200:
 *         description: Dashboard de performance
 */
router.get('/performance/dashboard', authMiddleware, generalLimiter, PerformanceController.getDashboard);

/**
 * @swagger
 * /api/analytics/performance/agents/ranking:
 *   get:
 *     summary: Classement des agents par performance
 *     tags: [Performance]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'agents à retourner
 *     responses:
 *       200:
 *         description: Classement des agents
 */
router.get('/performance/agents/ranking', authMiddleware, generalLimiter, PerformanceController.getAgentsRanking);

/**
 * @swagger
 * /api/analytics/performance/agents/{id}:
 *   get:
 *     summary: Performance détaillée d'un agent
 *     tags: [Performance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'agent
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin
 *     responses:
 *       200:
 *         description: Performance de l'agent
 */
router.get('/performance/agents/:id', authMiddleware, generalLimiter, ValidationMiddleware.validateDateRange(), PerformanceController.getAgentPerformance);

/**
 * @swagger
 * /api/analytics/performance/environmental:
 *   get:
 *     summary: Impact environnemental global
 *     tags: [Performance]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin
 *     responses:
 *       200:
 *         description: Impact environnemental
 */
router.get('/performance/environmental', authMiddleware, generalLimiter, ValidationMiddleware.validateDateRange(), PerformanceController.getEnvironmentalImpact);

/**
 * @swagger
 * /api/analytics/performance/environmental/evolution:
 *   get:
 *     summary: Evolution de l'impact environnemental
 *     tags: [Performance]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin
 *     responses:
 *       200:
 *         description: Evolution de l'impact
 */
router.get('/performance/environmental/evolution', authMiddleware, generalLimiter, ValidationMiddleware.validateDateRange(), PerformanceController.getImpactEvolution);

/**
 * @swagger
 * /api/analytics/performance/environmental/zones:
 *   get:
 *     summary: Impact environnemental par zone
 *     tags: [Performance]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin
 *     responses:
 *       200:
 *         description: Impact par zone
 */
router.get('/performance/environmental/zones', authMiddleware, generalLimiter, ValidationMiddleware.validateDateRange(), PerformanceController.getImpactByZone);

module.exports = router;