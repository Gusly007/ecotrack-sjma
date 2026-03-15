const cron = require('node-cron');
const AggregationService = require('../services/aggregationService');
const logger = require('../utils/logger');

function setupCronJobs() {
  // Rafraîchir les vues matérialisées toutes les heures
  cron.schedule('0 * * * *', async () => {
    logger.info('Running hourly aggregation refresh...');
    try {
      await AggregationService.refreshAll();
      logger.info('Hourly aggregation refresh completed');
    } catch (error) {
      logger.error('Hourly aggregation refresh failed:', error);
    }
  });

  logger.info(' Cron jobs configured');
}

module.exports = { setupCronJobs };