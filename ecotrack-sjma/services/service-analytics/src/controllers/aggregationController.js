const AggregationService = require('../services/aggregationService');
const logger = require('../utils/logger');

class AggregationController {
  /**
   * GET /api/analytics/aggregations
   */
  static async getAggregations(req, res) {
    try {
      const { period = 'month' } = req.query;

      logger.info(`Fetching aggregations for period: ${period}`);

      const data = await AggregationService.getCompleteAggregations(period);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Error in getAggregations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch aggregations',
        message: error.message
      });
    }
  }

  /**
   * POST /api/analytics/aggregations/refresh
   */
  static async refreshAggregations(req, res) {
    try {
      logger.info('Manual refresh requested');

      const result = await AggregationService.refreshAll();

      res.json({
        success: true,
        data: result,
        message: 'Aggregations refreshed successfully'
      });
    } catch (error) {
      logger.error('Error refreshing aggregations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh aggregations'
      });
    }
  }

  /**
   * GET /api/analytics/aggregations/zones
   */
  static async getZoneAggregations(req, res) {
    try {
      const AggregationModel = require('../models/aggregationModel');
      const zones = await AggregationModel.getZoneAggregations();

      res.json({
        success: true,
        data: zones
      });
    } catch (error) {
      logger.error('Error in getZoneAggregations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch zone aggregations'
      });
    }
  }

  /**
   * GET /api/analytics/aggregations/agents
   */
  static async getAgentPerformances(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const DateUtils = require('../utils/dateUtils');

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required'
        });
      }

      const AggregationModel = require('../models/aggregationModel');
      const agents = await AggregationModel.getAgentPerformances(
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: agents
      });
    } catch (error) {
      logger.error('Error in getAgentPerformances:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch agent performances'
      });
    }
  }
}

module.exports = AggregationController;