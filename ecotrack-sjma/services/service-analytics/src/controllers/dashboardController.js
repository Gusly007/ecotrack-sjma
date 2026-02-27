const DashboardService = require('../services/dashboardService');
const ChartService = require('../services/chartService');
const PerformanceService = require('../services/performanceService');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');


class DashboardController {
  /**
   * GET /api/analytics/dashboard - AVEC PERFORMANCE AGENTS + CO2
   */
  static async getDashboard(req, res) {
    try {
      const { period = 'week' } = req.query;
      const cacheKey = `dashboard:${period}`;

      logger.info(`Dashboard requested for period: ${period}`);

      // Utiliser le cache
      const completeData = await cacheService.getOrSet(
        cacheKey,
        async () => {
          const [dashboardData, performanceData] = await Promise.all([
            DashboardService.getDashboardData(period),
            PerformanceService.getCompleteDashboard(period)
          ]);

          return {
            ...dashboardData,
            agents: performanceData.agents,
            environmental: performanceData.environmental,
            kpis: {
              ...dashboardData.kpis,
              avgAgentSuccessRate: performanceData.agents.averageSuccessRate,
              topAgent: performanceData.agents.topPerformer ? {
                name: `${performanceData.agents.topPerformer.prenom} ${performanceData.agents.topPerformer.nom}`,
                score: performanceData.agents.topPerformer.overall_score,
                routes: performanceData.agents.topPerformer.completed_routes
              } : null,
              co2Saved: performanceData.environmental.co2.saved,
              co2ReductionPct: performanceData.environmental.co2.reductionPct,
              treesEquivalent: performanceData.environmental.co2.equivalents.trees,
              carKmEquivalent: performanceData.environmental.co2.equivalents.carKm,
              totalCostSaved: performanceData.environmental.costs.total,
              fuelCostSaved: performanceData.environmental.costs.fuel,
              fuelSavedLiters: performanceData.environmental.fuel.saved
            }
          };
        },
        180 // TTL: 3 minutes
      );

      const insights = DashboardService.generateInsights(completeData);
      const chartData = ChartService.prepareChartData(completeData.evolution?.data || []);

      res.json({
        success: true,
        data: {
          ...completeData,
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
      const cacheKey = 'realtime:stats';
      
      // Cache court pour données temps réel
      const data = await cacheService.getOrSet(
        cacheKey,
        async () => {
          const KPIRepository = require('../repositories/kpiRepository');
          
          const [kpis, topCritical] = await Promise.all([
            KPIRepository.getRealTimeKPIs(),
            KPIRepository.getTopCriticalContainers(5)
          ]);

          return {
            kpis,
            criticalContainers: topCritical,
            timestamp: new Date().toISOString()
          };
        },
        30 // TTL: 30 secondes
      );

      res.json({
        success: true,
        data
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
      const cacheKey = 'heatmap:zones';

      // Cache plus long pour heatmap (rarement changé)
      const geojson = await cacheService.getOrSet(
        cacheKey,
        async () => {
          const KPIRepository = require('../repositories/kpiRepository');
          const zones = await KPIRepository.getZoneHeatmap();

          return {
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
        },
        600 // TTL: 10 minutes
      );

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
      const cacheKey = `evolution:${days}`;

      const data = await cacheService.getOrSet(
        cacheKey,
        async () => {
          const KPIRepository = require('../repositories/kpiRepository');
          
          const evolution = await KPIRepository.getFillLevelEvolution(parseInt(days));
          const chartData = ChartService.prepareChartData(evolution);

          return {
            evolution,
            chartData
          };
        },
        300 // TTL: 5 minutes
      );

      res.json({
        success: true,
        data
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