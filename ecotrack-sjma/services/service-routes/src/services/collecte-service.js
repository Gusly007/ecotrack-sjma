const { validateSchema, collecteSchema } = require('../validators/collecte.validator');
const { validateSchema: validateTournee, anomalieSchema } = require('../validators/tournee.validator');
const ApiError = require('../utils/api-error');

class CollecteService {
  constructor(collecteRepository, tourneeRepository) {
    this.collecteRepo = collecteRepository;
    this.tourneeRepo = tourneeRepository;
  }

  /**
   * Enregistre une collecte pour un conteneur dans une tournée
   */
  async recordCollecte(tourneeId, data, agentId) {
    const validated = validateSchema(collecteSchema, data);

    // Vérifier que la tournée existe et est EN_COURS
    const tournee = await this.tourneeRepo.findById(tourneeId);
    if (!tournee) throw ApiError.notFound(`Tournée ${tourneeId} introuvable`);
    if (tournee.statut !== 'EN_COURS') {
      throw ApiError.badRequest(`La tournée doit être EN_COURS (statut actuel: ${tournee.statut})`);
    }

    // Vérifier que l'agent est bien assigné à cette tournée
    if (agentId && tournee.id_agent !== agentId) {
      throw ApiError.badRequest('Vous n\'êtes pas assigné à cette tournée');
    }

    const collecte = await this.collecteRepo.recordCollecte(
      tourneeId,
      validated.id_conteneur,
      validated.quantite_kg
    );

    // Vérifier si toutes les étapes sont collectées → terminer la tournée
    const progress = await this.collecteRepo.getTourneeProgress(tourneeId);
    const allDone =
      parseInt(progress.total_etapes) > 0 &&
      parseInt(progress.etapes_collectees) >= parseInt(progress.total_etapes);

    if (allDone) {
      await this.tourneeRepo.updateStatut(tourneeId, 'TERMINEE');
    }

    return {
      collecte,
      tournee_terminee: allDone,
      progression: {
        total: parseInt(progress.total_etapes),
        collectees: parseInt(progress.etapes_collectees)
      }
    };
  }

  /**
   * Signale une anomalie sur un conteneur pendant la tournée
   */
  async reportAnomalie(tourneeId, data, agentId) {
    const validated = validateTournee(anomalieSchema, data);

    const tournee = await this.tourneeRepo.findById(tourneeId);
    if (!tournee) throw ApiError.notFound(`Tournée ${tourneeId} introuvable`);
    if (!['EN_COURS', 'PLANIFIEE'].includes(tournee.statut)) {
      throw ApiError.badRequest('Anomalie signalable uniquement pour une tournée EN_COURS ou PLANIFIEE');
    }

    return this.collecteRepo.reportAnomalie(
      tourneeId,
      validated.id_conteneur,
      agentId,
      validated.type_anomalie,
      validated.description
    );
  }

  async getCollectesByTournee(tourneeId) {
    if (!(await this.tourneeRepo.exists(tourneeId))) {
      throw ApiError.notFound(`Tournée ${tourneeId} introuvable`);
    }
    return this.collecteRepo.findByTournee(tourneeId);
  }

  async getAnomaliesByTournee(tourneeId) {
    if (!(await this.tourneeRepo.exists(tourneeId))) {
      throw ApiError.notFound(`Tournée ${tourneeId} introuvable`);
    }
    return this.collecteRepo.findAnomaliesByTournee(tourneeId);
  }
}

module.exports = CollecteService;
