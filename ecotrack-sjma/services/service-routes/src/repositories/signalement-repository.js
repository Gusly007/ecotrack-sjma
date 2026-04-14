class SignalementRepository {
  constructor(db) {
    this.db = db;
  }

  normalizeStatusToDb(status) {
    const s = String(status || '').toUpperCase();
    if (s === 'NOUVEAU') return 'OUVERT';
    if (s === 'REJETE') return 'FERME';
    return s;
  }

  async findAll(filters = {}) {
    const params = [];
    const whereClauses = [];

    if (filters.statut) {
      params.push(this.normalizeStatusToDb(filters.statut));
      whereClauses.push(`s.statut = $${params.length}`);
    }

    if (filters.id_type) {
      params.push(filters.id_type);
      whereClauses.push(`s.id_type = $${params.length}`);
    }

    if (filters.urgence) {
      params.push(filters.urgence);
      whereClauses.push(`ts.priorite = $${params.length}`);
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      whereClauses.push(`(
        CAST(s.id_signalement AS TEXT) ILIKE $${params.length}
        OR s.description ILIKE $${params.length}
        OR c.uid ILIKE $${params.length}
        OR z.nom ILIKE $${params.length}
        OR ts.libelle ILIKE $${params.length}
      )`);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT 
        s.id_signalement,
        s.description,
        CASE
          WHEN s.statut = 'OUVERT' THEN 'NOUVEAU'
          WHEN s.statut = 'FERME' THEN 'REJETE'
          ELSE s.statut
        END AS statut,
        s.date_creation,
        (
          SELECT hs.date_changement
          FROM historique_statut hs
          WHERE hs.type_entite = 'SIGNALEMENT'
            AND hs.id_entite = s.id_signalement
            AND hs.nouveau_statut = 'RESOLU'
          ORDER BY hs.date_changement DESC
          LIMIT 1
        ) AS date_resolution,
        ts.priorite AS urgence,
        ts.id_type AS id_type_signalement,
        ts.libelle AS type_signalement,
        ts.priorite,
        c.id_conteneur,
        c.uid AS conteneur_uid,
        c.capacite_l,
        ct.nom AS conteneur_type,
        ST_X(c.position) AS longitude,
        ST_Y(c.position) AS latitude,
        z.id_zone,
        z.nom AS zone_nom,
        CASE WHEN s.id_citoyen IS NOT NULL THEN
          (SELECT CONCAT(u.prenom, ' ', u.nom) FROM utilisateur u WHERE u.id_utilisateur = s.id_citoyen)
        ELSE NULL END AS citoyen_nom
      FROM signalement s
      JOIN type_signalement ts ON ts.id_type = s.id_type
      JOIN conteneur c ON c.id_conteneur = s.id_conteneur
      JOIN type_conteneur ct ON ct.id_type = c.id_type
      LEFT JOIN zone z ON z.id_zone = c.id_zone
      ${whereSql}
      ORDER BY s.date_creation DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM signalement s
      JOIN conteneur c ON c.id_conteneur = s.id_conteneur
      JOIN type_signalement ts ON ts.id_type = s.id_type
      LEFT JOIN zone z ON z.id_zone = c.id_zone
      ${whereSql}
    `;

    const [dataResult, countResult] = await Promise.all([
      this.db.query(dataQuery, [...params, limit, offset]),
      this.db.query(countQuery, params)
    ]);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0]?.total || 0),
        totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / limit)
      }
    };
  }

  async findById(id) {
    const result = await this.db.query(
      `SELECT 
        s.id_signalement,
        s.description,
        s.url_photo,
        CASE
          WHEN s.statut = 'OUVERT' THEN 'NOUVEAU'
          WHEN s.statut = 'FERME' THEN 'REJETE'
          ELSE s.statut
        END AS statut,
        s.date_creation,
        (
          SELECT t.date_traitement
          FROM traitement_signalement t
          WHERE t.id_signalement = s.id_signalement
          ORDER BY t.date_traitement DESC
          LIMIT 1
        ) AS date_resolution,
        s.id_type,
        s.id_conteneur,
        s.id_citoyen,
        ts.priorite AS urgence,
        ts.libelle AS type_signalement,
        ts.priorite,
        t.commentaire AS traitement_commentaire,
        t.type_intervention AS traitement_type_intervention,
        t.date_intervention AS traitement_date_intervention,
        t.priorite_intervention AS traitement_priorite_intervention,
        t.notes_intervention AS traitement_notes_intervention,
        t.date_traitement AS traitement_date,
        t.type_action AS traitement_type_action,
        CONCAT(ua.prenom, ' ', ua.nom) AS traitement_agent_nom,
        c.uid AS conteneur_uid,
        c.capacite_l,
        ct.nom AS conteneur_type,
        ST_X(c.position) AS longitude,
        ST_Y(c.position) AS latitude,
        z.id_zone,
        z.nom AS zone_nom,
        CASE WHEN s.id_citoyen IS NOT NULL THEN
          (SELECT CONCAT(u.prenom, ' ', u.nom) FROM utilisateur u WHERE u.id_utilisateur = s.id_citoyen)
        ELSE NULL END AS citoyen_nom
       FROM signalement s
       JOIN type_signalement ts ON ts.id_type = s.id_type
       JOIN conteneur c ON c.id_conteneur = s.id_conteneur
       JOIN type_conteneur ct ON ct.id_type = c.id_type
       LEFT JOIN zone z ON z.id_zone = c.id_zone
       LEFT JOIN LATERAL (
         SELECT *
         FROM traitement_signalement tsu
         WHERE tsu.id_signalement = s.id_signalement
         ORDER BY tsu.date_traitement DESC, tsu.id_traitement DESC
         LIMIT 1
       ) t ON TRUE
       LEFT JOIN utilisateur ua ON ua.id_utilisateur = t.id_agent
       WHERE s.id_signalement = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async insertTreatment(id, data) {
    const result = await this.db.query(
      `INSERT INTO traitement_signalement (
        id_signalement,
        id_agent,
        type_action,
        commentaire,
        type_intervention,
        date_intervention,
        priorite_intervention,
        notes_intervention
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id,
        data.id_agent || null,
        data.type_action || 'NOTE',
        data.commentaire || null,
        data.type_intervention || null,
        data.date_intervention || null,
        data.priorite_intervention || null,
        data.notes_intervention || null
      ]
    );

    return result.rows[0];
  }

  async insertStatusHistory(id, ancienStatut, nouveauStatut) {
    const result = await this.db.query(
      `INSERT INTO historique_statut (id_entite, type_entite, ancien_statut, nouveau_statut)
       VALUES ($1, 'SIGNALEMENT', $2, $3)
       RETURNING *`,
      [id, ancienStatut, nouveauStatut]
    );
    return result.rows[0];
  }

  async getHistory(id) {
    const result = await this.db.query(
      `SELECT * FROM (
        SELECT
          hs.date_changement AS date,
          CASE
            WHEN hs.ancien_statut IS NOT NULL THEN
              'Statut changé: ' || hs.ancien_statut || ' → ' || hs.nouveau_statut
            ELSE 'Statut: ' || hs.nouveau_statut
          END AS action,
          'update' AS type,
          hs.date_changement AS sort_date
        FROM historique_statut hs
        WHERE hs.type_entite = 'SIGNALEMENT' AND hs.id_entite = $1

        UNION ALL

        SELECT
          t.date_traitement AS date,
          CASE
            WHEN t.type_action = 'INTERVENTION' THEN
              'Intervention planifiée: ' || COALESCE(t.type_intervention, 'Intervention')
              || CASE WHEN t.priorite_intervention IS NOT NULL THEN ' - Priorité: ' || t.priorite_intervention ELSE '' END
              || CASE WHEN t.notes_intervention IS NOT NULL THEN ' - Notes: ' || t.notes_intervention ELSE '' END
            ELSE
              'Note interne: ' || COALESCE(t.commentaire, '')
          END AS action,
          CASE WHEN t.type_action = 'INTERVENTION' THEN 'intervention' ELSE 'comment' END AS type,
          t.date_traitement AS sort_date
        FROM traitement_signalement t
        WHERE t.id_signalement = $1
      ) history
      ORDER BY sort_date DESC, date DESC`,
      [id]
    );
    return result.rows;
  }

  async updateStatus(id, statut) {
    const dbStatus = this.normalizeStatusToDb(statut);
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const current = await client.query(
        'SELECT id_signalement, statut FROM signalement WHERE id_signalement = $1',
        [id]
      );

      if (current.rows.length === 0) {
        const error = new Error(`Signalement avec l'ID ${id} introuvable`);
        error.statusCode = 404;
        throw error;
      }

      const ancienStatut = current.rows[0].statut;

      if (ancienStatut === dbStatus) {
        await client.query('COMMIT');
        return { ...current.rows[0], ancien_statut: ancienStatut, changed: false };
      }

      const result = await client.query(
        `UPDATE signalement 
         SET statut = $1
         WHERE id_signalement = $2
         RETURNING *`,
        [dbStatus, id]
      );

      await client.query(
        `INSERT INTO historique_statut (id_entite, type_entite, ancien_statut, nouveau_statut)
         VALUES ($1, 'SIGNALEMENT', $2, $3)`,
        [id, ancienStatut, dbStatus]
      );

      await client.query('COMMIT');
      return { ...result.rows[0], ancien_statut: ancienStatut, changed: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }

    if (data.statut !== undefined) {
      const dbStatus = this.normalizeStatusToDb(data.statut);
      fields.push(`statut = $${paramIndex}`);
      params.push(dbStatus);
      paramIndex++;
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    const result = await this.db.query(
      `UPDATE signalement SET ${fields.join(', ')} WHERE id_signalement = $${paramIndex} RETURNING *`,
      params
    );
    return result.rows[0];
  }

  async getStats() {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE statut = 'OUVERT') as nouveau,
        COUNT(*) FILTER (WHERE statut = 'EN_COURS') as en_cours,
        COUNT(*) FILTER (WHERE statut = 'RESOLU') as resolu,
        COUNT(*) FILTER (WHERE statut = 'FERME') as rejete,
        COUNT(*) as total
      FROM signalement
    `);
    return result.rows[0];
  }

  async getTypes() {
    const result = await this.db.query(
      `SELECT id_type, libelle, priorite FROM type_signalement ORDER BY priorite DESC`
    );
    return result.rows;
  }
}

module.exports = SignalementRepository;
