const logRepository = require('../repositories/logRepository');
const logger = require('../utils/logger');

class CentralizedLoggingService {
  async log(data) {
    try {
      return await logRepository.save(data);
    } catch (err) {
      logger.error('Centralized logging failed:', err.message);
    }
  }

  async info(action, message, metadata = {}) {
    return this.log({ level: 'INFO', action, service: 'service-analytics', message, metadata });
  }

  async warn(action, message, metadata = {}) {
    return this.log({ level: 'WARN', action, service: 'service-analytics', message, metadata });
  }

  async error(action, message, metadata = {}) {
    return this.log({ level: 'ERROR', action, service: 'service-analytics', message, metadata });
  }
}

module.exports = new CentralizedLoggingService();
