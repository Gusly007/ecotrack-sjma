const { v4: uuidv4 } = require('uuid');

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
      id_vehicule,
      id_zone,
      id_agent
    } = data;

    const tourneeCode = code || await this._generateCode(date_tournee);

    const result = await this.db.query(
      `INSERT INTO tournee
        (code, date_tournee, statut, distance_prevue_km, duree_prevue_min, id_vehicule, id_zone, id_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [tourneeCode, date_tournee, statut, distance_prevue_km || null, duree_prevue_min, id_vehicule || null, id_zone, id_agent]
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
        z.code AS zone_code, z.nom AS zone_nom,
        u.nom AS agent_nom, u.prenom AS agent_prenom, u.email AS agent_email,
        v.numero_immatriculation, v.modele AS vehicule_modele, v.capacite_kg,
        COUNT(e.id_etape) AS total_etapes,
        COUNT(CASE WHEN e.collectee = TRUE THEN 1 END) AS etapes_collectees
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
        z.code AS zone_code, z.nom AS zone_nom,
        u.nom AS agent_nom, u.prenom AS agent_prenom,
        v.numero_immatriculation, v.modele AS vehicule_modele,
        COUNT(e.id_etape) AS total_etapes,
        COUNT(CASE WHEN e.collectee = TRUE THEN 1 END) AS etapes_collectees
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

  /**
   * Récupère les tournées actives (EN_COURS)
   */
  async findActive() {
    const result = await this.db.query(
      `SELECT
        t.*,
        z.code AS zone_code, z.nom AS zone_nom,
        u.nom AS agent_nom, u.prenom AS agent_prenom, u.email AS agent_email,
        v.numero_immatriculation, v.modele AS vehicule_modele,
        COUNT(e.id_etape) AS total_etapes,
        COUNT(CASE WHEN e.collectee = TRUE THEN 1 END) AS etapes_collectees
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
}

module.exports = TourneeRepository;
