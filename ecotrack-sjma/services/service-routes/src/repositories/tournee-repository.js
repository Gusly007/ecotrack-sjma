const { v4: uuidv4 } = require('uuid');

/**
 * Expression SQL réutilisable pour calculer le flag "en retard" d'une tournée.
 * Une tournée est en retard si elle est encore PLANIFIEE/EN_COURS et que l'heure
 * actuelle dépasse (date_tournee + heure_debut_prevue + duree_prevue_min minutes).
 *
 * NB : on alias la table en `t` partout pour rester cohérent. Si tu utilises un autre
 * alias, passe-le en paramètre via une template-string.
 */
const EST_EN_RETARD_SQL = `
  (t.statut IN ('PLANIFIEE','EN_COURS')
    AND ((t.date_tournee + t.heure_debut_prevue)
         + (COALESCE(t.duree_prevue_min, 0) || ' minutes')::interval) < NOW())
`;

class TourneeRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Génère un code unique pour une tournée
   * Format: T-YYYY-NNN
   */
  async _generateCode(dateTournee) {
    const year = new Date(dateTournee).getFullYear();
    const result = await this.db.query(
      `SELECT COUNT(*) as cnt FROM tournee WHERE EXTRACT(YEAR FROM date_tournee) = $1`,
      [year]
    );
    const count = parseInt(result.rows[0].cnt, 10) + 1;
    return `T-${year}-${String(count).padStart(3, '0')}`;
  }

  /**
   * Crée une nouvelle tournée
   */
  async create(data) {
    const {
      code,
      date_tournee,
      statut = 'PLANIFIEE',
      distance_prevue_km,
      duree_prevue_min,
      heure_debut_prevue = '07:30',
      id_vehicule,
      id_zone,
      id_agent
    } = data;

    const tourneeCode = code || await this._generateCode(date_tournee);

    const result = await this.db.query(
      `INSERT INTO tournee
        (code, date_tournee, statut, distance_prevue_km, duree_prevue_min, heure_debut_prevue, id_vehicule, id_zone, id_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [tourneeCode, date_tournee, statut, distance_prevue_km || null, duree_prevue_min, heure_debut_prevue, id_vehicule || null, id_zone, id_agent]
    );

    return result.rows[0];
  }

  /**
   * Récupère une tournée par ID avec détails zone, agent, véhicule
   */
  async findById(id) {
    const result = await this.db.query(
      `SELECT
        t.*,
        ${EST_EN_RETARD_SQL} AS est_en_retard,
        z.code AS zone_code, z.nom AS zone_nom,
        u.nom AS agent_nom, u.prenom AS agent_prenom, u.email AS agent_email,
        v.numero_immatriculation, v.modele AS vehicule_modele, v.capacite_kg,
        COUNT(e.id_etape) AS total_etapes,
        COUNT(CASE WHEN e.collectee = TRUE THEN 1 END) AS etapes_collectees,
        (
          t.statut IN ('PLANIFIEE', 'EN_COURS')
          AND t.heure_debut_prevue IS NOT NULL
          AND t.duree_prevue_min IS NOT NULL
          AND (t.date_tournee + t.heure_debut_prevue + t.duree_prevue_min * INTERVAL '1 minute') < NOW()
        ) AS est_en_retard
       FROM tournee t
       LEFT JOIN zone z ON z.id_zone = t.id_zone
       LEFT JOIN utilisateur u ON u.id_utilisateur = t.id_agent
       LEFT JOIN vehicule v ON v.id_vehicule = t.id_vehicule
       LEFT JOIN etape_tournee e ON e.id_tournee = t.id_tournee
       WHERE t.id_tournee = $1
       GROUP BY t.id_tournee, z.code, z.nom, u.nom, u.prenom, u.email,
                v.numero_immatriculation, v.modele, v.capacite_kg`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Récupère toutes les tournées avec filtres et pagination
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      statut,
      id_zone,
      id_agent,
      date_debut,
      date_fin
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    let idx = 1;

    if (statut) {
      conditions.push(`t.statut = $${idx++}`);
      params.push(statut);
    }
    if (id_zone) {
      conditions.push(`t.id_zone = $${idx++}`);
      params.push(id_zone);
    }
    if (id_agent) {
      conditions.push(`t.id_agent = $${idx++}`);
      params.push(id_agent);
    }
    if (date_debut) {
      conditions.push(`t.date_tournee >= $${idx++}`);
      params.push(date_debut);
    }
    if (date_fin) {
      conditions.push(`t.date_tournee <= $${idx++}`);
      params.push(date_fin);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.db.query(
      `SELECT COUNT(*) FROM tournee t ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const result = await this.db.query(
      `SELECT
        t.*,
        ${EST_EN_RETARD_SQL} AS est_en_retard,
        z.code AS zone_code, z.nom AS zone_nom,
        u.nom AS agent_nom, u.prenom AS agent_prenom,
        v.numero_immatriculation, v.modele AS vehicule_modele,
        COUNT(e.id_etape) AS total_etapes,
        COUNT(CASE WHEN e.collectee = TRUE THEN 1 END) AS etapes_collectees,
        (
          t.statut IN ('PLANIFIEE', 'EN_COURS')
          AND t.heure_debut_prevue IS NOT NULL
          AND t.duree_prevue_min IS NOT NULL
          AND (t.date_tournee + t.heure_debut_prevue + t.duree_prevue_min * INTERVAL '1 minute') < NOW()
        ) AS est_en_retard
       FROM tournee t
       LEFT JOIN zone z ON z.id_zone = t.id_zone
       LEFT JOIN utilisateur u ON u.id_utilisateur = t.id_agent
       LEFT JOIN vehicule v ON v.id_vehicule = t.id_vehicule
       LEFT JOIN etape_tournee e ON e.id_tournee = t.id_tournee
       ${whereClause}
       GROUP BY t.id_tournee, z.code, z.nom, u.nom, u.prenom,
                v.numero_immatriculation, v.modele
       ORDER BY t.date_tournee DESC, t.id_tournee DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      dataParams
    );

    return { rows: result.rows, total };
  }

  async findActiveWithEtapes() {
    const tourneesResult = await this.db.query(
      `SELECT
        t.id_tournee, t.code, t.statut, t.date_tournee,
        t.heure_debut_prevue, t.duree_prevue_min,
        u.prenom AS agent_prenom, u.nom AS agent_nom,
        z.nom AS zone_nom, z.code AS zone_code,
        COUNT(e.id_etape) AS total_etapes,
        COUNT(CASE WHEN e.collectee = TRUE THEN 1 END) AS etapes_collectees,
        (
          t.heure_debut_prevue IS NOT NULL
          AND t.duree_prevue_min IS NOT NULL
          AND (t.date_tournee + t.heure_debut_prevue + t.duree_prevue_min * INTERVAL '1 minute') < NOW()
        ) AS est_en_retard,
        last_pos.latitude  AS agent_latitude,
        last_pos.longitude AS agent_longitude,
        last_pos.sequence  AS agent_last_sequence
       FROM tournee t
       LEFT JOIN utilisateur u ON u.id_utilisateur = t.id_agent
       LEFT JOIN zone z ON z.id_zone = t.id_zone
       LEFT JOIN etape_tournee e ON e.id_tournee = t.id_tournee
       LEFT JOIN LATERAL (
         SELECT ST_Y(c.position) AS latitude, ST_X(c.position) AS longitude, ep.sequence
         FROM etape_tournee ep
         JOIN conteneur c ON c.id_conteneur = ep.id_conteneur
         WHERE ep.id_tournee = t.id_tournee
           AND ep.collectee = TRUE
           AND c.position IS NOT NULL
         ORDER BY ep.sequence DESC
         LIMIT 1
       ) last_pos ON TRUE
       WHERE t.statut = 'EN_COURS'
       GROUP BY t.id_tournee, u.prenom, u.nom, z.nom, z.code,
                last_pos.latitude, last_pos.longitude, last_pos.sequence
       ORDER BY t.date_tournee DESC`
    );

    if (tourneesResult.rows.length === 0) return [];

    const ids = tourneesResult.rows.map((t) => t.id_tournee);

    const etapesResult = await this.db.query(
      `SELECT
        e.id_etape, e.id_tournee, e.sequence, e.collectee,
        c.id_conteneur, c.uid,
        ST_Y(c.position) AS latitude, ST_X(c.position) AS longitude,
        tc.code AS type_code, tc.nom AS type_nom
       FROM etape_tournee e
       JOIN conteneur c ON c.id_conteneur = e.id_conteneur
       LEFT JOIN type_conteneur tc ON tc.id_type = c.id_type
       WHERE e.id_tournee = ANY($1)
         AND c.position IS NOT NULL
       ORDER BY e.id_tournee, e.sequence`,
      [ids]
    );

    const etapesByTournee = {};
    for (const etape of etapesResult.rows) {
      if (!etapesByTournee[etape.id_tournee]) etapesByTournee[etape.id_tournee] = [];
      etapesByTournee[etape.id_tournee].push(etape);
    }

    return tourneesResult.rows.map((t) => ({
      ...t,
      etapes: etapesByTournee[t.id_tournee] || [],
    }));
  }

  /**
   * Récupère les tournées actives (EN_COURS)
   */
  async findActive() {
    const result = await this.db.query(
      `SELECT
        t.*,
        ${EST_EN_RETARD_SQL} AS est_en_retard,
        z.code AS zone_code, z.nom AS zone_nom,
        u.nom AS agent_nom, u.prenom AS agent_prenom, u.email AS agent_email,
        v.numero_immatriculation, v.modele AS vehicule_modele,
        COUNT(e.id_etape) AS total_etapes,
        COUNT(CASE WHEN e.collectee = TRUE THEN 1 END) AS etapes_collectees,
        (
          t.heure_debut_prevue IS NOT NULL
          AND t.duree_prevue_min IS NOT NULL
          AND (t.date_tournee + t.heure_debut_prevue + t.duree_prevue_min * INTERVAL '1 minute') < NOW()
        ) AS est_en_retard
       FROM tournee t
       LEFT JOIN zone z ON z.id_zone = t.id_zone
       LEFT JOIN utilisateur u ON u.id_utilisateur = t.id_agent
       LEFT JOIN vehicule v ON v.id_vehicule = t.id_vehicule
       LEFT JOIN etape_tournee e ON e.id_tournee = t.id_tournee
       WHERE t.statut = 'EN_COURS'
       GROUP BY t.id_tournee, z.code, z.nom, u.nom, u.prenom, u.email,
                v.numero_immatriculation, v.modele
       ORDER BY t.date_tournee DESC`
    );
    return result.rows;
  }

  /**
   * Récupère la tournée d'un agent pour aujourd'hui
   */
  async findAgentTodayTournee(agentId) {
    const result = await this.db.query(
      `SELECT
        t.*,
        ${EST_EN_RETARD_SQL} AS est_en_retard,
        z.code AS zone_code, z.nom AS zone_nom,
        v.numero_immatriculation, v.modele AS vehicule_modele, v.capacite_kg,
        COUNT(e.id_etape) AS total_etapes,
        COUNT(CASE WHEN e.collectee = TRUE THEN 1 END) AS etapes_collectees
       FROM tournee t
       LEFT JOIN zone z ON z.id_zone = t.id_zone
       LEFT JOIN vehicule v ON v.id_vehicule = t.id_vehicule
       LEFT JOIN etape_tournee e ON e.id_tournee = t.id_tournee
       WHERE t.id_agent = $1
         AND t.date_tournee = CURRENT_DATE
         AND t.statut IN ('PLANIFIEE', 'EN_COURS')
       GROUP BY t.id_tournee, z.code, z.nom,
                v.numero_immatriculation, v.modele, v.capacite_kg
       ORDER BY t.statut DESC
       LIMIT 1`,
      [agentId]
    );
    return result.rows[0] || null;
  }

  /**
   * Met à jour une tournée
   */
  async update(id, data) {
    const {
      date_tournee,
      distance_prevue_km,
      duree_prevue_min,
      duree_reelle_min,
      distance_reelle_km,
      heure_debut_prevue,
      id_vehicule,
      id_zone,
      id_agent
    } = data;

    const updates = [];
    const values = [];
    let idx = 1;

    if (date_tournee !== undefined) { updates.push(`date_tournee = $${idx++}`); values.push(date_tournee); }
    if (distance_prevue_km !== undefined) { updates.push(`distance_prevue_km = $${idx++}`); values.push(distance_prevue_km); }
    if (duree_prevue_min !== undefined) { updates.push(`duree_prevue_min = $${idx++}`); values.push(duree_prevue_min); }
    if (duree_reelle_min !== undefined) { updates.push(`duree_reelle_min = $${idx++}`); values.push(duree_reelle_min); }
    if (distance_reelle_km !== undefined) { updates.push(`distance_reelle_km = $${idx++}`); values.push(distance_reelle_km); }
    if (heure_debut_prevue !== undefined) { updates.push(`heure_debut_prevue = $${idx++}`); values.push(heure_debut_prevue); }
    if (id_vehicule !== undefined) { updates.push(`id_vehicule = $${idx++}`); values.push(id_vehicule); }
    if (id_zone !== undefined) { updates.push(`id_zone = $${idx++}`); values.push(id_zone); }
    if (id_agent !== undefined) { updates.push(`id_agent = $${idx++}`); values.push(id_agent); }

    if (updates.length === 0) {
      const ApiError = require('../utils/api-error');
      throw ApiError.badRequest('Aucun champ à mettre à jour');
    }

    values.push(id);
    const result = await this.db.query(
      `UPDATE tournee SET ${updates.join(', ')} WHERE id_tournee = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Met à jour le statut d'une tournée avec historique
   */
  async updateStatut(id, statut) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const current = await client.query(
        'SELECT id_tournee, statut FROM tournee WHERE id_tournee = $1',
        [id]
      );

      if (current.rows.length === 0) {
        const ApiError = require('../utils/api-error');
        throw ApiError.notFound(`Tournée ${id} introuvable`);
      }

      const ancienStatut = current.rows[0].statut;

      if (ancienStatut === statut) {
        await client.query('COMMIT');
        return { ...current.rows[0], changed: false };
      }

      const result = await client.query(
        `UPDATE tournee SET statut = $1 WHERE id_tournee = $2 RETURNING *`,
        [statut, id]
      );

      await client.query(
        `INSERT INTO historique_statut (id_entite, type_entite, ancien_statut, nouveau_statut, date_changement)
         VALUES ($1, 'TOURNEE', $2, $3, NOW())`,
        [id, ancienStatut, statut]
      );

      await client.query('COMMIT');
      return { ...result.rows[0], ancien_statut: ancienStatut, changed: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Supprime une tournée
   */
  async delete(id) {
    const result = await this.db.query(
      'DELETE FROM tournee WHERE id_tournee = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Récupère les étapes d'une tournée avec détails conteneur
   */
  async findEtapes(tourneeId) {
    const result = await this.db.query(
      `SELECT
        e.id_etape, e.sequence, e.heure_estimee, e.collectee,
        e.id_conteneur,
        c.uid AS conteneur_uid, c.capacite_l, c.statut AS conteneur_statut,
        ST_X(c.position) AS longitude, ST_Y(c.position) AS latitude,
        z.nom AS zone_nom, tc.nom AS type_nom,
        COALESCE(m.niveau_remplissage_pct, NULL) AS fill_level
       FROM etape_tournee e
       JOIN conteneur c ON c.id_conteneur = e.id_conteneur
       LEFT JOIN zone z ON z.id_zone = c.id_zone
       LEFT JOIN type_conteneur tc ON tc.id_type = c.id_type
       LEFT JOIN LATERAL (
         SELECT m2.niveau_remplissage_pct
         FROM mesure m2
         JOIN capteur cap ON cap.id_capteur = m2.id_capteur
         WHERE cap.id_conteneur = c.id_conteneur
         ORDER BY m2.date_heure_mesure DESC
         LIMIT 1
       ) m ON TRUE
       WHERE e.id_tournee = $1
       ORDER BY e.sequence ASC`,
      [tourneeId]
    );
    return result.rows;
  }

  /**
   * Récupère le nom d'une zone par son ID
   */
  async getZoneName(id_zone) {
    const result = await this.db.query(
      `SELECT nom FROM zone WHERE id_zone = $1`,
      [id_zone]
    );
    return result.rows[0]?.nom || `Zone ${id_zone}`;
  }

  async findAllTypeConteneur() {
    const result = await this.db.query(
      `SELECT id_type, code, nom FROM type_conteneur ORDER BY nom`
    );
    return result.rows;
  }

  /**
   * Récupère les conteneurs actifs d'une zone avec leur niveau de remplissage
   * pour l'optimisation des tournées. Filtre optionnel par type (id_type).
   */
  async findActiveContainersByZone(id_zone, seuil_remplissage = 70, limit = 100, id_type = null) {
    const result = await this.db.query(
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
         AND COALESCE(m.niveau_remplissage_pct, 0) >= $2
         AND ($4::INT IS NULL OR c.id_type = $4)
       ORDER BY fill_level DESC NULLS LAST
       LIMIT $3`,
      [id_zone, seuil_remplissage, limit, id_type]
    );

    return result.rows;
  }

  /**
   * Ajoute des étapes à une tournée
   */
  async addEtapes(tourneeId, etapes) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const inserted = [];
      for (const etape of etapes) {
        const result = await client.query(
          `INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
           VALUES ($1, $2, FALSE, $3, $4)
           ON CONFLICT (id_tournee, sequence) DO UPDATE SET id_conteneur = EXCLUDED.id_conteneur
           RETURNING *`,
          [etape.sequence, etape.heure_estimee || null, tourneeId, etape.id_conteneur]
        );
        inserted.push(result.rows[0]);
      }
      await client.query('COMMIT');
      return inserted;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Vérifie si une tournée existe
   */
  async exists(id) {
    const result = await this.db.query(
      'SELECT 1 FROM tournee WHERE id_tournee = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Passe en EN_COURS toutes les tournées PLANIFIEE dont l'heure de début est dépassée.
   * Retourne les tournées mises à jour.
   */
  async autoStartDueTournees() {
    const result = await this.db.query(
      `UPDATE tournee
       SET statut = 'EN_COURS'
       WHERE statut = 'PLANIFIEE'
         AND heure_debut_prevue IS NOT NULL
         AND (date_tournee + heure_debut_prevue) <= NOW()
       RETURNING id_tournee, code`
    );
    return result.rows;
  }

  // Feed minimal pour l'app citoyen — 3 prochaines tournées planifiées
  // ou en cours, projection publique (pas d'info agent/véhicule).
  async findUpcomingPublic({ limit = 5 } = {}) {
    const safeLimit = Math.min(20, Math.max(1, parseInt(limit, 10) || 5));
    const result = await this.db.query(
      `SELECT
         t.id_tournee,
         t.date_tournee,
         t.duree_prevue_min,
         t.statut,
         z.id_zone,
         z.code AS zone_code,
         z.nom  AS zone_nom
       FROM tournee t
       LEFT JOIN zone z ON z.id_zone = t.id_zone
       WHERE t.date_tournee >= CURRENT_DATE
         AND t.statut IN ('PLANIFIEE', 'EN_COURS')
       ORDER BY t.date_tournee ASC, t.id_tournee ASC
       LIMIT $1`,
      [safeLimit]
    );
    return result.rows;
  }
}

module.exports = TourneeRepository;
