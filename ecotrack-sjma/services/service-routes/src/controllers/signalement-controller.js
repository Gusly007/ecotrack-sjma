const ApiResponse = require('../utils/api-response');
const gamificationClient = require('../services/gamificationClient');

class SignalementController {
  constructor(service) {
    this.service = service;
  }

  create = async (req, res) => {
    try {
      // id_citoyen vient du JWT (x-user-id injecté par la gateway).
      const id_citoyen = parseInt(req.headers['x-user-id'], 10) || req.body.id_citoyen;
      const payload = { ...req.body, id_citoyen };
      const signalement = await this.service.create(payload);

      // Side-effect gamification (never-throws). Une panne ici ne bloque
      // pas la création du signalement.
      const gamifResult = await gamificationClient.registerAction({
        idUtilisateur: id_citoyen,
        typeAction: 'signalement',
        actingUserId: id_citoyen,
        actingUserRole: req.headers['x-user-role'],
      });

      const enriched = gamifResult ? { ...signalement, gamification: gamifResult } : signalement;
      return res.status(201).json(ApiResponse.success(enriched, 'Signalement créé'));
    } catch (error) {
      const status = error.status || error.statusCode || 500;
      return res.status(status).json(ApiResponse.error(status, error.message));
    }
  };

  getAll = async (req, res) => {
    try {
      // BOLA scope : un CITOYEN ne peut voir que ses propres signalements,
      // peu importe la valeur de ?id_citoyen= dans l'URL.
      const callerId = parseInt(req.headers['x-user-id'], 10);
      const callerRole = req.headers['x-user-role'];
      const queryIdCitoyen = req.query.id_citoyen ? parseInt(req.query.id_citoyen, 10) : undefined;
      const scopedIdCitoyen = callerRole === 'CITOYEN'
        ? (Number.isInteger(callerId) ? callerId : undefined)
        : queryIdCitoyen;

      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        statut: req.query.statut,
        urgence: req.query.urgence,
        id_type: req.query.id_type ? parseInt(req.query.id_type) : undefined,
        id_citoyen: scopedIdCitoyen,
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
