const { validateSchema, collecteSchema } = require('../validators/collecte.validator');
const { validateSchema: validateTournee, anomalieSchema } = require('../validators/tournee.validator');
const ApiError = require('../utils/api-error');
const { notifyAllStaff } = require('../utils/notifyStaff');

class CollecteService {
  constructor(collecteRepository, tourneeRepository) {
    this.collecteRepo = collecteRepository;
    this.tourneeRepo = tourneeRepository;
  }

  /**
   * Enregistre une collecte pour un conteneur dans une tournée.
   *
   * Règle métier (depuis 3.9.0) :
   * - Si la tournée est PLANIFIEE, on la bascule automatiquement en EN_COURS
   *   à la première collecte (l'agent n'a pas besoin de cliquer "Démarrer").
   * - Si la tournée est TERMINEE ou ANNULEE, on rejette : on ne ressuscite pas
   *   une tournée close.
   * - Si elle est déjà EN_COURS, on continue normalement.
   */
  async recordCollecte(tourneeId, data, agentId) {
    const validated = validateSchema(collecteSchema, data);

    const tournee = await this.tourneeRepo.findById(tourneeId);
    if (!tournee) throw ApiError.notFound(`Tournée ${tourneeId} introuvable`);

    // Vérifier que l'agent est bien assigné à cette tournée
    if (agentId && tournee.id_agent !== agentId) {
      throw ApiError.badRequest('Vous n\'êtes pas assigné à cette tournée');
    }

    // Auto-transition PLANIFIEE -> EN_COURS à la 1re collecte
    if (tournee.statut === 'PLANIFIEE') {
      await this.tourneeRepo.updateStatut(tourneeId, 'EN_COURS');
    } else if (tournee.statut !== 'EN_COURS') {
      // TERMINEE ou ANNULEE -> on refuse
      throw ApiError.badRequest(
        `Impossible d'enregistrer une collecte sur une tournée ${tournee.statut}`
      );
    }

    const collecte = await this.collecteRepo.recordCollecte(
      tourneeId,
      validated.id_conteneur,
      validated.quantite_kg
    );

    // Vérifier si toutes les étapes sont collectées
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

    const anomalie = await this.collecteRepo.reportAnomalie(
      tourneeId,
      validated.id_conteneur,
      agentId,
      validated.type_anomalie,
      validated.description
    );

    // Notifier gestionnaires + admins
    let conteneurUid = `#${validated.id_conteneur}`;
    try {
      const uidRow = await this.collecteRepo.db.query(
        'SELECT uid FROM conteneur WHERE id_conteneur = $1', [validated.id_conteneur]
      );
      if (uidRow.rows[0]?.uid) conteneurUid = uidRow.rows[0].uid;
    } catch { /* ignore */ }
    const GRAVITE_PRIORITE = { Critique: 1, Haute: 2, Moyenne: 3, Basse: 4 };
    const gravite  = validated.gravite || 'Moyenne';
    const priorite = GRAVITE_PRIORITE[gravite] ?? 3;
    const typeLabel = validated.type_anomalie.replace(/_/g, ' ');
    await notifyAllStaff(this.collecteRepo.db, {
      type:      'ALERTE',
      titre:     `[${gravite.toUpperCase()}] Anomalie — ${conteneurUid}`,
      corps:     `Type : ${typeLabel}\nGravité : ${gravite}\nTournée : ${tourneeId}\n${validated.description || ''}`.trim(),
      priorite,
      categorie: 'ALERTE',
    });

    return anomalie;
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
