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
}

module.exports = SensorRepository;
