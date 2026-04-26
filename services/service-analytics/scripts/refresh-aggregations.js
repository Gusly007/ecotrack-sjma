require('dotenv').config();
const AggregationService = require('../src/services/aggregationService');
const logger = require('../src/utils/logger');

async function refreshAggregations() {
  try {
    logger.info('Starting scheduled aggregation refresh...');
    
    await AggregationService.refreshAll();
    
    logger.info('Scheduled aggregation refresh completed');
    process.exit(0);
  } catch (error) {
    logger.error('Scheduled aggregation refresh failed:', error);
    process.exit(1);
  }
}

refreshAggregations();