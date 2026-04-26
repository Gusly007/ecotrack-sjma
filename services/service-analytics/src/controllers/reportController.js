const PDFService = require('../services/pdfService');
const ExcelService = require('../services/excelService');
const EmailService = require('../services/emailService');
const DashboardService = require('../services/dashboardService');
const PerformanceService = require('../services/performanceService');
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

      // Récupérer les données réelles du dashboard
      const period = reportType === 'month' ? 'month' : reportType === 'weekly' ? 'week' : 'day';
      
      const [dashboardData, performanceData] = await Promise.all([
        DashboardService.getDashboardData(period),
        PerformanceService.getCompleteDashboard(period)
      ]);

      // Préparer les données pour le rapport avec données réelles
      const reportData = {
        // Données tournées
        completedRoutes: performanceData.environmental?.routes?.completed || 0,
        containersCollected: performanceData.environmental?.containers?.collected || 0,
        totalDistance: performanceData.environmental?.distance?.actual || '0',
        
        // Données conteneurs
        resolvedReports: dashboardData.realTime?.open_reports || 0,
        criticalContainers: dashboardData.realTime?.critical_containers || 0,
        
        // Données zones
        zones: dashboardData.heatmap || [],
        routes: dashboardData.critical || [],
        
        // Période
        period: new Date().toLocaleDateString('fr-FR'),
        totalRoutes: performanceData.environmental?.routes?.total || 0,
        
        // Impact environnemental (DORA)
        costSaved: performanceData.environmental?.costs?.total?.toString() || '0',
        co2Saved: performanceData.environmental?.co2?.saved?.toString() || '0',
        overflowRate: ((parseFloat(dashboardData.global?.critical_containers || '0') / parseFloat(dashboardData.global?.total_containers || '1')) * 100).toFixed(1),
        totalReports: dashboardData.realTime?.reports_today?.toString() || '0',
        resolvedRate: '85', // À calculer depuis la DB
        distanceReduction: performanceData.environmental?.distance?.reductionPct?.toString() || '0',
        co2Reduction: performanceData.environmental?.co2?.reductionPct?.toString() || '0',
        
        // Fuel économisé
        fuelSaved: performanceData.environmental?.fuel?.saved || 0,
        
        // Équivalences CO2
        treesEquivalent: performanceData.environmental?.co2?.equivalents?.trees || 0,
        carKmEquivalent: performanceData.environmental?.co2?.equivalents?.carKm || 0,
        
        // Coûts détaillés
        fuelCost: performanceData.environmental?.costs?.fuel || 0,
        laborCost: performanceData.environmental?.costs?.labor || 0,
        maintenanceCost: performanceData.environmental?.costs?.maintenance || 0,
        
        // Agents
        agents: performanceData.agents || {},
        
        // Recommandations
        recommendations: DashboardService.generateInsights(dashboardData)
      };

      logger.info(`Report data prepared: costSaved=${reportData.costSaved}, co2Saved=${reportData.co2Saved}, fuelSaved=${reportData.fuelSaved}`);

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

  /**
   * POST /api/analytics/reports/environmental - Rapport d'impact environnemental
   */
  static async generateEnvironmentalReport(req, res) {
    try {
      const { format = 'pdf', period = 'week', email } = req.body;

      logger.info(`Generating environmental ${format} report for period: ${period}`);

      const performanceData = await PerformanceService.getCompleteDashboard(period);
      
      const reportData = {
        period: new Date().toLocaleDateString('fr-FR'),
        environmental: performanceData.environmental,
        zones: performanceData.zones || [],
        agents: performanceData.agents,
        recommendations: [
          'Optimisation des tournées recommandée',
          'Réduire les distances vides entre les zones',
          'Prioriser la collecte des zones critiques'
        ]
      };

      let report;
      if (format === 'pdf') {
        report = await PDFService.generateEnvironmentalReport(reportData, period);
      } else {
        report = await ExcelService.generateEnvironmentalReport(reportData, period);
      }

      if (email) {
        const emailService = new EmailService();
        await emailService.sendReport(report, [email], `${period}_environmental`);
      }

      res.json({
        success: true,
        data: {
          format,
          reportType: 'environmental',
          period,
          fileName: report.fileName,
          url: report.url,
          size: report.size,
          emailSent: !!email,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error generating environmental report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate environmental report',
        message: error.message
      });
    }
  }

  /**
   * POST /api/analytics/reports/routes-performance - Rapport performance des tournées
   */
  static async generateRoutesPerformanceReport(req, res) {
    try {
      const { format = 'pdf', period = 'week', email } = req.body;

      logger.info(`Generating routes performance ${format} report for period: ${period}`);

      const performanceData = await PerformanceService.getCompleteDashboard(period);
      
      const reportData = {
        period: new Date().toLocaleDateString('fr-FR'),
        agents: performanceData.agents,
        environmental: performanceData.environmental,
        recommendations: [
          'Former les agents aux bonnes pratiques',
          'Optimiser la planification des tournées',
          'Suivre régulièrement les indicateurs'
        ]
      };

      let report;
      if (format === 'pdf') {
        report = await PDFService.generateRoutesPerformanceReport(reportData, period);
      } else {
        report = await ExcelService.generateRoutesPerformanceReport(reportData, period);
      }

      if (email) {
        const emailService = new EmailService();
        await emailService.sendReport(report, [email], `${period}_routes_performance`);
      }

      res.json({
        success: true,
        data: {
          format,
          reportType: 'routes_performance',
          period,
          fileName: report.fileName,
          url: report.url,
          size: report.size,
          emailSent: !!email,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error generating routes performance report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate routes performance report',
        message: error.message
      });
    }
  }
}

module.exports = ReportController;