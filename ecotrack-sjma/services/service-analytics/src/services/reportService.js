const PDFService = require('./pdfService');
const ExcelService = require('./excelService');
const EmailService = require('./emailService');
const DashboardService = require('./dashboardService');
const logger = require('../utils/logger');

class ReportService {
  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Générer et envoyer un rapport automatiquement
   */
  async generateAndSendReport(reportType = 'weekly', format = 'pdf') {
    try {
      logger.info(`Auto-generating ${format} ${reportType} report`);

      const data = await DashboardService.getDashboardData(
        reportType === 'monthly' ? 'month' : 
        reportType === 'weekly' ? 'week' : 'day'
      );

      let report;
      if (format === 'pdf') {
        report = await PDFService.generateReport(data, reportType);
      } else {
        report = await ExcelService.generateReport(data, reportType);
      }

      const recipients = this._getRecipients(reportType);
      if (recipients.length > 0) {
        await this.emailService.sendReport(report, recipients, reportType);
      }

      return report;
    } catch (error) {
      logger.error('Error in auto-generate report:', error);
      throw error;
    }
  }

  /**
   * Obtenir les destinataires selon le type de rapport
   */
  _getRecipients(reportType) {
    const recipients = {
      daily: (process.env.REPORT_DAILY_RECIPIENTS || '').split(',').filter(Boolean),
      weekly: (process.env.REPORT_WEEKLY_RECIPIENTS || '').split(',').filter(Boolean),
      monthly: (process.env.REPORT_MONTHLY_RECIPIENTS || '').split(',').filter(Boolean)
    };
    return recipients[reportType] || [];
  }
}

module.exports = ReportService;
