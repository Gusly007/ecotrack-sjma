const cron = require('node-cron');
const logger = require('../utils/logger');

class SchedulerService {
  constructor(reportService) {
    this.reportService = reportService;
  }

  /**
   * Configurer tous les schedules
   */
  setupSchedules() {
    // Rapport quotidien - tous les jours à 18h
    cron.schedule('0 18 * * *', () => {
      logger.info('Running daily report generation...');
      this.reportService.generateAndSendReport('daily');
    });

    // Rapport hebdomadaire - tous les lundis à 9h
    cron.schedule('0 9 * * 1', () => {
      logger.info('Running weekly report generation...');
      this.reportService.generateAndSendReport('weekly');
    });

    // Rapport mensuel - le 1er de chaque mois à 9h
    cron.schedule('0 9 1 * *', () => {
      logger.info('Running monthly report generation...');
      this.reportService.generateAndSendReport('monthly');
    });

    logger.info('Report schedules configured');
  }
}

module.exports = SchedulerService;