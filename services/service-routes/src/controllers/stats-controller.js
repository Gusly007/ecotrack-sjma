const ApiResponse = require('../utils/api-response');

class StatsController {
  constructor(statsService, db) {
    this.service = statsService;
    this.db = db;

    this.getDashboard = this.getDashboard.bind(this);
    this.getKpis = this.getKpis.bind(this);
    this.getCollecteStats = this.getCollecteStats.bind(this);
    this.getAlgorithmComparison = this.getAlgorithmComparison.bind(this);
  }

  async getDashboard(req, res, next) {
    try {
      const data = await this.service.getDashboard();
      return res.status(200).json(ApiResponse.success(data, 'Dashboard des tournées'));
    } catch (err) {
      next(err);
    }
  }

  async getKpis(req, res, next) {
    try {
      const { date_debut, date_fin, id_zone } = req.query;
      const data = await this.service.getKpis({ date_debut, date_fin, id_zone });
      return res.status(200).json(ApiResponse.success(data, 'KPIs des tournées'));
    } catch (err) {
      next(err);
    }
  }

  async getCollecteStats(req, res, next) {
    try {
      const { date_debut, date_fin, id_zone } = req.query;
      const data = await this.service.getCollecteStats({ date_debut, date_fin, id_zone });
      return res.status(200).json(ApiResponse.success(data, 'Statistiques de collectes'));
    } catch (err) {
      next(err);
    }
  }

  async getAlgorithmComparison(req, res, next) {
    try {
      const data = await this.service.getAlgorithmComparison(this.db);
      return res.status(200).json(ApiResponse.success(data, 'Comparaison des algorithmes'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = StatsController;
