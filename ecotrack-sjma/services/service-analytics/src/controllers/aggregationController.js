const AggregationService = require('../services/aggregationService');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

class AggregationController {
  /**
   * GET /api/analytics/aggregations
   */
  static async getAggregations(req, res) {
    try {
      const { period = 'month' } = req.query;
      const cacheKey = `aggregations:${period}`;

      logger.info(`Fetching aggregations for period: ${period}`);

      const data = await cacheService.getOrSet(
        cacheKey,
        () => AggregationService.getCompleteAggregations(period),
        300 // TTL: 5 minutes
      );

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

      // Invalider le cache avant le refresh
      cacheService.invalidate('aggregations:');

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
      const cacheKey = 'aggregations:zones';

      const data = await cacheService.getOrSet(
        cacheKey,
        async () => {
          const AggregationRepository = require('../repositories/aggregationRepository');
          return await AggregationRepository.getZoneAggregations();
        },
        300 // TTL: 5 minutes
      );

      res.json({
        success: true,
        data
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

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required'
        });
      }

      // Ne pas cacher les données agents (trop spécifiques)
      const AggregationRepository = require('../repositories/aggregationRepository');
      const agents = await AggregationRepository.getAgentPerformances(startDate, endDate);

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