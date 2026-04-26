import logRepository from '../repositories/logRepository.js';
import logger from '../middleware/logger.js';

class CentralizedLoggingService {
  async connect() {
    try {
      await logRepository.connect();
      await logRepository.createTable();
      logger.info('Centralized logging connected and table created');
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to connect centralized logging');
      throw err;
    }
  }

  async log(data) {
    try {
      return await logRepository.save(data);
    } catch (err) {
      logger.error({ err: err.message }, 'Centralized logging failed');
    }
  }

  async queryLogs(filters = {}) {
    // Filter out 'all' values - they mean no filter should be applied
    const cleanedFilters = {};
    if (filters.service && filters.service !== 'all') cleanedFilters.service = filters.service;
    if (filters.level && filters.level !== 'all') cleanedFilters.level = filters.level;
    if (filters.action && filters.action !== 'all') cleanedFilters.action = filters.action;
    if (filters.startDate) cleanedFilters.startDate = filters.startDate;
    if (filters.endDate) cleanedFilters.endDate = filters.endDate;
    if (filters.limit) cleanedFilters.limit = filters.limit;
    if (filters.offset) cleanedFilters.offset = filters.offset;
    if (filters.search) cleanedFilters.search = filters.search;
    if (filters.userId) cleanedFilters.userId = filters.userId;
    
    return logRepository.getLogs(cleanedFilters);
  }

  async getLogs(filters = {}) {
    return logRepository.getLogs(filters);
  }

  async info(action, service, message, metadata) {
    return this.log({ level: 'INFO', action, service, message, metadata });
  }

  async warn(action, service, message, metadata) {
    return this.log({ level: 'WARN', action, service, message, metadata });
  }

  async error(action, service, message, metadata) {
    return this.log({ level: 'ERROR', action, service, message, metadata });
  }

  async debug(action, service, message, metadata) {
    return this.log({ level: 'DEBUG', action, service, message, metadata });
  }

  async getStats(days = 7) {
    return logRepository.getStats(days);
  }

  async getSummary(days = 7) {
    return logRepository.getSummary(days);
  }

  async getFilterValues() {
    try {
      const [services, levels, actions] = await Promise.all([
        logRepository.getDistinctValues('service'),
        logRepository.getDistinctValues('level'),
        logRepository.getDistinctValues('action')
      ]);
      return { services, levels, actions };
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get filter values');
      throw err;
    }
  }

  async exportLogs(filters = {}) {
    return logRepository.getLogs(filters);
  }

  async cleanup(olderThanDays = 30) {
    const days = typeof olderThanDays === 'object'
      ? (olderThanDays.days || olderThanDays.olderThanDays || 30)
      : olderThanDays;
    return logRepository.deleteOldLogs(days);
  }
}

export default new CentralizedLoggingService();
