const ApiResponse = require('../utils/api-response');

class SignalementController {
  constructor(service) {
    this.service = service;
  }

  getAll = async (req, res) => {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        statut: req.query.statut,
        urgence: req.query.urgence,
        id_type: req.query.id_type ? parseInt(req.query.id_type) : undefined,
        search: req.query.search
      };

      const result = await this.service.getAll(filters);
      return res.json(ApiResponse.success(result));
    } catch (error) {
      const status = error.status || error.statusCode || 500;
      return res.status(status).json(ApiResponse.error(status, error.message));
    }
  };

  getById = async (req, res) => {
    try {
      const signalement = await this.service.getById(parseInt(req.params.id));
      return res.json(ApiResponse.success(signalement));
    } catch (error) {
      const status = error.status || error.statusCode || 500;
      return res.status(status).json(ApiResponse.error(status, error.message));
    }
  };

  getHistory = async (req, res) => {
    try {
      const history = await this.service.getHistory(parseInt(req.params.id));
      return res.json(ApiResponse.success(history));
    } catch (error) {
      const status = error.status || error.statusCode || 500;
      return res.status(status).json(ApiResponse.error(status, error.message));
    }
  };

  updateStatus = async (req, res) => {
    try {
      const { statut } = req.body;
      if (!statut) {
        return res.status(400).json(ApiResponse.error(400, 'Le champ "statut" est requis'));
      }

      const signalement = await this.service.updateStatus(parseInt(req.params.id), statut);
      return res.json(ApiResponse.success(signalement, 'Statut mis à jour'));
    } catch (error) {
      const status = error.status || error.statusCode || 500;
      return res.status(status).json(ApiResponse.error(status, error.message));
    }
  };

  update = async (req, res) => {
    try {
      const signalement = await this.service.update(parseInt(req.params.id), req.body);
      return res.json(ApiResponse.success(signalement, 'Signalement mis à jour'));
    } catch (error) {
      const status = error.status || error.statusCode || 500;
      return res.status(status).json(ApiResponse.error(status, error.message));
    }
  };

  saveTreatment = async (req, res) => {
    try {
      const treatment = await this.service.saveTreatment(parseInt(req.params.id), req.body);
      return res.json(ApiResponse.success(treatment, 'Traitement enregistré'));
    } catch (error) {
      const status = error.status || error.statusCode || 500;
      return res.status(status).json(ApiResponse.error(status, error.message));
    }
  };

  getStats = async (req, res) => {
    try {
      const stats = await this.service.getStats();
      return res.json(ApiResponse.success(stats));
    } catch (error) {
      const status = error.status || error.statusCode || 500;
      return res.status(status).json(ApiResponse.error(status, error.message));
    }
  };

  getTypes = async (req, res) => {
    try {
      const types = await this.service.getTypes();
      return res.json(ApiResponse.success(types));
    } catch (error) {
      const status = error.status || error.statusCode || 500;
      return res.status(status).json(ApiResponse.error(status, error.message));
    }
  };
}

module.exports = SignalementController;
