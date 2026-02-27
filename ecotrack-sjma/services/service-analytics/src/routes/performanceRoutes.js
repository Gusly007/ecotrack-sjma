const express = require('express');
const router = express.Router();
const PerformanceController = require('../controllers/performanceController');
const authMiddleware = require('../middleware/authMiddleware');
const ValidationMiddleware = require('../middleware/validationMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');

// Dashboard complet
router.get('/performance/dashboard', authMiddleware, generalLimiter, PerformanceController.getDashboard);

// Agents
router.get('/performance/agents/ranking', authMiddleware, generalLimiter, PerformanceController.getAgentsRanking);
router.get('/performance/agents/:id', authMiddleware, generalLimiter, ValidationMiddleware.validateDateRange(), PerformanceController.getAgentPerformance);

// Impact environnemental
router.get('/performance/environmental', authMiddleware, generalLimiter, ValidationMiddleware.validateDateRange(), PerformanceController.getEnvironmentalImpact);
router.get('/performance/environmental/evolution', authMiddleware, generalLimiter, ValidationMiddleware.validateDateRange(), PerformanceController.getImpactEvolution);
router.get('/performance/environmental/zones', authMiddleware, generalLimiter, ValidationMiddleware.validateDateRange(), PerformanceController.getImpactByZone);

module.exports = router;