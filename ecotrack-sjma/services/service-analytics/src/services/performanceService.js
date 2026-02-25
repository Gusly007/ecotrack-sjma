const AgentPerformanceRepository = require('../repositories/agentPerformanceRepository');
const ENVIRONMENTAL = require('../utils/environmentalConstants');
const DateUtils = require('../utils/dateUtils');
const logger = require('../utils/logger');

class PerformanceService {
  /**
   * Dashboard complet de performance (agents + environnement)
   */
  static async getCompleteDashboard(period = 'week') {
    try {
      const { start, end } = DateUtils.getPeriodDates(period);

      const [
        agentsRanking,
        environmentalImpact
      ] = await Promise.all([
        AgentPerformanceRepository.getAgentsRanking(start, end, 10),
        this._calculateEnvironmentalImpact(start, end)
      ]);

      return {
        agents: {
          ranking: agentsRanking,
          topPerformer: agentsRanking[0] || null,
          averageSuccessRate: this._calculateAverageSuccessRate(agentsRanking)
        },
        environmental: environmentalImpact,
        period: { start, end },
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error getting complete dashboard:', error);
      throw error;
    }
  }

  /**
   * Calculer l'impact environnemental
   */
  static async _calculateEnvironmentalImpact(startDate, endDate) {
    try {
      const db = require('../config/database');
      
      const query = `
        SELECT 
          COALESCE(SUM(t.distance_prevue_km), 0) as planned_distance_km,
          COALESCE(SUM(t.distance_reelle_km), 0) as actual_distance_km,
          COUNT(DISTINCT t.id_tournee) FILTER (WHERE t.statut = 'TERMINEE') as completed_routes,
          COUNT(DISTINCT et.id_conteneur) as total_containers,
          COUNT(DISTINCT et.id_conteneur) FILTER (WHERE et.collectee = true) as collected_containers
        FROM TOURNEE t
        LEFT JOIN ETAPE_TOURNEE et ON et.id_tournee = t.id_tournee
        WHERE t.date_tournee BETWEEN $1 AND $2
          AND t.statut IN ('TERMINEE', 'EN_COURS');
      `;

      const result = await db.query(query, [startDate, endDate]);
      const data = result.rows[0] || {};

      const plannedDistance = parseFloat(data.planned_distance_km) || 0;
      const actualDistance = parseFloat(data.actual_distance_km) || 0;
      const distanceSaved = Math.max(0, plannedDistance - actualDistance);
      
      const fuelSaved = ENVIRONMENTAL.calculateFuelSaved(distanceSaved);
      const co2Saved = ENVIRONMENTAL.calculateCO2Saved(distanceSaved, fuelSaved);
      const reductionPct = plannedDistance > 0 
        ? Math.round((distanceSaved / plannedDistance) * 100 * 100) / 100 
        : 0;

      const costsSaved = ENVIRONMENTAL.calculateCostsSaved(distanceSaved, fuelSaved);
      const equivalents = ENVIRONMENTAL.calculateEquivalents(co2Saved);

      return {
        distance: {
          planned: plannedDistance,
          actual: actualDistance,
          saved: Math.round(distanceSaved * 100) / 100,
          reductionPct
        },
        fuel: {
          saved: fuelSaved,
          unit: 'L'
        },
        co2: {
          saved: Math.round(co2Saved * 100) / 100,
          unit: 'kg',
          reductionPct,
          equivalents
        },
        costs: costsSaved,
        routes: {
          completed: parseInt(data.completed_routes) || 0,
          total: parseInt(data.total_routes) || 0
        },
        containers: {
          collected: parseInt(data.collected_containers) || 0,
          total: parseInt(data.total_containers) || 0
        }
      };
    } catch (error) {
      logger.error('Error calculating environmental impact:', error);
      return {
        distance: { planned: 0, actual: 0, saved: 0, reductionPct: 0 },
        fuel: { saved: 0, unit: 'L' },
        co2: { saved: 0, unit: 'kg', reductionPct: 0, equivalents: { trees: 0, carKm: 0, kWh: 0 } },
        costs: { fuel: 0, maintenance: 0, total: 0 },
        routes: { completed: 0, total: 0 },
        containers: { collected: 0, total: 0 }
      };
    }
  }

  /**
   * Performance détaillée d'un agent
   */
  static async getAgentDetailedPerformance(agentId, period = 'week') {
    try {
      const { start, end } = DateUtils.getPeriodDates(period);

      const [
        successRate,
        weeklyPerformance
      ] = await Promise.all([
        AgentPerformanceRepository.getAgentSuccessRate(agentId, start, end),
        AgentPerformanceRepository.getWeeklyPerformance(agentId, start)
      ]);

      if (!successRate) {
        return {
          error: 'No data available for this agent',
          agentId,
          period: { start, end }
        };
      }

      return {
        agentId,
        successRate: successRate.overall_success_rate,
        details: {
          collection: {
            rate: successRate.collection_rate,
            collected: successRate.containers_collected,
            total: successRate.containers_total
          },
          completion: {
            rate: successRate.completion_rate,
            completed: successRate.routes_completed,
            assigned: successRate.routes_assigned
          },
          efficiency: {
            time: successRate.time_efficiency_score,
            distance: successRate.distance_efficiency_score
          },
          savings: {
            distance: successRate.distance_saved_km,
            time: successRate.time_saved_min
          }
        },
        weekly: weeklyPerformance,
        period: { start, end }
      };
    } catch (error) {
      logger.error('Error getting agent detailed performance:', error);
      throw error;
    }
  }

  static _calculateAverageSuccessRate(agents) {
    if (!agents || agents.length === 0) return 0;
    const sum = agents.reduce((acc, agent) => acc + (parseFloat(agent.overall_score) || 0), 0);
    return parseFloat((sum / agents.length).toFixed(2));
  }
}

module.exports = PerformanceService;