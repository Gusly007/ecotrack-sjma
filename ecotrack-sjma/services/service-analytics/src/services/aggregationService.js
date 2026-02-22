const AggregationRepository = require('../repositories/aggregationRepository');
const DateUtils = require('../utils/dateUtils');
const logger = require('../utils/logger');

class AggregationService {
  /**
   * Initialiser les vues matérialisées
   */
  static async initialize() {
    try {
      logger.info('Initializing materialized views...');
      await AggregationRepository.createMaterializedViews();
      logger.info('Materialized views initialized');
    } catch (error) {
      logger.error('Failed to initialize views:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les agrégations pour le dashboard
   */
  static async getCompleteAggregations(period = 'month') {
    try {
      const { start, end } = DateUtils.getPeriodDates(period);

      const [
        globalStats,
        dailyStats,
        zoneStats,
        typeStats,
        agentPerformances
      ] = await Promise.all([
        AggregationRepository.getGlobalAggregation(),
        AggregationRepository.getDailyAggregations(30),
        AggregationRepository.getZoneAggregations(),
        AggregationRepository.getTypeAggregations(),
        AggregationRepository.getAgentPerformances(start, end)
      ]);

      return {
        global: globalStats,
        daily: dailyStats,
        zones: zoneStats,
        types: typeStats,
        agents: agentPerformances,
        period: { start, end }
      };
    } catch (error) {
      logger.error('Error getting complete aggregations:', error);
      throw error;
    }
  }

  /**
   * Rafraîchir toutes les vues
   */
  static async refreshAll() {
    try {
      logger.info('Refreshing all aggregations...');
      const result = await AggregationRepository.refreshMaterializedViews();
      logger.info('All aggregations refreshed');
      return result;
    } catch (error) {
      logger.error('Error refreshing aggregations:', error);
      throw error;
    }
  }
}

module.exports = AggregationService;