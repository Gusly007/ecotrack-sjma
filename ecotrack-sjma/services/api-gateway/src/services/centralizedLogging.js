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

  async getLogs(filters) {
    return logRepository.getLogs(filters);
  }

  async getStats() {
    return logRepository.getStats();
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

  async cleanup(olderThanDays = 30) {
    return logRepository.deleteOldLogs(olderThanDays);
  }
}

export default new CentralizedLoggingService();
