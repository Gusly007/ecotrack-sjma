const ApiResponse = require('../utils/api-response');

class VehiculeController {
  constructor(vehiculeService) {
    this.service = vehiculeService;

    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async create(req, res, next) {
    try {
      const vehicule = await this.service.createVehicule(req.body);
      return res.status(201).json(ApiResponse.success(vehicule, 'Véhicule créé avec succès', 201));
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await this.service.getAllVehicules({ page, limit });
      return res.status(200).json(
        ApiResponse.paginated(result.vehicules, result.page, result.limit, result.total)
      );
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const vehicule = await this.service.getVehiculeById(id);
      return res.status(200).json(ApiResponse.success(vehicule));
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await this.service.updateVehicule(id, req.body);
      return res.status(200).json(ApiResponse.success(updated, 'Véhicule mis à jour'));
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await this.service.deleteVehicule(id);
      return res.status(200).json(ApiResponse.success(null, 'Véhicule supprimé'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = VehiculeController;
