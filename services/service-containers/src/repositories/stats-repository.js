/**
 * Stats Repository — Phase 5 : Statistiques & Monitoring
 *
 * Toutes les requêtes SQL de statistiques sont centralisées ici.
 * Elles exploitent les tables existantes du schéma EcoTrack.sql :
 *   conteneur, type_conteneur, zone, capteur, mesure,
 *   collecte, tournee, alerte_capteur, historique_statut
 */
class StatsRepository {
  constructor(db) {
    this.db = db;
  }

  // ──────────────────────────────────────────────
  // 1. Stats globales des conteneurs
  // ──────────────────────────────────────────────
  async getGlobalStats() {
    const result = await this.db.query(`
      SELECT
        COUNT(*)::int                                            AS total,
        COUNT(CASE WHEN statut = 'ACTIF' THEN 1 END)::int       AS actifs,
        COUNT(CASE WHEN statut = 'INACTIF' THEN 1 END)::int     AS inactifs,
        COUNT(CASE WHEN statut = 'EN_MAINTENANCE' THEN 1 END)::int AS en_maintenance,
        ROUND(AVG(capacite_l))::int                              AS capacite_moyenne_l,
        MIN(date_installation)                                   AS premiere_installation,
        MAX(date_installation)                                   AS derniere_installation
      FROM conteneur
    `);
    return result.rows[0];
  }

  // ──────────────────────────────────────────────
  // 2. Distribution des niveaux de remplissage
  //    (dernière mesure par conteneur)
  // ──────────────────────────────────────────────
  async getFillLevelDistribution() {
    const result = await this.db.query(`
      WITH derniere_mesure AS (
        SELECT DISTINCT ON (m.id_conteneur)
          m.id_conteneur,
          m.niveau_remplissage_pct,
          m.batterie_pct,
          m.date_heure_mesure
        FROM mesure m
        ORDER BY m.id_conteneur, m.date_heure_mesure DESC
      )
      SELECT
        COUNT(*)::int                                                         AS total_mesures,
        COUNT(CASE WHEN niveau_remplissage_pct < 25 THEN 1 END)::int         AS vide_0_25,
        COUNT(CASE WHEN niveau_remplissage_pct BETWEEN 25 AND 49.99 THEN 1 END)::int AS moyen_25_50,
        COUNT(CASE WHEN niveau_remplissage_pct BETWEEN 50 AND 74.99 THEN 1 END)::int AS eleve_50_75,
        COUNT(CASE WHEN niveau_remplissage_pct >= 75 THEN 1 END)::int        AS critique_75_100,
        ROUND(AVG(niveau_remplissage_pct), 1)                                AS remplissage_moyen_pct,
        ROUND(AVG(batterie_pct), 1)                                          AS batterie_moyenne_pct
      FROM derniere_mesure
    `);
    return result.rows[0];
  }

  // ──────────────────────────────────────────────
  // 3. Stats par zone
  // ──────────────────────────────────────────────
  async getStatsByZone() {
    const result = await this.db.query(`
      SELECT
        z.id_zone,
        z.nom              AS zone_nom,
        z.type             AS zone_type,
        COUNT(c.id_conteneur)::int AS nb_conteneurs,
        COUNT(CASE WHEN c.statut = 'ACTIF' THEN 1 END)::int AS actifs,
        ROUND(AVG(c.capacite_l))::int AS capacite_moyenne_l,
        ROUND(AVG(dm.niveau_remplissage_pct), 1) AS remplissage_moyen_pct
      FROM zone z
      LEFT JOIN conteneur c ON c.id_zone = z.id_zone
      LEFT JOIN LATERAL (
        SELECT niveau_remplissage_pct
        FROM mesure
        WHERE id_conteneur = c.id_conteneur
        ORDER BY date_heure_mesure DESC
        LIMIT 1
      ) dm ON TRUE
      GROUP BY z.id_zone, z.nom, z.type
      ORDER BY nb_conteneurs DESC
    `);
    return result.rows;
  }

  // ──────────────────────────────────────────────
  // 4. Stats par type de conteneur
  // ──────────────────────────────────────────────
  async getStatsByType() {
    const result = await this.db.query(`
      SELECT
        tc.id_type,
        tc.nom             AS type_nom,
        tc.code            AS type_code,
        COUNT(c.id_conteneur)::int AS nb_conteneurs,
        COUNT(CASE WHEN c.statut = 'ACTIF' THEN 1 END)::int AS actifs
      FROM type_conteneur tc
      LEFT JOIN conteneur c ON c.id_type = tc.id_type
      GROUP BY tc.id_type, tc.nom, tc.code
      ORDER BY nb_conteneurs DESC
    `);
    return result.rows;
  }

  // ──────────────────────────────────────────────
  // 5. Conteneurs en alerte
  //    (débordement, batterie faible, capteur défaillant)
  // ──────────────────────────────────────────────
  async getAlertsSummary() {
    const result = await this.db.query(`
      SELECT
        COUNT(*)::int AS total_alertes_actives,
        COUNT(CASE WHEN type_alerte = 'DEBORDEMENT' THEN 1 END)::int       AS debordements,
        COUNT(CASE WHEN type_alerte = 'BATTERIE_FAIBLE' THEN 1 END)::int   AS batteries_faibles,
        COUNT(CASE WHEN type_alerte = 'CAPTEUR_DEFAILLANT' THEN 1 END)::int AS capteurs_defaillants,
        json_agg(
          json_build_object(
            'id_alerte', ac.id_alerte,
            'type_alerte', ac.type_alerte,
            'valeur_detectee', ac.valeur_detectee,
            'seuil', ac.seuil,
            'id_conteneur', ac.id_conteneur,
            'date_creation', ac.date_creation,
            'description', ac.description
          ) ORDER BY ac.date_creation DESC
        ) FILTER (WHERE ac.id_alerte IS NOT NULL) AS alertes
      FROM alerte_capteur ac
      WHERE ac.statut = 'ACTIVE'
    `);
    return result.rows[0];
  }

  // ──────────────────────────────────────────────
  // 6. Conteneurs critiques
  //    (remplissage >= seuil OU statut EN_MAINTENANCE)
  // ──────────────────────────────────────────────
  async getCriticalContainers(seuilRemplissage = 90) {
    const result = await this.db.query(`
      SELECT
        c.id_conteneur,
        c.uid,
        c.statut,
        c.capacite_l,
        z.nom AS zone_nom,
        tc.nom AS type_nom,
        dm.niveau_remplissage_pct,
        dm.batterie_pct,
        dm.date_heure_mesure AS derniere_mesure,
        ST_Y(c.position::geometry) AS latitude,
        ST_X(c.position::geometry) AS longitude
      FROM conteneur c
      LEFT JOIN zone z ON z.id_zone = c.id_zone
      LEFT JOIN type_conteneur tc ON tc.id_type = c.id_type
      LEFT JOIN LATERAL (
        SELECT niveau_remplissage_pct, batterie_pct, date_heure_mesure
        FROM mesure
        WHERE id_conteneur = c.id_conteneur
        ORDER BY date_heure_mesure DESC
        LIMIT 1
      ) dm ON TRUE
      WHERE c.statut = 'EN_MAINTENANCE'
         OR dm.niveau_remplissage_pct >= $1
      ORDER BY COALESCE(dm.niveau_remplissage_pct, 0) DESC
    `, [seuilRemplissage]);
    return result.rows;
  }

  // ──────────────────────────────────────────────
  // 7. Historique de remplissage d'un conteneur
  //    (pour graphiques d'évolution)
  // ──────────────────────────────────────────────
  async getFillHistory(idConteneur, { days = 30, limit = 500 } = {}) {
    const result = await this.db.query(`
      SELECT
        m.niveau_remplissage_pct,
        m.batterie_pct,
        m.temperature,
        m.date_heure_mesure
      FROM mesure m
      WHERE m.id_conteneur = $1
        AND m.date_heure_mesure >= NOW() - INTERVAL '1 day' * $2
      ORDER BY m.date_heure_mesure ASC
      LIMIT $3
    `, [idConteneur, days, limit]);
    return result.rows;
  }

  // ──────────────────────────────────────────────
  // 8. Stats de collecte
  //    (totaux kg, par zone, par type, fréquence)
  // ──────────────────────────────────────────────
  async getCollectionStats({ days = 30 } = {}) {
    const result = await this.db.query(`
      SELECT
        COUNT(*)::int                        AS nb_collectes,
        ROUND(SUM(co.quantite_kg), 2)       AS total_kg,
        ROUND(AVG(co.quantite_kg), 2)       AS moyenne_kg_par_collecte,
        ROUND(MAX(co.quantite_kg), 2)       AS max_kg,
        MIN(co.date_heure_collecte)          AS premiere_collecte,
        MAX(co.date_heure_collecte)          AS derniere_collecte
      FROM collecte co
      WHERE co.date_heure_collecte >= NOW() - INTERVAL '1 day' * $1
    `, [days]);

    // Détail par zone
    const byZone = await this.db.query(`
      SELECT
        z.id_zone,
        z.nom AS zone_nom,
        COUNT(co.id_collecte)::int       AS nb_collectes,
        ROUND(SUM(co.quantite_kg), 2)   AS total_kg
      FROM collecte co
      JOIN conteneur c ON c.id_conteneur = co.id_conteneur
      LEFT JOIN zone z ON z.id_zone = c.id_zone
      WHERE co.date_heure_collecte >= NOW() - INTERVAL '1 day' * $1
      GROUP BY z.id_zone, z.nom
      ORDER BY total_kg DESC
    `, [days]);

    // Détail par type
    const byType = await this.db.query(`
      SELECT
        tc.id_type,
        tc.nom AS type_nom,
        tc.code AS type_code,
        COUNT(co.id_collecte)::int       AS nb_collectes,
        ROUND(SUM(co.quantite_kg), 2)   AS total_kg
      FROM collecte co
      JOIN conteneur c ON c.id_conteneur = co.id_conteneur
      LEFT JOIN type_conteneur tc ON tc.id_type = c.id_type
      WHERE co.date_heure_collecte >= NOW() - INTERVAL '1 day' * $1
      GROUP BY tc.id_type, tc.nom, tc.code
      ORDER BY total_kg DESC
    `, [days]);

    return {
      ...result.rows[0],
      par_zone: byZone.rows,
      par_type: byType.rows,
    };
  }

  // ──────────────────────────────────────────────
  // 9. Stats de maintenance
  //    (conteneurs en maintenance, durée moyenne)
  // ──────────────────────────────────────────────
  async getMaintenanceStats() {
    // Conteneurs actuellement en maintenance
    const enMaintenance = await this.db.query(`
      SELECT
        c.id_conteneur,
        c.uid,
        z.nom AS zone_nom,
        tc.nom AS type_nom,
        hs.date_changement AS debut_maintenance,
        EXTRACT(EPOCH FROM (NOW() - hs.date_changement)) / 3600 AS heures_en_maintenance
      FROM conteneur c
      LEFT JOIN zone z ON z.id_zone = c.id_zone
      LEFT JOIN type_conteneur tc ON tc.id_type = c.id_type
      LEFT JOIN LATERAL (
        SELECT date_changement
        FROM historique_statut
        WHERE id_entite = c.id_conteneur
          AND type_entite = 'CONTENEUR'
          AND nouveau_statut = 'EN_MAINTENANCE'
        ORDER BY date_changement DESC
        LIMIT 1
      ) hs ON TRUE
      WHERE c.statut = 'EN_MAINTENANCE'
      ORDER BY hs.date_changement ASC
    `);

    // Durée moyenne des maintenances terminées (90 derniers jours)
    const durees = await this.db.query(`
      WITH maintenances AS (
        SELECT
          id_entite,
          date_changement AS debut,
          LEAD(date_changement) OVER (
            PARTITION BY id_entite ORDER BY date_changement
          ) AS fin
        FROM historique_statut
        WHERE type_entite = 'CONTENEUR'
          AND date_changement >= NOW() - INTERVAL '90 days'
      )
      SELECT
        COUNT(*)::int AS nb_maintenances_terminees,
        ROUND(AVG(EXTRACT(EPOCH FROM (fin - debut)) / 3600), 1) AS duree_moyenne_heures,
        ROUND(MAX(EXTRACT(EPOCH FROM (fin - debut)) / 3600), 1) AS duree_max_heures
      FROM maintenances
      WHERE fin IS NOT NULL
    `);

    return {
      en_cours: enMaintenance.rows,
      nb_en_cours: enMaintenance.rows.length,
      stats_90_jours: durees.rows[0],
    };
  }
}

module.exports = StatsRepository;
