const { validateSchema, createTourneeSchema, updateTourneeSchema, updateStatutSchema, optimizeSchema } = require('../validators/tournee.validator');
const { optimizeRoute, estimateDuration } = require('./optimization-service');
const ApiError = require('../utils/api-error');
const cacheService = require('./cacheService');

const TOURNEE_TTL = 60; // 1 minute
const TOURNEES_LIST_TTL = 30; // 30 seconds

class TourneeService {
  constructor(tourneeRepository, collecteRepository) {
    this.tourneeRepo = tourneeRepository;
    this.collecteRepo = collecteRepository;
  }

  async createTournee(data) {
    const validated = validateSchema(createTourneeSchema, data);
    const result = await this.tourneeRepo.create(validated);
    
    // Invalidate cache
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
    // Don't cache agent-specific data as it's time-sensitive
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
    
    // Invalidate cache
    await cacheService.del(`tournee:${id}`);
    await cacheService.invalidatePattern('tournee:*');
    
    return updated;
  }

  async updateStatut(id, data) {
    const validated = validateSchema(updateStatutSchema, data);
    const result = await this.tourneeRepo.updateStatut(id, validated.statut);
    
    // Invalidate cache
    await cacheService.del(`tournee:${id}`);
    await cacheService.invalidatePattern('tournee:*');
    
    return result;
  }

  async deleteTournee(id) {
    const tournee = await this.tourneeRepo.findById(id);
    if (!tournee) throw ApiError.notFound(`Tournée ${id} introuvable`);
    if (tournee.statut === 'EN_COURS') {
      throw ApiError.badRequest('Impossible de supprimer une tournée en cours');
    }
    const result = await this.tourneeRepo.delete(id);
    
    // Invalidate cache
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
   */
  async optimizeTournee(data, db) {
    const validated = validateSchema(optimizeSchema, data);
    const {
      id_zone,
      date_tournee,
      seuil_remplissage = 70,
      id_agent,
      id_vehicule,
      algorithme = '2opt'
    } = validated;

    // Récupérer les conteneurs actifs de la zone avec position valide
    const contenteursResult = await db.query(
      `SELECT
        c.id_conteneur, c.uid, c.capacite_l,
        ST_Y(c.position) AS latitude, ST_X(c.position) AS longitude,
        COALESCE(m.niveau_remplissage_pct, 0) AS fill_level
       FROM conteneur c
       LEFT JOIN capteur cap ON cap.id_conteneur = c.id_conteneur
       LEFT JOIN LATERAL (
         SELECT niveau_remplissage_pct
         FROM mesure
         WHERE id_capteur = cap.id_capteur
         ORDER BY date_heure_mesure DESC
         LIMIT 1
       ) m ON TRUE
       WHERE c.id_zone = $1
         AND c.statut = 'ACTIF'
         AND c.position IS NOT NULL
       ORDER BY fill_level DESC NULLS LAST`,
      [id_zone]
    );

    let conteneurs = contenteursResult.rows;

    // Filtrer par seuil de remplissage (inclure ceux sans mesure si seuil = 0)
    conteneurs = conteneurs.filter(c => {
      const fl = parseFloat(c.fill_level) || 0;
      return fl >= seuil_remplissage || (seuil_remplissage === 0);
    });

    if (conteneurs.length === 0) {
      throw ApiError.badRequest(
        `Aucun conteneur actif avec un niveau ≥ ${seuil_remplissage}% dans la zone ${id_zone}`
      );
    }

    // Optimiser la route
    const result = optimizeRoute(conteneurs, algorithme);

    // Calculer durée estimée
    const dureePrevue = estimateDuration(result.distance_km, result.nb_conteneurs);

    // Créer la tournée
    const tournee = await this.tourneeRepo.create({
      date_tournee,
      statut: 'PLANIFIEE',
      distance_prevue_km: result.distance_km,
      duree_prevue_min: dureePrevue,
      id_vehicule: id_vehicule || null,
      id_zone,
      id_agent
    });

    // Créer les étapes dans l'ordre optimisé
    const minutesParEtape = result.nb_conteneurs > 0 ? Math.ceil(dureePrevue / result.nb_conteneurs) : 15;
    const baseMinutes = 7 * 60 + 30; // 07:30
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
        duree_prevue_min: dureePrevue
      },
      etapes: await this.tourneeRepo.findEtapes(tournee.id_tournee)
    };
  }
}

module.exports = TourneeService;
