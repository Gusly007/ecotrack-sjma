const KPIRepository = require('../repositories/kpiRepository');
const AggregationRepository = require('../repositories/aggregationRepository');
const DateUtils = require('../utils/dateUtils');
const logger = require('../utils/logger');

class DashboardService {
  /**
   * Données complètes pour le dashboard
   */
  static async getDashboardData(period = 'week') {
    try {
      const { start, end } = DateUtils.getPeriodDates(period);

      // Récupération parallèle des données
      const [
        realTimeKPIs,
        fillEvolution,
        zoneHeatmap,
        topCritical,
        globalAggregation
      ] = await Promise.all([
        KPIRepository.getRealTimeKPIs(),
        KPIRepository.getFillLevelEvolution(7),
        KPIRepository.getZoneHeatmap(),
        KPIRepository.getTopCriticalContainers(10),
        AggregationRepository.getGlobalAggregation()
      ]);

      // Calcul des tendances
      const trend = this.calculateTrend(fillEvolution);

      return {
        realTime: realTimeKPIs,
        global: globalAggregation,
        evolution: {
          data: fillEvolution,
          trend
        },
        heatmap: zoneHeatmap,
        critical: topCritical,
        period: { start, end },
        generatedAt: new Date(),
        refreshRate: 30 // secondes
      };
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Calculer la tendance
   */
  static calculateTrend(data) {
    if (!data || data.length < 3) return 'stable';

    const values = data.map(d => parseFloat(d.avg_fill_level));
    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const older = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const change = ((recent - older) / older) * 100;

    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  /**
   * Générer des insights automatiques
   */
  static generateInsights(data) {
    const insights = [];

    // Analyse conteneurs critiques
    if (data.realTime.critical_containers > 20) {
      insights.push({
        type: 'warning',
        category: 'capacity',
        title: 'Conteneurs critiques élevés',
        message: `${data.realTime.critical_containers} conteneurs sont au-dessus de 80%`,
        action: 'Planifier des tournées supplémentaires',
        priority: 'high'
      });
    }

    // Analyse tournées
    if (data.realTime.active_routes === 0 && data.realTime.critical_containers > 10) {
      insights.push({
        type: 'alert',
        category: 'routes',
        title: 'Aucune tournée active',
        message: 'Des conteneurs critiques nécessitent une collecte',
        action: 'Lancer une tournée d\'urgence',
        priority: 'urgent'
      });
    }

    // Analyse signalements
    if (data.realTime.open_reports > 15) {
      insights.push({
        type: 'warning',
        category: 'reports',
        title: 'Signalements non traités',
        message: `${data.realTime.open_reports} signalements ouverts`,
        action: 'Prioriser le traitement des signalements',
        priority: 'medium'
      });
    }

    // Analyse tendance
    if (data.evolution.trend === 'up') {
      insights.push({
        type: 'info',
        category: 'trend',
        title: 'Tendance à la hausse',
        message: 'Le remplissage moyen augmente',
        action: 'Anticiper une augmentation de la fréquence de collecte',
        priority: 'low'
      });
    }

    return insights;
  }
}

module.exports = DashboardService;