import logRepository from '../repositories/logRepository.js';
import logger from '../utils/logger.js';

class CentralizedLoggingService {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      await logRepository.connect();
      await logRepository.createTable();
      this.isConnected = true;
      logger.info('Centralized logging DB connected');
    } catch (err) {
      this.isConnected = false;
      logger.error({ err: err.message }, 'Failed to connect centralized logging DB');
    }
  }

  async createTable() {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  async log(data) {
    if (!this.isConnected) {
      await this.connect();
    }

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

  async close() {
    await logRepository.close();
    this.isConnected = false;
  }
}

export default new CentralizedLoggingService();
