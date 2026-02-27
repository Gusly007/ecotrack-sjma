const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes par défaut
      checkperiod: 60,
      useClones: false
    });

    this.cache.on('expired', (key) => {
      logger.info(`Cache expired: ${key}`);
    });

    this.cache.on('set', (key) => {
      logger.info(`Cache set: ${key}`);
    });
  }

  /**
   * Get or set with automatic fetch
   */
  async getOrSet(key, fetchFunction, ttl = 300) {
    try {
      // Vérifier le cache
      const cached = this.cache.get(key);
      if (cached !== undefined) {
        logger.info(`Cache HIT: ${key}`);
        return cached;
      }

      // Cache MISS - récupérer les données
      logger.info(`Cache MISS: ${key}`);
      const data = await fetchFunction();
      
      // Stocker en cache
      this.cache.set(key, data, ttl);
      
      return data;
    } catch (error) {
      logger.error(`Cache error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalider par pattern
   */
  invalidate(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => {
      this.cache.del(key);
      logger.info(`Cache invalidated: ${key}`);
    });

    return matchingKeys.length;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.flushAll();
    logger.info('Cache cleared completely');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Warm up cache with common queries
   */
  async warmUp() {
    logger.info('Warming up cache...');
    
    const DashboardService = require('./dashboardService');
    const AggregationService = require('./aggregationService');
    
    try {
      // Précharger les données fréquentes
      await Promise.all([
        this.getOrSet('dashboard:week', 
          () => DashboardService.getDashboardData('week'), 180),
        this.getOrSet('aggregations:global', 
          () => AggregationService.getCompleteAggregations('month'), 300)
      ]);
      
      logger.info('Cache warmed up successfully');
    } catch (error) {
      logger.error('Cache warm-up failed:', error);
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;