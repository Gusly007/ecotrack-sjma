const logRepository = require('../repositories/logRepository');
const logger = require('../utils/logger');

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
      logger.error({ err: err.message }, 'Failed to connect centralized logging DB');
      this.isConnected = false;
    }
  }

  async createTable() {
    // Table is created in connect()
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
      logger.error({ err: err.message }, 'Failed to insert log');
      return false;
    }
  }

  async queryLogs(options = {}) {
    if (!this.isConnected) {
      await this.connect();
    }
    return logRepository.queryLogs(options);
  }

  async getStats(days = 7) {
    if (!this.isConnected) {
      await this.connect();
    }
    return logRepository.getStats(days);
  }

  async getSummary(days = 7) {
    if (!this.isConnected) {
      await this.connect();
    }
    return logRepository.getSummary(days);
  }

  async cleanup(retentionDays = 30) {
    if (!this.isConnected) {
      await this.connect();
    }
    return logRepository.cleanup(retentionDays);
  }

  async close() {
    await logRepository.close();
    this.isConnected = false;
  }
}

module.exports = new CentralizedLoggingService();
