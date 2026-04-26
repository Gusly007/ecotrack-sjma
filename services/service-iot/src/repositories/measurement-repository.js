/**
 * Repository pour les mesures capteur (table mesure)
 */
class MeasurementRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Insère une nouvelle mesure
   */
  async create(data) {
    const sql = `
      INSERT INTO mesure (niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure, id_capteur, id_conteneur)
      VALUES ($1, $2, $3, NOW(), $4, $5)
      RETURNING *
    `;
    const result = await this.pool.query(sql, [
      data.niveau_remplissage_pct,
      data.batterie_pct,
      data.temperature,
      data.id_capteur,
      data.id_conteneur
    ]);
    return result.rows[0];
  }

  /**
   * Récupère les mesures avec filtres et pagination
   */
  async findAll(filters = {}) {
    const { page = 1, limit = 50, id_conteneur, id_capteur, date_debut, date_fin } = filters;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (id_conteneur) {
      conditions.push(`m.id_conteneur = $${paramIndex++}`);
      params.push(id_conteneur);
    }
    if (id_capteur) {
      conditions.push(`m.id_capteur = $${paramIndex++}`);
      params.push(id_capteur);
    }
    if (date_debut) {
      conditions.push(`m.date_heure_mesure >= $${paramIndex++}`);
      params.push(date_debut);
    }
    if (date_fin) {
      conditions.push(`m.date_heure_mesure <= $${paramIndex++}`);
      params.push(date_fin);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM mesure m ${whereClause}`;
    const countResult = await this.pool.query(countSql, params);
    const total = parseInt(countResult.rows[0].total, 10);

    const sql = `
      SELECT m.*, c.uid_capteur, cnt.uid as uid_conteneur
      FROM mesure m
      JOIN capteur c ON m.id_capteur = c.id_capteur
      JOIN conteneur cnt ON m.id_conteneur = cnt.id_conteneur
      ${whereClause}
      ORDER BY m.date_heure_mesure DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await this.pool.query(sql, params);
    return { rows: result.rows, total };
  }

  /**
   * Récupère les mesures d'un conteneur spécifique
   */
  async findByContainerId(idConteneur, limit = 100) {
    const sql = `
      SELECT m.*, c.uid_capteur
      FROM mesure m
      JOIN capteur c ON m.id_capteur = c.id_capteur
      WHERE m.id_conteneur = $1
      ORDER BY m.date_heure_mesure DESC
      LIMIT $2
    `;
    const result = await this.pool.query(sql, [idConteneur, limit]);
    return result.rows;
  }

  /**
   * Récupère la dernière mesure de chaque conteneur
   */
  async findLatestPerContainer() {
    const sql = `
      SELECT DISTINCT ON (m.id_conteneur)
        m.*, c.uid_capteur, cnt.uid as uid_conteneur, cnt.id_zone
      FROM mesure m
      JOIN capteur c ON m.id_capteur = c.id_capteur
      JOIN conteneur cnt ON m.id_conteneur = cnt.id_conteneur
      ORDER BY m.id_conteneur, m.date_heure_mesure DESC
    `;
    const result = await this.pool.query(sql);
    return result.rows;
  }

  /**
   * Statistiques globales des mesures
   */
  async getStats() {
    const sql = `
      SELECT
        COUNT(*) as total_mesures,
        AVG(niveau_remplissage_pct) as avg_fill_level,
        MAX(niveau_remplissage_pct) as max_fill_level,
        MIN(niveau_remplissage_pct) as min_fill_level,
        AVG(batterie_pct) as avg_battery,
        COUNT(CASE WHEN niveau_remplissage_pct >= 90 THEN 1 END) as critical_containers,
        COUNT(CASE WHEN batterie_pct <= 20 THEN 1 END) as low_battery_count,
        COUNT(DISTINCT id_conteneur) as active_containers
      FROM mesure
      WHERE date_heure_mesure >= NOW() - INTERVAL '24 hours'
    `;
    const result = await this.pool.query(sql);
    return result.rows[0];
  }
}

module.exports = MeasurementRepository;
