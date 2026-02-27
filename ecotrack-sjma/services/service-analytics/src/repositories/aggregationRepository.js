const db = require('../config/database');
const logger = require('../utils/logger');

class AggregationRepository {
  /**
   * Créer les vues matérialisées (depuis migrations)
   */
  static async createMaterializedViews() {
    try {
      await db.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_stats AS
        SELECT 
          DATE(m.date_heure_mesure) as date,
          COUNT(DISTINCT m.id_conteneur) as containers_measured,
          ROUND(AVG(m.niveau_remplissage_pct), 2) as avg_fill_level,
          COUNT(*) FILTER (WHERE m.niveau_remplissage_pct > 80) as critical_count,
          COUNT(*) as total_measurements
        FROM MESURE m
        WHERE m.date_heure_mesure >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY DATE(m.date_heure_mesure)
        ORDER BY date DESC
      `);
      
      await db.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_zone_stats AS
        SELECT 
          z.id_zone,
          z.nom as zone_name,
          z.code as zone_code,
          COUNT(DISTINCT c.id_conteneur) as containers_count,
          ROUND(AVG(latest.niveau_remplissage_pct), 2) as avg_fill_level,
          COUNT(*) FILTER (WHERE latest.niveau_remplissage_pct > 80) as critical_count
        FROM ZONE z
        LEFT JOIN CONTENEUR c ON c.id_zone = z.id_zone
        LEFT JOIN LATERAL (
          SELECT niveau_remplissage_pct
          FROM MESURE m
          WHERE m.id_conteneur = c.id_conteneur
          ORDER BY m.date_heure_mesure DESC
          LIMIT 1
        ) latest ON true
        GROUP BY z.id_zone, z.nom, z.code
      `);
      
      await db.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_type_stats AS
        SELECT 
          tc.id_type,
          tc.nom as container_type,
          COUNT(DISTINCT c.id_conteneur) as containers_count,
          ROUND(AVG(latest.niveau_remplissage_pct), 2) as avg_fill_level,
          COUNT(*) FILTER (WHERE latest.niveau_remplissage_pct > 80) as critical_count
        FROM TYPE_CONTENEUR tc
        LEFT JOIN CONTENEUR c ON c.id_type = tc.id_type
        LEFT JOIN LATERAL (
          SELECT niveau_remplissage_pct
          FROM MESURE m
          WHERE m.id_conteneur = c.id_conteneur
          ORDER BY m.date_heure_mesure DESC
          LIMIT 1
        ) latest ON true
        GROUP BY tc.id_type, tc.nom
      `);
      
      logger.info('Materialized views created successfully');
      return { success: true };
    } catch (error) {
      logger.error({ err: error }, 'Error creating materialized views');
      throw error;
    }
  }

  /**
   * Rafraîchir les vues matérialisées
   */
  static async refreshMaterializedViews() {
    try {
      await db.query(`
        REFRESH MATERIALIZED VIEW analytics_daily_stats;
        REFRESH MATERIALIZED VIEW analytics_zone_stats;
        REFRESH MATERIALIZED VIEW analytics_type_stats;
      `);
      
      logger.info('Materialized views refreshed');
      return { success: true, refreshedAt: new Date() };
    } catch (error) {
      logger.error({ err: error }, 'Error refreshing views');
      throw error;
    }
  }

  /**
   * Agrégations quotidiennes des mesures
   */
  static async getDailyAggregations(days = 30) {
    try {
      const query = `
        SELECT * FROM analytics_daily_stats
        WHERE date >= CURRENT_DATE - (($1 || ' days')::interval)
        ORDER BY date DESC;
      `;
      
      const result = await db.query(query, [String(days)]);
      return result.rows;
    } catch (error) {
      logger.error({ err: error }, 'Error fetching daily aggregations');
      throw error;
    }
  }

  /**
   * Statistiques par zone
   */
  static async getZoneAggregations() {
    try {
      const query = `
        SELECT 
          azs.*,
          z.superficie_km2,
          z.population,
          ROUND(azs.containers_count::numeric / NULLIF(z.superficie_km2, 0), 2) as containers_per_km2
        FROM analytics_zone_stats azs
        JOIN ZONE z ON z.id_zone = azs.id_zone
        ORDER BY azs.avg_fill_level DESC;
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error({ err: error }, 'Error fetching zone aggregations');
      throw error;
    }
  }

  /**
   * Statistiques par type de conteneur
   */
  static async getTypeAggregations() {
    try {
      const query = `
        SELECT * FROM analytics_type_stats
        ORDER BY containers_count DESC;
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error({ err: error }, 'Error fetching type aggregations');
      throw error;
    }
  }

  /**
   * Performances des agents
   */
  static async getAgentPerformances(startDate, endDate) {
    try {
      const query = `
        SELECT 
          u.id_utilisateur,
          u.nom,
          u.prenom,
          COUNT(DISTINCT t.id_tournee) as total_routes,
          COUNT(DISTINCT t.id_tournee) FILTER (WHERE t.statut = 'TERMINEE') as completed_routes,
          ROUND(AVG(t.distance_reelle_km), 2) as avg_distance_km,
          ROUND(AVG(t.duree_reelle_min), 2) as avg_duration_min,
          0 as avg_completion_rate
        FROM UTILISATEUR u
        LEFT JOIN TOURNEE t ON t.id_agent = u.id_utilisateur
          AND t.date_tournee BETWEEN $1 AND $2
        WHERE u.role_par_defaut = 'AGENT'
        GROUP BY u.id_utilisateur, u.nom, u.prenom
        HAVING COUNT(DISTINCT t.id_tournee) > 0
        ORDER BY completed_routes DESC;
      `;
      
      const result = await db.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      logger.error({ err: error }, 'Error fetching agent performances');
      throw error;
    }
  }

  /**
   * Agrégation globale pour un dashboard
   */
  static async getGlobalAggregation() {
    try {
      const query = `
        WITH latest_stats AS (
          SELECT * FROM analytics_daily_stats
          ORDER BY date DESC
          LIMIT 1
        )
        SELECT 
          (SELECT COUNT(*) FROM CONTENEUR WHERE statut = 'ACTIF') as total_containers,
          (SELECT containers_measured FROM latest_stats) as containers_with_data,
          (SELECT avg_fill_level FROM latest_stats) as avg_fill_level,
          (SELECT critical_count FROM latest_stats) as critical_containers,
          (SELECT COUNT(*) FROM analytics_zone_stats) as total_zones,
          (SELECT COUNT(*) FROM TOURNEE WHERE statut = 'EN_COURS') as active_routes,
          (SELECT COUNT(*) FROM SIGNALEMENT WHERE statut = 'OUVERT') as open_reports;
      `;
      
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error({ err: error }, 'Error fetching global aggregation');
      throw error;
    }
  }
}

module.exports = AggregationRepository;
