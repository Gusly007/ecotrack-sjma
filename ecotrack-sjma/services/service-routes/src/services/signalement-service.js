const SignalementRepository = require('../repositories/signalement-repository');
const kafkaProducer = require('../../kafkaProducer');

class SignalementService {
  constructor(db) {
    this.repository = new SignalementRepository(db);
  }

  async create({ description, url_photo, id_type, id_conteneur, id_citoyen }) {
    if (!description || !id_type || !id_conteneur || !id_citoyen) {
      const ApiError = require('../utils/api-error');
      throw ApiError.badRequest('Champs requis manquants : description, id_type, id_conteneur, id_citoyen');
    }

    const signalement = await this.repository.create({
      description,
      url_photo,
      id_type,
      id_conteneur,
      id_citoyen
    });

    // Publier l'événement — le service-notification-gestionnaire-admin notifiera automatiquement
    // le gestionnaire et l'admin de la zone concernée
    await kafkaProducer.sendSignalement(signalement);

    return signalement;
  }

  async getAll(filters) {
    return this.repository.findAll(filters);
  }

  async getById(id) {
    const signalement = await this.repository.findById(id);
    if (!signalement) {
      const ApiError = require('../utils/api-error');
      throw ApiError.notFound('Signalement non trouvé');
    }
    return signalement;
  }

  async updateStatus(id, statut) {
    const validStatuses = ['NOUVEAU', 'EN_COURS', 'RESOLU', 'REJETE'];
    if (!validStatuses.includes(statut)) {
      const ApiError = require('../utils/api-error');
      throw ApiError.badRequest(`Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}`);
    }

    const signalement = await this.repository.findById(id);
    if (!signalement) {
      const ApiError = require('../utils/api-error');
      throw ApiError.notFound('Signalement non trouvé');
    }

    return this.repository.updateStatus(id, statut);
  }

  async update(id, data) {
    const signalement = await this.repository.findById(id);
    if (!signalement) {
      const ApiError = require('../utils/api-error');
      throw ApiError.notFound('Signalement non trouvé');
    }

    return this.repository.update(id, data);
  }

  async saveTreatment(id, data) {
    const signalement = await this.repository.findById(id);
    if (!signalement) {
      const ApiError = require('../utils/api-error');
      throw ApiError.notFound('Signalement non trouvé');
    }

    if (!data.id_agent) {
      const ApiError = require('../utils/api-error');
      throw ApiError.badRequest('Le champ "id_agent" est requis pour enregistrer un traitement');
    }

    if (!data.commentaire && !data.type_intervention && !data.notes_intervention && !data.date_intervention && !data.priorite_intervention) {
      const ApiError = require('../utils/api-error');
      throw ApiError.badRequest('Aucune donnée de traitement à enregistrer');
    }

    const type_action = data.type_action || (data.type_intervention ? 'INTERVENTION' : 'NOTE');
    return this.repository.insertTreatment(id, { ...data, type_action });
  }

  async getHistory(id) {
    const signalement = await this.repository.findById(id);
    if (!signalement) {
      const ApiError = require('../utils/api-error');
      throw ApiError.notFound('Signalement non trouvé');
    }

    return this.repository.getHistory(id);
  }

  async getStats() {
    return this.repository.getStats();
  }

  async getTypes() {
    return this.repository.getTypes();
  }
}

module.exports = SignalementService;
