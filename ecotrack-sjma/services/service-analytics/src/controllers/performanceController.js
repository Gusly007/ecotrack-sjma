const PerformanceService = require('../services/performanceService');
const AgentPerformanceRepository = require('../repositories/agentPerformanceRepository');
const { EnvironmentalImpactRepository } = require('../repositories/environmentalImpactRepositoryjs');
const logger = require('../utils/logger');

class PerformanceController {
  /**
   * GET /api/analytics/performance/dashboard
   */
  static async getDashboard(req, res) {
    try {
      const { period = 'week' } = req.query;

      const data = await PerformanceService.getCompleteDashboard(period);

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

      const performance = await PerformanceService.getAgentDetailedPerformance(
        parseInt(id),
        period
      );

      res.json({
        success: true,
        data: performance
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

      const evolution = await EnvironmentalImpactRepository.getImpactEvolution(
        parseInt(months)
      );

      res.json({
        success: true,
        data: evolution
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