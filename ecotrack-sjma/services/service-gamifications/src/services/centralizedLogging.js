import logRepository from '../repositories/logRepository.js';
import logger from '../utils/logger.js';

class CentralizedLoggingService {
  async log(data) {
    try {
      return await logRepository.save(data);
    } catch (err) {
      logger.error({ err: err.message }, 'Centralized logging failed');
    }
  }

  async info(action, message, metadata = {}) {
    return this.log({ level: 'INFO', action, service: 'service-gamifications', message, metadata });
  }

  async warn(action, message, metadata = {}) {
    return this.log({ level: 'WARN', action, service: 'service-gamifications', message, metadata });
  }

  async error(action, message, metadata = {}) {
    return this.log({ level: 'ERROR', action, service: 'service-gamifications', message, metadata });
  }
}

export default new CentralizedLoggingService();
