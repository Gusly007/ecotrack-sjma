const PDFService = require('../services/pdfService');
const ExcelService = require('../services/excelService');
const EmailService = require('../services/emailService');
const DashboardService = require('../services/dashboardService');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

class ReportController {
  /**
   * POST /api/analytics/reports/generate
   */
  static async generateReport(req, res) {
    try {
      const { format = 'pdf', reportType = 'weekly', email } = req.body;

      logger.info(`Generating ${format} ${reportType} report`);
      logger.info(`Request body: ${JSON.stringify(req.body)}`);

      // Préparer les données pour le rapport (données factices pour test)
      const reportData = {
        completedRoutes: 15,
        containersCollected: 45,
        totalDistance: '125.5',
        resolvedReports: 8,
        criticalContainers: 3,
        routes: [],
        zones: [],
        period: new Date().toLocaleDateString('fr-FR'),
        totalRoutes: 20,
        costSaved: '250',
        co2Saved: '50',
        overflowRate: '1.5',
        totalReports: '25',
        resolvedRate: '85',
        distanceReduction: '15',
        co2Reduction: '12',
        recommendations: ['Optimisation des tournées recommandée']
      };

      logger.info(`Report data prepared, generating ${format}...`);

      // Générer le rapport
      let report;
      try {
        if (format === 'pdf') {
          logger.info('Calling PDFService.generateReport...');
          report = await PDFService.generateReport(reportData, reportType);
          logger.info('PDFService.generateReport completed');
        } else if (format === 'excel') {
          report = await ExcelService.generateReport(reportData, reportType);
        } else {
          return res.status(400).json({
            success: false,
            error: 'Invalid format. Use "pdf" or "excel"'
          });
        }
      } catch (genError) {
        logger.error('PDF/Excel generation error:', genError);
        throw genError;
      }

      // Envoyer par email si demandé
      if (email) {
        const emailService = new EmailService();
        await emailService.sendReport(report, [email], reportType);
      }

      res.json({
        success: true,
        data: {
          format,
          reportType,
          fileName: report.fileName,
          url: report.url,
          size: report.size,
          emailSent: !!email,
          generatedAt: new Date().toISOString()
        }
      });

      logger.info(`Report generated: ${report.fileName}`);
    } catch (error) {
      logger.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate report',
        message: error.message
      });
    }
  }

  /**
   * GET /api/analytics/reports/download/:filename
   */
  static async downloadReport(req, res) {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.env.REPORTS_DIR || './reports', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      res.download(filePath);
    } catch (error) {
      logger.error('Error downloading report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download report'
      });
    }
  }
}

module.exports = ReportController;