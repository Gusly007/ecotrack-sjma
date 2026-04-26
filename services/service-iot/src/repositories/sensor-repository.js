/**
 * Repository pour les capteurs (table capteur)
 */
class SensorRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Trouve un capteur par son UID
   */
  async findByUid(uidCapteur) {
    const sql = `
      SELECT c.*, cnt.id_conteneur, cnt.uid as uid_conteneur, cnt.id_zone
      FROM capteur c
      JOIN conteneur cnt ON c.id_conteneur = cnt.id_conteneur
      WHERE c.uid_capteur = $1
    `;
    const result = await this.pool.query(sql, [uidCapteur]);
    return result.rows[0] || null;
  }

  /**
   * Met à jour la date de dernière communication
   */
  async updateLastCommunication(idCapteur) {
    const sql = `
      UPDATE capteur
      SET derniere_communication = NOW()
      WHERE id_capteur = $1
      RETURNING *
    `;
    const result = await this.pool.query(sql, [idCapteur]);
    return result.rows[0];
  }

  /**
   * Récupère tous les capteurs avec détails
   */
  async findAll(filters = {}) {
    const { page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) as total FROM capteur`;
    const countResult = await this.pool.query(countSql);
    const total = parseInt(countResult.rows[0].total, 10);

    const sql = `
      SELECT c.*,
        cnt.uid as uid_conteneur,
        cnt.id_zone,
        cnt.statut as statut_conteneur,
        z.nom as nom_zone,
        (
          SELECT json_build_object(
            'niveau_remplissage_pct', m.niveau_remplissage_pct,
            'batterie_pct', m.batterie_pct,
            'temperature', m.temperature,
            'date_heure_mesure', m.date_heure_mesure
          )
          FROM mesure m
          WHERE m.id_capteur = c.id_capteur
          ORDER BY m.date_heure_mesure DESC
          LIMIT 1
        ) as derniere_mesure
      FROM capteur c
      JOIN conteneur cnt ON c.id_conteneur = cnt.id_conteneur
      LEFT JOIN zone z ON cnt.id_zone = z.id_zone
      ORDER BY c.derniere_communication DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `;
    const result = await this.pool.query(sql, [limit, offset]);
    return { rows: result.rows, total };
  }

  /**
   * Récupère un capteur par ID avec ses détails
   */
  async findById(idCapteur) {
    const sql = `
      SELECT c.*,
        cnt.uid as uid_conteneur,
        cnt.id_zone,
        cnt.statut as statut_conteneur,
        cnt.capacite_l,
        z.nom as nom_zone
      FROM capteur c
      JOIN conteneur cnt ON c.id_conteneur = cnt.id_conteneur
      LEFT JOIN zone z ON cnt.id_zone = z.id_zone
      WHERE c.id_capteur = $1
    `;
    const result = await this.pool.query(sql, [idCapteur]);
    return result.rows[0] || null;
  }

  /**
   * Détecte les capteurs silencieux (pas de données depuis X heures)
   */
  async findSilentSensors(timeoutHours) {
    const sql = `
      SELECT c.*, cnt.uid as uid_conteneur, cnt.id_zone
      FROM capteur c
      JOIN conteneur cnt ON c.id_conteneur = cnt.id_conteneur
      WHERE cnt.statut = 'ACTIF'
        AND (
          c.derniere_communication IS NULL
          OR c.derniere_communication < NOW() - ($1 * INTERVAL '1 hour')
        )
    `;
    const result = await this.pool.query(sql, [timeoutHours]);
    return result.rows;
  }

  /**
   * Récupère les statistiques globales de statut des capteurs
   */
  async getSensorsStatus() {
    const sql = `
      WITH sensor_stats AS (
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE derniere_communication > NOW() - INTERVAL '1 hour')::int AS active_last_hour,
          COUNT(*) FILTER (WHERE derniere_communication > NOW() - INTERVAL '24 hours')::int AS active_last_24h,
          COUNT(*) FILTER (WHERE derniere_communication IS NULL OR derniere_communication <= NOW() - INTERVAL '12 hours')::int AS inactive_12h,
          COUNT(*) FILTER (WHERE derniere_communication IS NULL OR derniere_communication <= NOW() - INTERVAL '24 hours')::int AS inactive_24h
        FROM capteur
      ),
      latest_per_sensor AS (
        SELECT DISTINCT ON (m.id_capteur)
          m.id_capteur,
          m.batterie_pct
        FROM mesure m
        ORDER BY m.id_capteur, m.date_heure_mesure DESC
      ),
      measure_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE date_heure_mesure > NOW() - INTERVAL '1 minute')::int AS messages_last_minute,
          COALESCE(EXTRACT(EPOCH FROM (NOW() - MAX(date_heure_mesure)))::int, 0) AS seconds_ago
        FROM mesure
      )
      SELECT
        ss.total,
        ss.active_last_hour,
        ss.active_last_24h,
        ss.inactive_12h,
        ss.inactive_24h,
        (SELECT COUNT(*)::int FROM latest_per_sensor WHERE batterie_pct < 20) AS low_battery,
        ms.messages_last_minute,
        ms.seconds_ago
      FROM sensor_stats ss
      CROSS JOIN measure_stats ms
    `;

    const result = await this.pool.query(sql);
    const row = result.rows[0] || {};

    return {
      total: row.total || 0,
      active: row.active_last_hour || 0,
      active_count: row.active_last_hour || 0,
      active_last_24h: row.active_last_24h || 0,
      inactive_12h: row.inactive_12h || 0,
      inactive_24h: row.inactive_24h || 0,
      low_battery: row.low_battery || 0,
      messages_per_min: row.messages_last_minute || 0,
      last_measure_seconds_ago: row.seconds_ago || 0
    };
  }
}

module.exports = SensorRepository;
