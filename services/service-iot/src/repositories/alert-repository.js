/**
 * Repository pour les alertes capteur (table alerte_capteur)
 */
class AlertRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Crée une nouvelle alerte
   */
  async create(data) {
    const sql = `
      INSERT INTO alerte_capteur (type_alerte, valeur_detectee, seuil, description, id_conteneur)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.pool.query(sql, [
      data.type_alerte,
      data.valeur_detectee,
      data.seuil,
      data.description,
      data.id_conteneur
    ]);
    return result.rows[0];
  }

  /**
   * Récupère les alertes avec filtres et pagination
   */
  async findAll(filters = {}) {
    const { page = 1, limit = 50, statut, type_alerte, id_conteneur } = filters;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (statut) {
      conditions.push(`a.statut = $${paramIndex++}`);
      params.push(statut);
    }
    if (type_alerte) {
      conditions.push(`a.type_alerte = $${paramIndex++}`);
      params.push(type_alerte);
    }
    if (id_conteneur) {
      conditions.push(`a.id_conteneur = $${paramIndex++}`);
      params.push(id_conteneur);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM alerte_capteur a ${whereClause}`;
    const countResult = await this.pool.query(countSql, params);
    const total = parseInt(countResult.rows[0].total, 10);

    const sql = `
      SELECT a.*, cnt.uid as uid_conteneur, cnt.id_zone, z.nom as nom_zone
      FROM alerte_capteur a
      JOIN conteneur cnt ON a.id_conteneur = cnt.id_conteneur
      LEFT JOIN zone z ON cnt.id_zone = z.id_zone
      ${whereClause}
      ORDER BY a.date_creation DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await this.pool.query(sql, params);
    return { rows: result.rows, total };
  }

  /**
   * Met à jour le statut d'une alerte
   */
  async updateStatus(idAlerte, statut) {
    const sql = `
      UPDATE alerte_capteur
      SET statut = $1, date_traitement = NOW()
      WHERE id_alerte = $2
      RETURNING *
    `;
    const result = await this.pool.query(sql, [statut, idAlerte]);
    return result.rows[0] || null;
  }

  /**
   * Vérifie si une alerte active existe déjà pour ce conteneur et ce type
   */
  async findActiveByContainerAndType(idConteneur, typeAlerte) {
    const sql = `
      SELECT * FROM alerte_capteur
      WHERE id_conteneur = $1 AND type_alerte = $2 AND statut = 'ACTIVE'
      ORDER BY date_creation DESC
      LIMIT 1
    `;
    const result = await this.pool.query(sql, [idConteneur, typeAlerte]);
    return result.rows[0] || null;
  }

  /**
   * Récupère une alerte par ID
   */
  async findById(idAlerte) {
    const sql = `
      SELECT a.*, cnt.uid as uid_conteneur, cnt.id_zone
      FROM alerte_capteur a
      JOIN conteneur cnt ON a.id_conteneur = cnt.id_conteneur
      WHERE a.id_alerte = $1
    `;
    const result = await this.pool.query(sql, [idAlerte]);
    return result.rows[0] || null;
  }

  /**
   * Statistiques des alertes
   */
  async getStats() {
    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE statut = 'ACTIVE') as alertes_actives,
        COUNT(*) FILTER (WHERE statut = 'RESOLUE') as alertes_resolues,
        COUNT(*) FILTER (WHERE statut = 'IGNOREE') as alertes_ignorees,
        COUNT(*) FILTER (WHERE type_alerte = 'DEBORDEMENT' AND statut = 'ACTIVE') as debordements_actifs,
        COUNT(*) FILTER (WHERE type_alerte = 'BATTERIE_FAIBLE' AND statut = 'ACTIVE') as batteries_faibles_actives,
        COUNT(*) FILTER (WHERE type_alerte = 'CAPTEUR_DEFAILLANT' AND statut = 'ACTIVE') as capteurs_defaillants_actifs,
        COUNT(*) FILTER (WHERE date_creation >= NOW() - INTERVAL '24 hours') as alertes_24h
      FROM alerte_capteur
    `;
    const result = await this.pool.query(sql);
    return result.rows[0];
  }
}

module.exports = AlertRepository;
