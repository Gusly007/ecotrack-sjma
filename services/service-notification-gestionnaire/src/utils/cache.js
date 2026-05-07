'use strict';

const logger = require('./logger');
const { getRedisClient } = require('../db/redis-client');

/**
 * Service de cache utilisant Redis
 * Pattern : getOrCache(key, ttl, fetchFunction)
 */
class CacheService {
  /**
   * Récupère une valeur du cache ou la calcule et la met en cache
   * 
   * @param {string} key - Clé Redis
   * @param {number} ttl - Durée de vie en secondes
   * @param {Function} fetchFn - Fonction async qui retourne la donnée
   * @returns {Promise<any>} Donnée du cache ou calculée
   */
  static async getOrCache(key, ttl, fetchFn) {
    try {
      const redis = getRedisClient();

      // 1. Essayer depuis Redis
      try {
        const cached = await redis.get(key);
        if (cached) {
          logger.debug({ key }, 'Cache hit');
          return JSON.parse(cached);
        }
      } catch (err) {
        logger.warn({ key, error: err.message }, 'Redis GET error - fallback to source');
      }

      // 2. Calculer la donnée
      logger.debug({ key }, 'Cache miss - fetching from source');
      const data = await fetchFn();

      // 3. Mettre en cache
      try {
        await redis.setEx(key, ttl, JSON.stringify(data));
      } catch (err) {
        logger.warn({ key, error: err.message }, 'Redis SET error - data still returned');
      }

      return data;
    } catch (err) {
      logger.error({ key, error: err.message }, 'Cache error - calling source directly');
      // Fallback : retourner la donnée sans cache
      return await fetchFn();
    }
  }

  /**
   * Invalide une clé du cache
   * 
   * @param {string|string[]} keys - Une ou plusieurs clés
   * @returns {Promise<number>} Nombre de clés supprimées
   */
  static async invalidate(keys) {
    try {
      const redis = getRedisClient();
      const keyArray = Array.isArray(keys) ? keys : [keys];

      if (keyArray.length === 0) return 0;

      const count = await redis.del(keyArray);
      logger.debug({ keys: keyArray, count }, 'Cache invalidated');
      return count;
    } catch (err) {
      logger.error({ error: err.message }, 'Cache invalidation error');
      return 0;
    }
  }

  /**
   * Invalide toutes les clés correspondant à un pattern
   * 
   * @param {string} pattern - Pattern Redis (ex: "ecotrack:notifications:*")
   * @returns {Promise<number>} Nombre de clés supprimées
   */
  static async invalidatePattern(pattern) {
    try {
      const redis = getRedisClient();
      const keys = await redis.keys(pattern);

      if (keys.length === 0) return 0;

      const count = await redis.del(keys);
      logger.debug({ pattern, count }, 'Cache pattern invalidated');
      return count;
    } catch (err) {
      logger.error({ pattern, error: err.message }, 'Cache pattern invalidation error');
      return 0;
    }
  }

  /**
   * Récupère la valeur d'une clé du cache
   * 
   * @param {string} key - Clé Redis
   * @returns {Promise<any>} Donnée ou null
   */
  static async get(key) {
    try {
      const redis = getRedisClient();
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      logger.error({ key, error: err.message }, 'Cache GET error');
      return null;
    }
  }

  /**
   * Définit une valeur dans le cache
   * 
   * @param {string} key - Clé Redis
   * @param {any} value - Valeur à mettre en cache
   * @param {number} ttl - Durée de vie en secondes
   * @returns {Promise<boolean>} Succès
   */
  static async set(key, value, ttl) {
    try {
      const redis = getRedisClient();
      await redis.setEx(key, ttl, JSON.stringify(value));
      logger.debug({ key, ttl }, 'Cache SET');
      return true;
    } catch (err) {
      logger.error({ key, error: err.message }, 'Cache SET error');
      return false;
    }
  }
}

module.exports = CacheService;
