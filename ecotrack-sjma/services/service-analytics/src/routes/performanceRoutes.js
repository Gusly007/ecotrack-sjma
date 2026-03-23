const express = require('express');
const router = express.Router();
const PerformanceController = require('../controllers/performanceController');
const authMiddleware = require('../middleware/authMiddleware');
const ValidationMiddleware = require('../middleware/validationMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');
const { requirePermission } = require('../middleware/rbac');

// Dashboard complet
router.get('/performance/dashboard', authMiddleware, requirePermission('analytics:read'), generalLimiter, PerformanceController.getDashboard);

// Agents
router.get('/performance/agents/ranking', authMiddleware, requirePermission('analytics:read'), generalLimiter, PerformanceController.getAgentsRanking);
router.get('/performance/agents/:id', authMiddleware, requirePermission('analytics:read'), generalLimiter, ValidationMiddleware.validateDateRange(), PerformanceController.getAgentPerformance);

// Impact environnemental
router.get('/performance/environmental', authMiddleware, requirePermission('analytics:read'), generalLimiter, ValidationMiddleware.validateDateRange(), PerformanceController.getEnvironmentalImpact);
router.get('/performance/environmental/evolution', authMiddleware, requirePermission('analytics:read'), generalLimiter, ValidationMiddleware.validateDateRange(), PerformanceController.getImpactEvolution);
router.get('/performance/environmental/zones', authMiddleware, requirePermission('analytics:read'), generalLimiter, ValidationMiddleware.validateDateRange(), PerformanceController.getImpactByZone);

module.exports = router;