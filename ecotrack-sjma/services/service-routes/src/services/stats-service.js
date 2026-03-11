const { nearestNeighborAlgorithm, twoOptAlgorithm, totalDistance } = require('./optimization-service');

class StatsService {
  constructor(statsRepository) {
    this.statsRepo = statsRepository;
  }

  async getDashboard() {
    return this.statsRepo.getDashboard();
  }

  async getKpis(options = {}) {
    return this.statsRepo.getKpis(options);
  }

  async getCollecteStats(options = {}) {
    return this.statsRepo.getCollecteStats(options);
  }

  /**
   * Comparaison des algorithmes d'optimisation
   * Montre les métriques réelles en DB + une simulation sur des données actuelles
   */
  async getAlgorithmComparison(db) {
    const dbStats = await this.statsRepo.getAlgorithmComparison();

    // Simuler sur un ensemble de conteneurs pour illustration
    // En production, ceci serait basé sur des tournées historiques réelles
    const sampleContainers = await db.query(`
      SELECT
        id_conteneur,
        ST_Y(position) AS latitude,
        ST_X(position) AS longitude
      FROM conteneur
      WHERE statut = 'ACTIF' AND position IS NOT NULL
      LIMIT 20
    `);

    const containers = sampleContainers.rows;
    let simulationResult = null;

    if (containers.length >= 3) {
      const nnRoute = nearestNeighborAlgorithm(containers);
      const twoOptRoute = twoOptAlgorithm([...nnRoute]);
      const nnDist = totalDistance(nnRoute);
      const twoOptDist = totalDistance(twoOptRoute);
      const gain = nnDist > 0 ? ((nnDist - twoOptDist) / nnDist * 100).toFixed(2) : 0;

      simulationResult = {
        nb_conteneurs: containers.length,
        nearest_neighbor_km: parseFloat(nnDist.toFixed(3)),
        two_opt_km: parseFloat(twoOptDist.toFixed(3)),
        gain_pct: parseFloat(gain),
        recommandation: twoOptDist < nnDist ? '2opt' : 'nearest_neighbor'
      };
    }

    return {
      statistiques_historiques: dbStats,
      simulation_actuelle: simulationResult
    };
  }
}

module.exports = StatsService;
