const db = require('../config/database');

class DashboardAnalyticsRepository {
  static async getKpiBaseStats() {
    const query = `
      SELECT
        COUNT(DISTINCT c.id_conteneur) as active_containers,
        COUNT(m.id_mesure) as total_measurements,
        ROUND(AVG(m.niveau_remplissage_pct)::numeric, 2) as avg_fill_level,
        ROUND(AVG(m.batterie_pct)::numeric, 2) as avg_battery
      FROM CONTENEUR c
      LEFT JOIN MESURE m ON m.id_conteneur = c.id_conteneur
        AND m.date_heure_mesure >= NOW() - INTERVAL '7 days'
      WHERE c.statut = 'ACTIF'
    `;

    const result = await db.query(query);
    return result.rows[0] || {};
  }

  static async getActiveAlertsCount() {
    const result = await db.query(`SELECT COUNT(*) as active_alerts FROM ALERTE_CAPTEUR WHERE statut = 'ACTIVE'`);
    return result.rows[0] || {};
  }

  static async getCriticalContainersCount(threshold = 85) {
    const query = `
      SELECT COUNT(*) as count FROM (
        SELECT m.id_conteneur
        FROM MESURE m
        WHERE m.niveau_remplissage_pct > $1
          AND m.date_heure_mesure >= NOW() - INTERVAL '24 hours'
        GROUP BY m.id_conteneur
      ) sub
    `;

    const result = await db.query(query, [threshold]);
    return result.rows[0] || {};
  }

  static async getFillTrends(days = 7) {
    const query = `
      SELECT
        DATE(m.date_heure_mesure) as date,
        ROUND(AVG(m.niveau_remplissage_pct)::numeric, 2) as avgFillLevel,
        COUNT(*) as measurementCount,
        ROUND(AVG(m.batterie_pct)::numeric, 2) as avgBattery
      FROM MESURE m
      WHERE m.date_heure_mesure >= NOW() - ($1 || ' days')::interval
      GROUP BY DATE(m.date_heure_mesure)
      ORDER BY date ASC
    `;

    const result = await db.query(query, [String(days)]);
    return result.rows;
  }

  static async getZonePerformance() {
    const query = `
      SELECT
        z.id_zone as id,
        z.nom as name,
        z.code,
        COUNT(DISTINCT c.id_conteneur) as containerCount,
        ROUND(AVG(m.niveau_remplissage_pct)::numeric, 2) as fillRate,
        ROUND(AVG(m.batterie_pct)::numeric, 2) as avgBattery,
        COUNT(m.id_mesure) as measurementCount
      FROM ZONE z
      LEFT JOIN CONTENEUR c ON c.id_zone = z.id_zone AND c.statut = 'ACTIF'
      LEFT JOIN MESURE m ON m.id_conteneur = c.id_conteneur
        AND m.date_heure_mesure >= NOW() - INTERVAL '7 days'
      GROUP BY z.id_zone, z.nom, z.code
      ORDER BY fillRate DESC NULLS LAST
    `;

    const result = await db.query(query);
    return result.rows;
  }

  static async getCriticalContainers(threshold = 85, limit = 15) {
    const query = `
      SELECT
        c.id_conteneur,
        c.uid,
        ROUND(m.niveau_remplissage_pct::numeric, 2) as fillLevel,
        ROUND(m.batterie_pct::numeric, 2) as battery,
        m.date_heure_mesure as lastUpdate,
        tc.nom as type,
        z.nom as zone
      FROM CONTENEUR c
      JOIN LATERAL (
        SELECT niveau_remplissage_pct, batterie_pct, date_heure_mesure
        FROM MESURE m2
        WHERE m2.id_conteneur = c.id_conteneur
        ORDER BY m2.date_heure_mesure DESC
        LIMIT 1
      ) m ON true
      JOIN TYPE_CONTENEUR tc ON tc.id_type = c.id_type
      LEFT JOIN ZONE z ON z.id_zone = c.id_zone
      WHERE c.statut = 'ACTIF'
      AND m.niveau_remplissage_pct >= $1
      ORDER BY m.niveau_remplissage_pct DESC
      LIMIT $2
    `;

    const result = await db.query(query, [threshold, limit]);
    return result.rows;
  }

  static async getTypeDistribution() {
    const query = `
      SELECT
        tc.id_type,
        tc.nom as type,
        tc.code,
        COUNT(DISTINCT c.id_conteneur) as containerCount,
        ROUND(AVG(m.niveau_remplissage_pct)::numeric, 2) as avgFillRate,
        ROUND(AVG(m.batterie_pct)::numeric, 2) as avgBattery
      FROM TYPE_CONTENEUR tc
      LEFT JOIN CONTENEUR c ON c.id_type = tc.id_type AND c.statut = 'ACTIF'
      LEFT JOIN MESURE m ON m.id_conteneur = c.id_conteneur
        AND m.date_heure_mesure >= NOW() - INTERVAL '7 days'
      GROUP BY tc.id_type, tc.nom, tc.code
      ORDER BY containerCount DESC
    `;

    const result = await db.query(query);
    return result.rows;
  }

  static async getCollecteSummary(days = 30) {
    const query = `
      SELECT
        COUNT(*) as totalCollections,
        ROUND(SUM(quantite_kg)::numeric, 2) as totalKg,
        ROUND(AVG(quantite_kg)::numeric, 2) as avgKg,
        ROUND(MAX(quantite_kg)::numeric, 2) as maxKg,
        ROUND(MIN(quantite_kg)::numeric, 2) as minKg
      FROM COLLECTE
      WHERE date_heure_collecte >= NOW() - ($1 || ' days')::interval
    `;

    const result = await db.query(query, [String(days)]);
    return result.rows[0] || null;
  }

  static async getCollecteDaily(days = 30) {
    const query = `
      SELECT
        DATE(date_heure_collecte) as date,
        COUNT(*) as collections,
        ROUND(SUM(quantite_kg)::numeric, 2) as totalKg
      FROM COLLECTE
      WHERE date_heure_collecte >= NOW() - ($1 || ' days')::interval
      GROUP BY DATE(date_heure_collecte)
      ORDER BY date ASC
    `;

    const result = await db.query(query, [String(days)]);
    return result.rows;
  }
}

module.exports = DashboardAnalyticsRepository;
