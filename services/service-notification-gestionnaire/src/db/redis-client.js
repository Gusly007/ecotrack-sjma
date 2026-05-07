'use strict';

const redis = require('redis');
const logger = require('../utils/logger');

let client = null;

const createRedisClient = async () => {
  try {
    const redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 50, 500);
        }
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB, 10) || 0,
    });

    redisClient.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis error');
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis ready');
    });

    await redisClient.connect();
    client = redisClient;
    return client;
  } catch (err) {
    logger.error({ error: err.message }, 'Failed to connect to Redis');
    throw err;
  }
};

const getRedisClient = () => {
  if (!client) {
    throw new Error('Redis client not initialized');
  }
  return client;
};

const disconnectRedis = async () => {
  if (client) {
    await client.disconnect();
    client = null;
    logger.info('Redis disconnected');
  }
};

module.exports = {
  createRedisClient,
  getRedisClient,
  disconnectRedis
};
