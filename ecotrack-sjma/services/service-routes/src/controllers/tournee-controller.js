const ApiResponse = require('../utils/api-response');
const ApiError = require('../utils/api-error');

class TourneeController {
  constructor(tourneeService, db) {
    this.service = tourneeService;
    this.db = db;

    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getActive = this.getActive.bind(this);
    this.getMyTournee = this.getMyTournee.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
    this.updateStatut = this.updateStatut.bind(this);
    this.delete = this.delete.bind(this);
    this.getEtapes = this.getEtapes.bind(this);
    this.getProgress = this.getProgress.bind(this);
    this.optimize = this.optimize.bind(this);
    this.previewOptimization = this.previewOptimization.bind(this);
    this.getTypeConteneur = this.getTypeConteneur.bind(this);
    this.getActiveMapData = this.getActiveMapData.bind(this);
    this.getUpcomingPublic = this.getUpcomingPublic.bind(this);
  }

  /**
   * GET /api/routes/prochaines-collectes — feed public pour l'app citoyen.
   * Projection minimale (pas d'info agent/véhicule). Retourne les 3
   * prochaines tournées PLANIFIEE ou EN_COURS.
   */
  async getUpcomingPublic(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 5;
      const rows = await this.service.getUpcomingPublic({ limit });
      return res.status(200).json(ApiResponse.success(rows, 'Prochaines collectes'));
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const tournee = await this.service.createTournee(req.body);
      return res.status(201).json(ApiResponse.success(tournee, 'Tournée créée avec succès', 201));
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const { page, limit, statut, id_zone, id_agent, date_debut, date_fin } = req.query;
      const result = await this.service.getAllTournees({
        page, limit, statut, id_zone, id_agent, date_debut, date_fin
      });
      return res.status(200).json(
        ApiResponse.paginated(result.tournees, result.page, result.limit, result.total)
      );
    } catch (err) {
      next(err);
    }
  }

  async getActive(req, res, next) {
    try {
      const tournees = await this.service.getActiveTournees();
      return res.status(200).json(ApiResponse.success(tournees, 'Tournées actives'));
    } catch (err) {
      next(err);
    }
  }

  async getMyTournee(req, res, next) {
    try {
      // L'agent est identifié par l'en-tête X-User-Id injecté par le gateway
      const agentId = parseInt(req.headers['x-user-id'], 10);
      if (!agentId) {
        return res.status(400).json(ApiResponse.error(400, 'Identifiant agent manquant'));
      }
      const tournee = await this.service.getAgentTodayTournee(agentId);
      return res.status(200).json(ApiResponse.success(tournee, 'Tournée du jour'));
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const tournee = await this.service.getTourneeById(id);
      return res.status(200).json(ApiResponse.success(tournee));
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await this.service.updateTournee(id, req.body);
      return res.status(200).json(ApiResponse.success(updated, 'Tournée mise à jour'));
    } catch (err) {
      next(err);
    }
  }

  async updateStatut(req, res, next) {
    try {
      const { id } = req.params;
      const { statut } = req.body;
      const role = String(req.user?.role || '').toUpperCase();

      if (role === 'GESTIONNAIRE' && statut !== 'ANNULEE') {
        throw ApiError.forbidden('Un gestionnaire ne peut qu\'annuler une tournée');
      }

      const result = await this.service.updateStatut(id, req.body);
      return res.status(200).json(ApiResponse.success(result, 'Statut mis à jour'));
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await this.service.deleteTournee(id);
      return res.status(200).json(ApiResponse.success(null, 'Tournée supprimée'));
    } catch (err) {
      next(err);
    }
  }

  async getEtapes(req, res, next) {
    try {
      const { id } = req.params;
      const etapes = await this.service.getTourneeEtapes(id);
      return res.status(200).json(ApiResponse.success(etapes));
    } catch (err) {
      next(err);
    }
  }

  async getEtapeById(req, res, next) {
    try {
      const { etapeId } = req.params;
      const etape = await this.service.getEtapeById(etapeId);
      return res.status(200).json(ApiResponse.success(etape));
    } catch (err) {
      next(err);
    }
  }

  async getProgress(req, res, next) {
    try {
      const { id } = req.params;
      const progress = await this.service.getTourneeProgress(id);
      return res.status(200).json(ApiResponse.success(progress));
    } catch (err) {
      next(err);
    }
  }

  async optimize(req, res, next) {
    try {
      const result = await this.service.optimizeTournee(req.body);
      return res.status(201).json(ApiResponse.success(result, 'Tournée optimisée créée', 201));
    } catch (err) {
      next(err);
    }
  }

  async getTypeConteneur(req, res, next) {
    try {
      const types = await this.service.getTypeConteneur();
      return res.status(200).json(ApiResponse.success(types));
    } catch (err) {
      next(err);
    }
  }

  async getActiveMapData(req, res, next) {
    try {
      const data = await this.service.getActiveMapData();
      return res.status(200).json(ApiResponse.success(data));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Prévisualise une tournée optimisée sans la persister.
   * Permet au gestionnaire de voir distance, durée, gain estimé et étapes
   * avant de valider la création.
   */
  async previewOptimization(req, res, next) {
    try {
      const result = await this.service.previewOptimization(req.body);
      return res.status(200).json(ApiResponse.success(result, 'Prévisualisation de la tournée optimisée'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TourneeController;
