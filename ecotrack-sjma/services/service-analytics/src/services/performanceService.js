const AgentPerformanceRepository = require('../repositories/agentPerformanceRepository');
const EnvironmentalImpactRepository = require('../repositories/environmentalImpactRepository');
const ConstantsRepository = require('../repositories/constantsRepository');
const DateUtils = require('../utils/dateUtils');
const logger = require('../utils/logger');

let cachedEnvConstants = null;

async function getEnvConstants() {
  if (!cachedEnvConstants) {
    const constants = await ConstantsRepository.getEnvironmentalConstants();
    cachedEnvConstants = {
      CO2_PER_KM: constants.CO2_PER_KM || 0.85,
      FUEL_CONSUMPTION_PER_100KM: constants.FUEL_CONSUMPTION_PER_100KM || 35,
      FUEL_PRICE_PER_LITER: constants.FUEL_PRICE_PER_LITER || 1.65,
      LABOR_COST_PER_HOUR: constants.LABOR_COST_PER_HOUR || 50,
      MAINTENANCE_COST_PER_KM: constants.MAINTENANCE_COST_PER_KM || 0.15,
      CO2_PER_TREE_PER_YEAR: constants.CO2_PER_TREE_PER_YEAR || 20,
      CO2_PER_KM_CAR: constants.CO2_PER_KM_CAR || 0.12
    };
  }
  return cachedEnvConstants;
}

class PerformanceService {
  /**
   * Dashboard complet de performance (agents + environnement)
   */
  static async getCompleteDashboard(period = 'week') {
    try {
      const { start, end } = DateUtils.getPeriodDates(period);

      const [
        agentsRanking,
        environmentalData,
        impactByZone
      ] = await Promise.all([
        AgentPerformanceRepository.getAgentsRanking(start, end, 10),
        EnvironmentalImpactRepository.getEnvironmentalImpact(start, end),
        EnvironmentalImpactRepository.getImpactByZone(start, end)
      ]);

      // Calculer l'impact environnemental
      const environmental = await this._calculateEnvironmentalMetrics(environmentalData);

      return {
        agents: {
          ranking: agentsRanking,
          topPerformer: agentsRanking[0] || null,
          averageSuccessRate: this._calculateAverageSuccessRate(agentsRanking)
        },
        environmental,
        zones: impactByZone,
        period: { start, end },
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error getting complete dashboard:', error);
      throw error;
    }
  }

  /**
   * Calculer les métriques environnementales
   */
  static async _calculateEnvironmentalMetrics(data) {
    const ENV = await getEnvConstants();
    
    if (!data) {
      return this._getDefaultEnvironmentalData();
    }

    const plannedDistance = parseFloat(data.planned_distance_km) || 0;
    const actualDistance = parseFloat(data.actual_distance_km) || 0;
    const distanceSaved = Math.max(0, plannedDistance - actualDistance);
    
    const plannedDuration = parseFloat(data.planned_duration_min) || 0;
    const actualDuration = parseFloat(data.actual_duration_min) || 0;
    const durationSaved = Math.max(0, plannedDuration - actualDuration);

    const co2Saved = parseFloat((distanceSaved * ENV.CO2_PER_KM).toFixed(2));
    const fuelSaved = parseFloat((distanceSaved * ENV.FUEL_CONSUMPTION_PER_100KM / 100).toFixed(2));
    const fuelCost = parseFloat((fuelSaved * ENV.FUEL_PRICE_PER_LITER).toFixed(2));
    const laborCost = parseFloat((durationSaved / 60 * ENV.LABOR_COST_PER_HOUR).toFixed(2));
    const maintenanceCost = parseFloat((distanceSaved * ENV.MAINTENANCE_COST_PER_KM).toFixed(2));
    const totalCostSaved = parseFloat((fuelCost + laborCost + maintenanceCost).toFixed(2));
    
    const equivalents = {
      trees: Math.round(co2Saved / ENV.CO2_PER_TREE_PER_YEAR),
      carKm: Math.round(co2Saved / ENV.CO2_PER_KM_CAR)
    };

    const reductionPct = plannedDistance > 0 
      ? Math.round((distanceSaved / plannedDistance) * 100 * 100) / 100 
      : 0;

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
      costs: {
        total: totalCostSaved,
        fuel: fuelCost,
        labor: laborCost,
        maintenance: maintenanceCost
      },
      routes: {
        completed: parseInt(data.completed_routes) || 0,
        total: parseInt(data.total_routes) || 0
      },
      containers: {
        collected: parseInt(data.collected_containers) || 0,
        total: parseInt(data.total_containers) || 0
      }
    };
  }

  static _getDefaultEnvironmentalData() {
    return {
      distance: { planned: 0, actual: 0, saved: 0, reductionPct: 0 },
      fuel: { saved: 0, unit: 'L' },
      co2: { saved: 0, unit: 'kg', reductionPct: 0, equivalents: { trees: 0, carKm: 0 } },
      costs: { total: 0, fuel: 0, labor: 0, maintenance: 0 },
      routes: { completed: 0, total: 0 },
      containers: { collected: 0, total: 0 }
    };
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