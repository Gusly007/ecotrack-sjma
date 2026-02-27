const PerformanceService = require('../services/performanceService');
const AgentPerformanceRepository = require('../repositories/agentPerformanceRepository');
const { EnvironmentalImpactRepository } = require('../repositories/environmentalImpactRepository.js');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

class PerformanceController {
  /**
   * GET /api/analytics/performance/dashboard
   */
  static async getDashboard(req, res) {
    try {
      const { period = 'week' } = req.query;
      const cacheKey = `performance:dashboard:${period}`;

      const data = await cacheService.getOrSet(
        cacheKey,
        () => PerformanceService.getCompleteDashboard(period),
        180 // TTL: 3 minutes
      );

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Error in getDashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch performance dashboard'
      });
    }
  }

  /**
   * GET /api/analytics/performance/agents/ranking
   */
  static async getAgentsRanking(req, res) {
    try {
      const { startDate, endDate, limit = 10 } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required'
        });
      }

      // Pas de cache pour ranking (trop spécifique aux dates)
      const ranking = await AgentPerformanceRepository.getAgentsRanking(
        new Date(startDate),
        new Date(endDate),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: ranking
      });
    } catch (error) {
      logger.error('Error in getAgentsRanking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch agents ranking'
      });
    }
  }

  /**
   * GET /api/analytics/performance/agents/:id
   */
  static async getAgentPerformance(req, res) {
    try {
      const { id } = req.params;
      const { period = 'week' } = req.query;
      const cacheKey = `performance:agent:${id}:${period}`;

      // Cache pour performance agent individuel
      const data = await cacheService.getOrSet(
        cacheKey,
        () => PerformanceService.getAgentDetailedPerformance(parseInt(id), period),
        180 // TTL: 3 minutes
      );

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Error in getAgentPerformance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch agent performance'
      });
    }
  }

  /**
   * GET /api/analytics/performance/environmental
   */
  static async getEnvironmentalImpact(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required'
        });
      }

      // Pas de cache (dates spécifiques)
      const impact = await EnvironmentalImpactRepository.getEnvironmentalImpact(
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: impact
      });
    } catch (error) {
      logger.error('Error in getEnvironmentalImpact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch environmental impact'
      });
    }
  }

  /**
   * GET /api/analytics/performance/environmental/evolution
   */
  static async getImpactEvolution(req, res) {
    try {
      const { months = 6 } = req.query;
      const cacheKey = `performance:impact:evolution:${months}`;

      const data = await cacheService.getOrSet(
        cacheKey,
        () => EnvironmentalImpactRepository.getImpactEvolution(parseInt(months)),
        300 // TTL: 5 minutes
      );

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Error in getImpactEvolution:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch impact evolution'
      });
    }
  }

  /**
   * GET /api/analytics/performance/environmental/zones
   */
  static async getImpactByZone(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required'
        });
      }

      // Pas de cache (dates spécifiques)
      const zones = await EnvironmentalImpactRepository.getImpactByZone(
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: zones
      });
    } catch (error) {
      logger.error('Error in getImpactByZone:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch impact by zone'
      });
    }
  }
}

module.exports = PerformanceController;