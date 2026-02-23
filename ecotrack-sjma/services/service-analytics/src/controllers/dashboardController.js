const DashboardService = require('../services/dashboardService');
const ChartService = require('../services/chartService');
const logger = require('../utils/logger');

class DashboardController {
  /**
   * GET /api/analytics/dashboard
   */
  static async getDashboard(req, res) {
    try {
      const { period = 'week' } = req.query;

      logger.info(`Dashboard requested for period: ${period}`);

      const data = await DashboardService.getDashboardData(period);
      const insights = DashboardService.generateInsights(data);

      // Préparer les données pour les graphiques
      const chartData = ChartService.prepareChartData(data.evolution.data);

      res.json({
        success: true,
        data: {
          ...data,
          insights,
          chartData
        }
      });
    } catch (error) {
      logger.error('Error in getDashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data',
        message: error.message
      });
    }
  }

  /**
   * GET /api/analytics/realtime
   */
  static async getRealTimeStats(req, res) {
    try {
      const KPIRepository = require('../repositories/kpiRepository');
      
      const [kpis, topCritical] = await Promise.all([
        KPIRepository.getRealTimeKPIs(),
        KPIRepository.getTopCriticalContainers(5)
      ]);

      res.json({
        success: true,
        data: {
          kpis,
          criticalContainers: topCritical,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error in getRealTimeStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch real-time stats'
      });
    }
  }

  /**
   * GET /api/analytics/heatmap
   */
  static async getHeatmap(req, res) {
    try {
      const KPIRepository = require('../repositories/kpiRepository');
      const zones = await KPIRepository.getZoneHeatmap();

      // Convertir en GeoJSON pour les cartes
      const geojson = {
        type: 'FeatureCollection',
        features: zones.map(zone => ({
          type: 'Feature',
          geometry: zone.geometry,
          properties: {
            id: zone.id_zone,
            name: zone.zone_name,
            code: zone.zone_code,
            containersCount: zone.containers_count,
            avgFillLevel: zone.avg_fill_level,
            criticalCount: zone.critical_count,
            status: zone.status
          }
        }))
      };

      res.json({
        success: true,
        data: geojson
      });
    } catch (error) {
      logger.error('Error in getHeatmap:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch heatmap data'
      });
    }
  }

  /**
   * GET /api/analytics/evolution
   */
  static async getEvolution(req, res) {
    try {
      const { days = 7 } = req.query;
      const KPIRepository = require('../repositories/kpiRepository');
      
      const evolution = await KPIRepository.getFillLevelEvolution(parseInt(days));
      const chartData = ChartService.prepareChartData(evolution);

      res.json({
        success: true,
        data: {
          evolution,
          chartData
        }
      });
    } catch (error) {
      logger.error('Error in getEvolution:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch evolution data'
      });
    }
  }
}

module.exports = DashboardController;