const SignalementRepository = require('../repositories/signalement-repository');
const kafkaProducer = require('../../kafkaProducer');

class SignalementService {
  constructor(db) {
    this.repository = new SignalementRepository(db);
  }

  async create(data) {
    const ApiError = require('../utils/api-error');
    if (!data.description || !String(data.description).trim()) {
      throw ApiError.badRequest('Le champ "description" est requis');
    }
    if (!data.id_type) {
      throw ApiError.badRequest('Le champ "id_type" est requis');
    }
    if (!data.id_citoyen) {
      throw ApiError.badRequest('Le champ "id_citoyen" est requis');
    }

    // Le mobile citoyen peut envoyer conteneur_uid (scan QR / saisie
    // manuelle) à la place de id_conteneur. On résout l'UID en id.
    let id_conteneur = data.id_conteneur;
    if (!id_conteneur && data.conteneur_uid) {
      const row = await this.repository.findConteneurByUidOrId(data.conteneur_uid);
      if (!row) {
        throw ApiError.badRequest(`Conteneur introuvable pour "${data.conteneur_uid}"`);
      }
      id_conteneur = row.id_conteneur;
    }
    if (!id_conteneur) {
      throw ApiError.badRequest('Le champ "id_conteneur" ou "conteneur_uid" est requis');
    }

    const signalement = await this.repository.create({
      description: data.description,
      id_type: data.id_type,
      id_conteneur,
      id_citoyen: data.id_citoyen,
      url_photo: data.url_photo || null,
      urgence: data.urgence || null,
    });

    // Publier l'événement — service-notification-gestionnaire-admin
    // notifie gestionnaire/admin de la zone concernée.
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
