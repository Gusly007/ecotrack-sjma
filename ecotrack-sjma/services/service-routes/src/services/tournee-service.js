const { validateSchema, createTourneeSchema, updateTourneeSchema, updateStatutSchema, optimizeSchema } = require('../validators/tournee.validator');
const { optimizeRoute, estimateDuration, FUEL_CONSUMPTION_PER_100KM } = require('./optimization-service');
const ApiError = require('../utils/api-error');
const cacheService = require('./cacheService');

const TOURNEE_TTL = 60; // 1 minute
const TOURNEES_LIST_TTL = 30; // 30 seconds

/**
 * Convertit une heure "HH:MM" (ou "HH:MM:SS") en nombre total de minutes depuis minuit.
 */
function parseHeureToMinutes(heure, defaultMinutes = 7 * 60 + 30) {
  if (typeof heure !== 'string') return defaultMinutes;
  const match = heure.match(/^([01]\d|2[0-3]):([0-5]\d)/);
  if (!match) return defaultMinutes;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

class TourneeService {
  constructor(tourneeRepository, collecteRepository) {
    this.tourneeRepo = tourneeRepository;
    this.collecteRepo = collecteRepository;
  }

  async createTournee(data) {
    const validated = validateSchema(createTourneeSchema, data);
    const result = await this.tourneeRepo.create(validated);

    await cacheService.invalidatePattern('tournee:*');

    return result;
  }

  async getTourneeById(id) {
    const cacheKey = `tournee:${id}`;
    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const tournee = await this.tourneeRepo.findById(id);
        if (!tournee) throw ApiError.notFound(`Tournée ${id} introuvable`);
        return tournee;
      },
      TOURNEE_TTL
    );
    return result.data;
  }

  async getAllTournees(options = {}) {
    const { page = 1, limit = 20, ...filters } = options;
    const cacheKey = `tournees:list:${page}:${limit}:${JSON.stringify(filters)}`;

    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const { rows, total } = await this.tourneeRepo.findAll({ page: parseInt(page), limit: parseInt(limit), ...filters });
        return { tournees: rows, total, page: parseInt(page), limit: parseInt(limit) };
      },
      TOURNEES_LIST_TTL
    );
    return result.data;
  }

  async getActiveTournees() {
    const cacheKey = 'tournee:active';
    const result = await cacheService.getOrSet(
      cacheKey,
      () => this.tourneeRepo.findActive(),
      TOURNEE_TTL
    );
    return result.data;
  }

  async getAgentTodayTournee(agentId) {
    const tournee = await this.tourneeRepo.findAgentTodayTournee(agentId);
    if (!tournee) throw ApiError.notFound("Aucune tournée assignée aujourd'hui");
    const etapes = await this.tourneeRepo.findEtapes(tournee.id_tournee);
    return { ...tournee, etapes };
  }

  async updateTournee(id, data) {
    const tournee = await this.tourneeRepo.findById(id);
    if (!tournee) throw ApiError.notFound(`Tournée ${id} introuvable`);
    const validated = validateSchema(updateTourneeSchema, data);
    const updated = await this.tourneeRepo.update(id, validated);
    if (!updated) throw ApiError.notFound(`Tournée ${id} introuvable`);

    await cacheService.del(`tournee:${id}`);
    await cacheService.invalidatePattern('tournee:*');

    return updated;
  }

  async updateStatut(id, data) {
    const validated = validateSchema(updateStatutSchema, data);
    const result = await this.tourneeRepo.updateStatut(id, validated.statut);

    await cacheService.del(`tournee:${id}`);
    await cacheService.invalidatePattern('tournee:*');
    await cacheService.invalidatePattern('tournees:*');

    return result;
  }

  async autoStartDueTournees() {
    const started = await this.tourneeRepo.autoStartDueTournees();
    if (started.length > 0) {
      await cacheService.invalidatePattern('tournee:*');
      await cacheService.invalidatePattern('tournees:*');
    }
    return started;
  }

  async deleteTournee(id) {
    const tournee = await this.tourneeRepo.findById(id);
    if (!tournee) throw ApiError.notFound(`Tournée ${id} introuvable`);
    if (tournee.statut === 'EN_COURS') {
      throw ApiError.badRequest('Impossible de supprimer une tournée en cours');
    }
    const result = await this.tourneeRepo.delete(id);

    await cacheService.del(`tournee:${id}`);
    await cacheService.invalidatePattern('tournee:*');

    return result;
  }

  async getTourneeEtapes(id) {
    if (!(await this.tourneeRepo.exists(id))) {
      throw ApiError.notFound(`Tournée ${id} introuvable`);
    }
    return this.tourneeRepo.findEtapes(id);
  }

  async getTourneeProgress(id) {
    if (!(await this.tourneeRepo.exists(id))) {
      throw ApiError.notFound(`Tournée ${id} introuvable`);
    }
    const [progress, etapes] = await Promise.all([
      this.collecteRepo.getTourneeProgress(id),
      this.tourneeRepo.findEtapes(id)
    ]);

    const total = parseInt(progress.total_etapes, 10);
    const done = parseInt(progress.etapes_collectees, 10);
    const pct = total > 0 ? parseFloat(((done / total) * 100).toFixed(1)) : 0;

    return {
      id_tournee: parseInt(id),
      total_etapes: total,
      etapes_collectees: done,
      etapes_restantes: total - done,
      progression_pct: pct,
      quantite_totale_kg: parseFloat(progress.quantite_totale_kg) || 0,
      etapes
    };
  }

  /**
   * Génère une tournée optimisée pour une zone donnée
   * Utilise l'algorithme 'nearest_neighbor' ou '2opt' (2-opt améliore NN)
   */
  async getTypeConteneur() {
    return this.tourneeRepo.findAllTypeConteneur();
  }

  async getActiveMapData() {
    return this.tourneeRepo.findActiveWithEtapes();
  }

  async optimizeTournee(data) {
    const validated = validateSchema(optimizeSchema, data);
    const {
      id_zone,
      date_tournee,
      seuil_remplissage = 70,
      id_agent,
      id_vehicule,
      heure_debut_prevue = '07:30',
      algorithme = '2opt',
      id_type = null
    } = validated;

    // Récupérer le nom de la zone via repository
    const nomZone = await this.tourneeRepo.getZoneName(id_zone);

    // Récupérer les conteneurs actifs via repository (max 100 pour performance)
    const conteneurs = await this.tourneeRepo.findActiveContainersByZone(id_zone, seuil_remplissage, 100, id_type);

    if (conteneurs.length === 0) {
      throw ApiError.badRequest(
        `Aucun conteneur actif avec un niveau ≥ ${seuil_remplissage}% dans la zone ${nomZone}`
      );
    }

    // Optimiser la route avec l'algorithme spécifié
    const result = optimizeRoute(conteneurs, algorithme);

    // Calculer durée estimée
    const dureePrevue = estimateDuration(result.distance_km, result.nb_conteneurs);

    // Créer la tournée
    const tournee = await this.tourneeRepo.create({
      date_tournee,
      statut: 'PLANIFIEE',
      distance_prevue_km: result.distance_km,
      duree_prevue_min: dureePrevue,
      heure_debut_prevue,
      id_vehicule: id_vehicule || null,
      id_zone,
      id_agent
    });

    // Créer les étapes dans l'ordre optimisé.
    // L'heure de la 1re étape = heure_debut_prevue (au lieu d'être codée en dur à 07:30).
    const minutesParEtape = result.nb_conteneurs > 0 ? Math.ceil(dureePrevue / result.nb_conteneurs) : 15;
    const baseMinutes = parseHeureToMinutes(heure_debut_prevue);
    const etapes = result.route.map((conteneur, idx) => {
      const totalMinutes = baseMinutes + idx * minutesParEtape;
      const hh = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
      const mm = String(totalMinutes % 60).padStart(2, '0');
      return {
        sequence: idx + 1,
        id_conteneur: conteneur.id_conteneur,
        heure_estimee: `${hh}:${mm}`
      };
    });

    await this.tourneeRepo.addEtapes(tournee.id_tournee, etapes);

    return {
      tournee,
      optimisation: {
        algorithme_utilise: result.algorithme_utilise,
        nb_conteneurs: result.nb_conteneurs,
        distance_prevue_km: result.distance_km,
        distance_originale_km: result.distance_originale_km,
        gain_pct: result.gain_pct,
        duree_prevue_min: dureePrevue,
        heure_debut_prevue
      },
      etapes: await this.tourneeRepo.findEtapes(tournee.id_tournee)
    };
  }

  /**
   * Prévisualise une tournée optimisée sans persister en base
   * Utilise l'algorithme 'nearest_neighbor' ou '2opt'
   */
  async previewOptimization(data) {
    const validated = validateSchema(optimizeSchema, data);
    const {
      id_zone,
      seuil_remplissage = 70,
      heure_debut_prevue = '07:30',
      algorithme = '2opt',
      id_type = null
    } = validated;

    require('../utils/logger').info(`[previewOptimization] Algorithme reçu: "${algorithme}"`);

    // Récupérer le nom de la zone via repository
    const nomZone = await this.tourneeRepo.getZoneName(id_zone);

    // Récupérer les conteneurs actifs via repository
    const conteneurs = await this.tourneeRepo.findActiveContainersByZone(id_zone, seuil_remplissage, 100, id_type);

    if (conteneurs.length === 0) {
      return {
        optimisation: null,
        etapes_preview: [],
        warning: `Aucun conteneur actif avec un niveau ≥ ${seuil_remplissage}% dans la zone ${nomZone}`
      };
    }

    const result = optimizeRoute(conteneurs, algorithme);
    const dureeOptimisee = estimateDuration(result.distance_km, result.nb_conteneurs);
    const dureeManuelle = estimateDuration(result.distance_originale_km, result.nb_conteneurs);

    const carburantOptimise = parseFloat(((result.distance_km * FUEL_CONSUMPTION_PER_100KM) / 100).toFixed(2));
    const carburantManuel = parseFloat(((result.distance_originale_km * FUEL_CONSUMPTION_PER_100KM) / 100).toFixed(2));

    return {
      optimisation: {
        algorithme_demande: algorithme,
        algorithme_utilise: result.algorithme_utilise,
        nb_conteneurs: result.nb_conteneurs,
        distance_prevue_km: result.distance_km,
        distance_originale_km: result.distance_originale_km,
        gain_pct: result.gain_pct,
        duree_prevue_min: dureeOptimisee,
        duree_originale_min: dureeManuelle,
        heure_debut_prevue,
        carburant_prevu_l: carburantOptimise,
        carburant_original_l: carburantManuel,
        carburant_economise_l: parseFloat((carburantManuel - carburantOptimise).toFixed(2))
      },
      etapes_preview: result.route.map((conteneur, idx) => ({
        sequence: idx + 1,
        id_conteneur: conteneur.id_conteneur,
        uid: conteneur.uid,
        fill_level: parseFloat(conteneur.fill_level) || 0,
        latitude: parseFloat(conteneur.latitude),
        longitude: parseFloat(conteneur.longitude)
      }))
    };
  }

  // Feed prochaines tournées pour l'app citoyen (3 prochaines par défaut).
  // Pas de cache : la home citoyen fait peu d'appels et le countdown doit
  // refléter l'état réel (passage à EN_COURS, etc.).
  async getUpcomingPublic({ limit = 5 } = {}) {
    return this.tourneeRepo.findUpcomingPublic({ limit });
  }
}

module.exports = TourneeService;
