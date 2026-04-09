const logger = require('../utils/logger');

let redisClient = null;

const initRedis = () => {
  if (redisClient) return redisClient;
  
  try {
    const redis = require('redis');
    const redisUrl = process.env.REDIS_URL || 'redis://ecotrack-redis:6379';
    
    redisClient = redis.createClient({ url: redisUrl });
    
    redisClient.on('error', (err) => {
      logger.warn({ err: err.message }, 'Redis connection error - caching disabled');
      redisClient = null;
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis connected - caching enabled');
    });
    
    redisClient.connect().catch(err => {
      logger.warn({ err: err.message }, 'Redis connection failed - caching disabled');
      redisClient = null;
    });
    
    return redisClient;
  } catch (err) {
    logger.warn({ err: err.message }, 'Redis not available - caching disabled');
    return null;
  }
};

const cacheMiddleware = (ttlSeconds = 60) => {
  return async (req, res, next) => {
    if (!redisClient || !redisClient.isOpen) {
      initRedis();
    }
    
    if (!redisClient || !redisClient.isOpen) {
      return next();
    }
    
    const cacheKey = `cache:${req.originalUrl || req.url}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        try {
          const data = JSON.parse(cached);
          return res.json(data);
        } catch (e) {
          await redisClient.del(cacheKey);
        }
      }
      
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (body && body.success !== false) {
          redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(body)).catch(() => {});
        }
        return originalJson(body);
      };
      
      next();
    } catch (err) {
      logger.warn({ err: err.message }, 'Cache error');
      next();
    }
  };
};

const clearCache = async (pattern = '*') => {
  if (!redisClient || !redisClient.isOpen) return;
  
  try {
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info({ count: keys.length, pattern }, 'Cache cleared');
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Cache clear error');
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
  initRedis
};
