import { createClient } from 'redis';
import logger from '../utils/logger.js';

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.client && this.isConnected) return;

    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = process.env.REDIS_PORT || 6379;
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    this.client = createClient({
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

    try {
      await this.client.connect();
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis connection failed, caching disabled');
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error({ err: err.message, key }, 'Redis GET error');
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    if (!this.isConnected || !this.client) return false;
    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (err) {
      logger.error({ err: err.message, key }, 'Redis SET error');
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (err) {
      logger.error({ err: err.message, key }, 'Redis DEL error');
      return false;
    }
  }

  async invalidatePattern(pattern) {
    if (!this.isConnected || !this.client) return false;
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

  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export default new CacheService();
