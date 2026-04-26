const db = require('../config/database');
const logger = require('../utils/logger');

class KPIRepository {
  /**
   * KPIs temps réel pour le dashboard
   */
  static async getRealTimeKPIs() {
    try {
      const query = `
        WITH real_time_data AS (
          -- Conteneurs critiques maintenant
          SELECT COUNT(*) as critical_containers
          FROM CONTENEUR c
          LEFT JOIN LATERAL (
            SELECT niveau_remplissage_pct
            FROM MESURE m
            WHERE m.id_conteneur = c.id_conteneur
            ORDER BY m.date_heure_mesure DESC
            LIMIT 1
          ) latest ON true
          WHERE c.statut = 'ACTIF' AND latest.niveau_remplissage_pct > 80
        ),
        routes_data AS (
          -- Tournées en cours
          SELECT 
            COUNT(*) FILTER (WHERE statut = 'EN_COURS') as active_routes,
            COUNT(*) FILTER (WHERE statut = 'TERMINEE' AND date_tournee = CURRENT_DATE) as completed_today
          FROM TOURNEE
        ),
        reports_data AS (
          -- Signalements aujourd'hui
          SELECT 
            COUNT(*) as reports_today,
            COUNT(*) FILTER (WHERE statut = 'OUVERT') as open_reports
          FROM SIGNALEMENT
          WHERE DATE(date_creation) = CURRENT_DATE
        )
        SELECT 
          rtd.critical_containers,
          rd.active_routes,
          rd.completed_today,
          rpd.reports_today,
          rpd.open_reports
        FROM real_time_data rtd, routes_data rd, reports_data rpd;
      `;
      
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching real-time KPIs:', error);
      throw error;
    }
  }

  /**
   * Évolution temporelle du remplissage
   */
  static async getFillLevelEvolution(days = 7) {
    try {
      const query = `
        SELECT 
          DATE(date_heure_mesure) as date,
          ROUND(AVG(niveau_remplissage_pct), 2) as avg_fill_level,
          ROUND(MIN(niveau_remplissage_pct), 2) as min_fill_level,
          ROUND(MAX(niveau_remplissage_pct), 2) as max_fill_level,
          COUNT(DISTINCT id_conteneur) as containers_count
        FROM MESURE
        WHERE date_heure_mesure >= CURRENT_DATE - ($1 || ' days')::interval
        GROUP BY DATE(date_heure_mesure)
        ORDER BY date;
      `;
      
      const result = await db.query(query, [String(days)]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching fill level evolution:', error);
      throw error;
    }
  }

  /**
   * Heatmap des zones problématiques
   */
  static async getZoneHeatmap() {
    try {
      const query = `
        SELECT 
          z.id_zone,
          z.nom as zone_name,
          z.code as zone_code,
          ST_AsGeoJSON(z.geom)::json as geometry,
          COUNT(DISTINCT c.id_conteneur) as containers_count,
          ROUND(AVG(latest.niveau_remplissage_pct), 2) as avg_fill_level,
          COUNT(*) FILTER (WHERE latest.niveau_remplissage_pct > 80) as critical_count,
          CASE 
            WHEN AVG(latest.niveau_remplissage_pct) >= 90 THEN 'critical'
            WHEN AVG(latest.niveau_remplissage_pct) >= 80 THEN 'warning'
            WHEN AVG(latest.niveau_remplissage_pct) >= 50 THEN 'normal'
            ELSE 'low'
          END as status
        FROM ZONE z
        LEFT JOIN CONTENEUR c ON c.id_zone = z.id_zone AND c.statut = 'ACTIF'
        LEFT JOIN LATERAL (
          SELECT niveau_remplissage_pct
          FROM MESURE m
          WHERE m.id_conteneur = c.id_conteneur
          ORDER BY m.date_heure_mesure DESC
          LIMIT 1
        ) latest ON true
        GROUP BY z.id_zone, z.nom, z.code, z.geom
        ORDER BY avg_fill_level DESC;
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching zone heatmap:', error);
      throw error;
    }
  }

  /**
   * Top conteneurs critiques avec localisation
   */
  static async getTopCriticalContainers(limit = 10) {
    try {
      const query = `
        SELECT 
          c.id_conteneur,
          c.uid,
          tc.nom as container_type,
          z.nom as zone_name,
          ST_Y(c.position::geometry) as latitude,
          ST_X(c.position::geometry) as longitude,
          m.niveau_remplissage_pct as fill_level,
          m.date_heure_mesure as last_measure,
          COUNT(s.id_signalement) as reports_count
        FROM CONTENEUR c
        LEFT JOIN MESURE m ON m.id_conteneur = c.id_conteneur
          AND m.date_heure_mesure = (
            SELECT MAX(m2.date_heure_mesure)
            FROM MESURE m2
            WHERE m2.id_conteneur = c.id_conteneur
          )
        LEFT JOIN TYPE_CONTENEUR tc ON c.id_type = tc.id_type
        LEFT JOIN ZONE z ON c.id_zone = z.id_zone
        LEFT JOIN SIGNALEMENT s ON s.id_conteneur = c.id_conteneur
          AND s.date_creation >= CURRENT_DATE - INTERVAL '7 days'
        WHERE c.statut = 'ACTIF'
          AND m.niveau_remplissage_pct > 80
        GROUP BY 
          c.id_conteneur, c.uid, tc.nom, z.nom, 
          c.position, m.niveau_remplissage_pct, m.date_heure_mesure
        ORDER BY m.niveau_remplissage_pct DESC, reports_count DESC
        LIMIT $1;
      `;
      
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching top critical containers:', error);
      throw error;
    }
  }
}

module.exports = KPIRepository;