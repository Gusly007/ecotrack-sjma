const ApiResponse = require('../utils/api-response');

class CollecteController {
  constructor(collecteService) {
    this.service = collecteService;

    this.recordCollecte = this.recordCollecte.bind(this);
    this.reportAnomalie = this.reportAnomalie.bind(this);
    this.getCollectesByTournee = this.getCollectesByTournee.bind(this);
    this.getAnomaliesByTournee = this.getAnomaliesByTournee.bind(this);
  }

  async recordCollecte(req, res, next) {
    try {
      const { id } = req.params;
      const agentId = parseInt(req.headers['x-user-id'], 10) || null;
      const result = await this.service.recordCollecte(id, req.body, agentId);
      return res.status(201).json(ApiResponse.success(result, 'Collecte enregistrée', 201));
    } catch (err) {
      next(err);
    }
  }

  async reportAnomalie(req, res, next) {
    try {
      const { id } = req.params;
      const agentId = parseInt(req.headers['x-user-id'], 10);
      if (!agentId) {
        return res.status(400).json(ApiResponse.error(400, 'Identifiant agent manquant'));
      }
      const signalement = await this.service.reportAnomalie(id, req.body, agentId);
      return res.status(201).json(ApiResponse.success(signalement, 'Anomalie signalée', 201));
    } catch (err) {
      next(err);
    }
  }

  async getCollectesByTournee(req, res, next) {
    try {
      const { id } = req.params;
      const collectes = await this.service.getCollectesByTournee(id);
      return res.status(200).json(ApiResponse.success(collectes));
    } catch (err) {
      next(err);
    }
  }

  async getAnomaliesByTournee(req, res, next) {
    try {
      const { id } = req.params;
      const anomalies = await this.service.getAnomaliesByTournee(id);
      return res.status(200).json(ApiResponse.success(anomalies));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CollecteController;
