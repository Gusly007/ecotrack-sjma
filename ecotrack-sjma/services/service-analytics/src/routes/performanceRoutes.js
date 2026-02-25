const express = require('express');
const router = express.Router();
const PerformanceController = require('../controllers/performanceController');
const authMiddleware = require('../middleware/authMiddleware');

// Dashboard complet
router.get('/performance/dashboard', authMiddleware, PerformanceController.getDashboard);

// Agents
router.get('/performance/agents/ranking', authMiddleware, PerformanceController.getAgentsRanking);
router.get('/performance/agents/:id', authMiddleware, PerformanceController.getAgentPerformance);

// Impact environnemental
router.get('/performance/environmental', authMiddleware, PerformanceController.getEnvironmentalImpact);
router.get('/performance/environmental/evolution', authMiddleware, PerformanceController.getImpactEvolution);
router.get('/performance/environmental/zones', authMiddleware, PerformanceController.getImpactByZone);

module.exports = router;