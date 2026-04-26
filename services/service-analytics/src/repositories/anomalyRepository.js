const db = require('../config/database');

class AnomalyRepository {
  static async getRecentContainerMeasurements(containerId) {
    const query = `
      SELECT
        niveau_remplissage_pct as fill_level,
        batterie_pct as battery,
        date_heure_mesure as timestamp,
        temperature
      FROM MESURE
      WHERE id_conteneur = $1
        AND date_heure_mesure >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY date_heure_mesure DESC;
    `;

    const result = await db.query(query, [containerId]);
    return result.rows;
  }

  static async getDefectiveSensorStats() {
    const query = `
      WITH sensor_stats AS (
        SELECT
          c.id_conteneur,
          c.uid,
          cap.id_capteur,
          cap.uid_capteur,
          COUNT(m.id_mesure) as measurement_count,
          MAX(m.date_heure_mesure) as last_measurement,
          AVG(m.batterie_pct) as avg_battery,
          COALESCE(STDDEV(m.niveau_remplissage_pct), 0) as stddev_fill
        FROM CONTENEUR c
        LEFT JOIN CAPTEUR cap ON cap.id_conteneur = c.id_conteneur
        LEFT JOIN MESURE m ON m.id_conteneur = c.id_conteneur
          AND m.date_heure_mesure >= CURRENT_DATE - INTERVAL '7 days'
        WHERE c.statut = 'ACTIF'
        GROUP BY c.id_conteneur, c.uid, cap.id_capteur, cap.uid_capteur
      )
      SELECT *
      FROM sensor_stats
      WHERE
        (last_measurement < CURRENT_TIMESTAMP - INTERVAL '48 hours' OR last_measurement IS NULL)
        OR (avg_battery IS NOT NULL AND avg_battery < 10)
        OR (stddev_fill IS NOT NULL AND stddev_fill < 1)
      ORDER BY last_measurement ASC NULLS FIRST;
    `;

    const result = await db.query(query);
    return result.rows;
  }

  static async createSensorAlert({ value, threshold, status, createdAt, description, containerId }) {
    const query = `
      INSERT INTO ALERTE_CAPTEUR (
        type_alerte,
        valeur_detectee,
        seuil,
        statut,
        date_creation,
        description,
        id_conteneur
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await db.query(query, [
      'CAPTEUR_DEFAILLANT',
      value,
      threshold,
      status,
      createdAt,
      description,
      containerId
    ]);
  }

  static async getContainersForGlobalAnomalyScan() {
    const query = `
      SELECT DISTINCT c.id_conteneur, c.uid, cap.id_capteur, cap.uid_capteur
      FROM CONTENEUR c
      LEFT JOIN CAPTEUR cap ON cap.id_conteneur = c.id_conteneur
      JOIN MESURE m ON m.id_conteneur = c.id_conteneur
      WHERE c.statut = 'ACTIF'
        AND m.date_heure_mesure >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY c.id_conteneur, c.uid, cap.id_capteur, cap.uid_capteur
      HAVING COUNT(m.id_mesure) >= 20
      ORDER BY c.id_conteneur
    `;

    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = AnomalyRepository;
