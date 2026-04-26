const { validateSchema, vehiculeSchema, updateVehiculeSchema } = require('../validators/collecte.validator');
const ApiError = require('../utils/api-error');

class VehiculeService {
  constructor(vehiculeRepository) {
    this.vehiculeRepo = vehiculeRepository;
  }

  async createVehicule(data) {
    const validated = validateSchema(vehiculeSchema, data);
    return this.vehiculeRepo.create(validated);
  }

  async getVehiculeById(id) {
    const vehicule = await this.vehiculeRepo.findById(id);
    if (!vehicule) throw ApiError.notFound(`Véhicule ${id} introuvable`);
    return vehicule;
  }

  async getAllVehicules(options = {}) {
    const { page = 1, limit = 50 } = options;
    const { rows, total } = await this.vehiculeRepo.findAll({ page: parseInt(page), limit: parseInt(limit) });
    return { vehicules: rows, total, page: parseInt(page), limit: parseInt(limit) };
  }

  async updateVehicule(id, data) {
    if (!(await this.vehiculeRepo.exists(id))) {
      throw ApiError.notFound(`Véhicule ${id} introuvable`);
    }
    const validated = validateSchema(updateVehiculeSchema, data);
    const updated = await this.vehiculeRepo.update(id, validated);
    if (!updated) throw ApiError.notFound(`Véhicule ${id} introuvable`);
    return updated;
  }

  async deleteVehicule(id) {
    if (!(await this.vehiculeRepo.exists(id))) {
      throw ApiError.notFound(`Véhicule ${id} introuvable`);
    }
    return this.vehiculeRepo.delete(id);
  }
}

module.exports = VehiculeService;
