const ApiResponse = require('../utils/api-response');

class StatsController {
  constructor(statsService, db) {
    this.service = statsService;
    this.db = db;

    this.getDashboard = this.getDashboard.bind(this);
    this.getKpis = this.getKpis.bind(this);
    this.getCollecteStats = this.getCollecteStats.bind(this);
    this.getAlgorithmComparison = this.getAlgorithmComparison.bind(this);
    this.getAverageProgression = this.getAverageProgression.bind(this);
    this.getNearlyDone = this.getNearlyDone.bind(this);
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

  async getAverageProgression(req, res, next) {
    try {
      const data = await this.service.getAverageProgression();
      return res.status(200).json(
        ApiResponse.success(
          { progression_moyenne_pct: data },
          'Progression moyenne des tournées EN_COURS'
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getNearlyDone(req, res, next) {
    try {
      const parsedSeuil = parseFloat(req.query.seuil);
      const seuil = Math.min(100, Math.max(0, Number.isNaN(parsedSeuil) ? 80 : parsedSeuil));
      const data = await this.service.getNearlyDone(seuil);
      return res.status(200).json(
        ApiResponse.success(
          { count: data.length, seuil, tournees: data },
          `Tournées EN_COURS avec progression > ${seuil}%`
        )
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = StatsController;
