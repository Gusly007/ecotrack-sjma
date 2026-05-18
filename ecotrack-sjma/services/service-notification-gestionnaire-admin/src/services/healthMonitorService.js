'use strict';

const http = require('http');
const https = require('https');
const logger = require('../utils/logger');
const adminNotificationService = require('./adminNotificationService');
const { ADMIN_NOTIF_TYPES, PRIORITES } = require('./adminNotificationService');

const SERVICE_ENDPOINTS = {
  'api-gateway': { url: process.env.SERVICE_API_GATEWAY_URL || 'http://localhost:3000/health', timeout: 5000 },
  'service-users': { url: process.env.SERVICE_USERS_URL || 'http://localhost:3010/health', timeout: 5000 },
  'service-containers': { url: process.env.SERVICE_CONTAINERS_URL || 'http://localhost:3011/health', timeout: 5000 },
  'service-routes': { url: process.env.SERVICE_ROUTES_URL || 'http://localhost:3012/health', timeout: 5000 },
  'service-iot': { url: process.env.SERVICE_IOT_URL || 'http://localhost:3013/health', timeout: 5000 },
  'service-gamifications': { url: process.env.SERVICE_GAMIFICATIONS_URL || 'http://localhost:3014/health', timeout: 5000 },
  'service-analytics': { url: process.env.SERVICE_ANALYTICS_URL || 'http://localhost:3015/health', timeout: 5000 },
  'postgresql': { url: process.env.POSTGRES_HEALTH_URL || null, timeout: 3000 },
  'redis': { url: process.env.REDIS_HEALTH_URL || null, timeout: 3000 },
  'kafka': { url: process.env.KAFKA_HEALTH_URL || null, timeout: 3000 }
};

const CHECK_INTERVAL_MS = parseInt(process.env.HEALTH_CHECK_INTERVAL_MS) || 30000;
const SERVICE_DOWN_THRESHOLD_MS = parseInt(process.env.SERVICE_DOWN_THRESHOLD_MS) || 120000;

class HealthMonitorService {
  constructor() {
    this.serviceStatus = {};
    this.serviceDowntime = {};
    this.intervalId = null;
    this.consecutiveFailures = {};
  }

  start() {
    logger.info({ intervalMs: CHECK_INTERVAL_MS }, 'HealthMonitorService démarré');

    this.checkAllServices();

    this.intervalId = setInterval(() => {
      this.checkAllServices();
    }, CHECK_INTERVAL_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('HealthMonitorService arrêté');
  }

  async checkAllServices() {
    const results = await Promise.allSettled(
      Object.entries(SERVICE_ENDPOINTS).map(([name, config]) =>
        this.checkService(name, config)
      )
    );

    const downServices = results
      .filter(r => r.status === 'fulfilled' && r.value === false)
      .map((_, i) => Object.keys(SERVICE_ENDPOINTS)[i]);

    if (downServices.length > 3) {
      logger.error({ count: downServices.length, services: downServices },
        'Plusieurs services sont hors ligne');
    }

    const wsService = this._getWsService();
    if (wsService) {
      wsService.emitStatsUpdate({ type: 'health', services: this.serviceStatus, timestamp: new Date() });
    }
  }

  async checkService(name, config) {
    const now = Date.now();

    try {
      if (config.url) {
        const healthy = await this._httpHealthCheck(config.url, config.timeout);
        this._updateServiceStatus(name, healthy, now);
        return healthy;
      }

      const healthy = await this._internalHealthCheck(name);
      this._updateServiceStatus(name, healthy, now);
      return healthy;
    } catch (err) {
      this._updateServiceStatus(name, false, now);
      return false;
    }
  }

  _updateServiceStatus(name, healthy, now) {
    const wasDown = this.serviceStatus[name] === false;
    this.serviceStatus[name] = healthy;

    if (!healthy) {
      if (!this.serviceDowntime[name]) {
        this.serviceDowntime[name] = now;
        this.consecutiveFailures[name] = 1;

        this._notifyServiceDown(name);
      } else {
        this.consecutiveFailures[name]++;

        const duration = now - this.serviceDowntime[name];
        if (duration >= SERVICE_DOWN_THRESHOLD_MS && this.consecutiveFailures[name] >= 3) {
          this._notifyServiceDownPersistent(name, duration);
        }
      }
    } else {
      if (wasDown) {
        this._notifyServiceRecovered(name, this.serviceDowntime[name] ? now - this.serviceDowntime[name] : 0);
      }
      this.serviceDowntime[name] = null;
      this.consecutiveFailures[name] = 0;
    }

    logger.debug({ service: name, healthy, uptime: healthy ? 'up' : 'down' }, 'Service health check');
  }

  async _notifyServiceDown(name) {
    try {
      await adminNotificationService.processKafkaEvent({
        type: ADMIN_NOTIF_TYPES.SERVICE_DOWN,
        source: 'health-monitor',
        data: {
          service: name,
          url: SERVICE_ENDPOINTS[name]?.url || 'N/A',
          error: 'Service non joignable',
          duration: 0
        }
      });
    } catch (err) {
      logger.error({ error: err.message, service: name }, 'Échec notification service down');
    }
  }

  async _notifyServiceDownPersistent(name, duration) {
    try {
      await adminNotificationService.processKafkaEvent({
        type: ADMIN_NOTIF_TYPES.SERVICE_DOWN,
        source: 'health-monitor',
        data: {
          service: name,
          url: SERVICE_ENDPOINTS[name]?.url || 'N/A',
          error: `Service hors ligne depuis ${Math.round(duration / 1000)}s`,
          duration: Math.round(duration / 1000)
        }
      });
    } catch (err) {
      logger.error({ error: err.message, service: name }, 'Échec notification service down persistant');
    }
  }

  async _notifyServiceRecovered(name, duration) {
    try {
      const adminIds = await this._getAdminIds();
      if (!adminIds || adminIds.length === 0) return;

      await adminNotificationService.createBulkAdminNotifications(
        adminIds.map(id => ({
          id_utilisateur: id,
          type: ADMIN_NOTIF_TYPES.SERVICE_DOWN,
          titre: `Service rétabli : ${name}`,
          corps: `Le service ${name} est de nouveau opérationnel après ${Math.round(duration / 1000)}s d interruption.`,
          priorite: PRIORITES.MOYENNE,
          categorie: 'INFRASTRUCTURE'
        }))
      );
    } catch (err) {
      logger.error({ error: err.message, service: name }, 'Échec notification service recovered');
    }
  }

  async _httpHealthCheck(url, timeout = 5000) {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;
      const req = protocol.get(url, { timeout }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async _internalHealthCheck(name) {
    try {
      const { pool } = require('../db/connexion');
      switch (name) {
        case 'postgresql':
          await pool.query('SELECT 1');
          return true;
        case 'redis':
          try {
            const { getRedisClient } = require('../db/redis-client');
            const redis = getRedisClient();
            await redis.ping();
            return true;
          } catch {
            return false;
          }
        case 'kafka':
          try {
            const kafkaConsumer = require('../../kafkaConsumer');
            return kafkaConsumer.isRunning();
          } catch {
            return false;
          }
        default:
          return true;
      }
    } catch {
      return false;
    }
  }

  async _getAdminIds() {
    try {
      const notificationRepository = require('../repositories/notification.repository');
      return await notificationRepository.findAllAdminUserIds();
    } catch {
      return [];
    }
  }

  _getWsService() {
    try {
      const { getWebSocketAdminService } = require('./websocketAdminService');
      return getWebSocketAdminService();
    } catch {
      return null;
    }
  }

  getServiceStatus() {
    return { ...this.serviceStatus };
  }

  getServiceUptime(name) {
    return this.serviceDowntime[name] ? Date.now() - this.serviceDowntime[name] : 0;
  }
}

module.exports = new HealthMonitorService();
