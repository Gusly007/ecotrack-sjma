const redis = require('redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.fallbackCache = null;
  }

  async connect() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = process.env.REDIS_PORT || 6379;
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    // Try Redis first, fallback to NodeCache if unavailable
    try {
      this.client = redis.createClient({
        socket: {
          host: redisHost,
          port: parseInt(redisPort)
        },
        password: redisPassword
      });

      this.client.on('error', (err) => {
        logger.error({ err: err.message }, 'Redis Client Error');
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info({ redisHost, redisPort }, 'Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis connection failed, using in-memory fallback');
      this.isConnected = false;
      
      // Fallback to NodeCache
      const NodeCache = require('node-cache');
      this.fallbackCache = new NodeCache({
        stdTTL: 300,
        checkperiod: 60,
        useClones: false
      });
    }
  }

  async get(key) {
    if (this.isConnected && this.client) {
      try {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } catch (err) {
        logger.error({ err: err.message, key }, 'Redis GET error');
        return null;
      }
    }
    
    // Fallback to NodeCache
    if (this.fallbackCache) {
      return this.fallbackCache.get(key);
    }
    return null;
  }

  async set(key, value, ttlSeconds = 300) {
    if (this.isConnected && this.client) {
      try {
        await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
        return true;
      } catch (err) {
        logger.error({ err: err.message, key }, 'Redis SET error');
        return false;
      }
    }
    
    // Fallback to NodeCache
    if (this.fallbackCache) {
      this.fallbackCache.set(key, value, ttlSeconds);
      return true;
    }
    return false;
  }

  async del(key) {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return true;
      } catch (err) {
        logger.error({ err: err.message, key }, 'Redis DEL error');
        return false;
      }
    }
    
    if (this.fallbackCache) {
      this.fallbackCache.del(key);
      return true;
    }
    return false;
  }

  async invalidatePattern(pattern) {
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
          logger.info({ pattern, count: keys.length }, 'Redis cache invalidated');
        }
        return true;
      } catch (err) {
        logger.error({ err: err.message, pattern }, 'Redis KEYS error');
        return false;
      }
    }
    
    if (this.fallbackCache) {
      const keys = this.fallbackCache.keys();
      const matchingKeys = keys.filter(key => key.includes(pattern.replace('*', '')));
      matchingKeys.forEach(key => this.fallbackCache.del(key));
      logger.info({ pattern, count: matchingKeys.length }, 'In-memory cache invalidated');
      return true;
    }
    return false;
  }

  async getOrSet(key, fetchFn, ttlSeconds = 300) {
    const cached = await this.get(key);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    const data = await fetchFn();
    if (data) {
      await this.set(key, data, ttlSeconds);
    }
    return { data, fromCache: false };
  }

  clear() {
    if (this.fallbackCache) {
      this.fallbackCache.flushAll();
    }
    logger.info('Cache cleared');
  }

  getStats() {
    if (this.fallbackCache) {
      return this.fallbackCache.getStats();
    }
    return { hits: 0, misses: 0, keys: 0 };
  }

  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

module.exports = new CacheService();
