
-- Vue matérialisée pour les stats quotidiennes
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
ORDER BY date DESC;

CREATE INDEX IF NOT EXISTS idx_analytics_daily_stats_date 
ON analytics_daily_stats(date);

-- Vue matérialisée pour les stats par zone
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_zone_stats AS
SELECT 
  z.id_zone,
  z.nom as zone_name,
  z.code as zone_code,
  COUNT(DISTINCT c.id_conteneur) as containers_count,
  CASE 
    WHEN COUNT(latest.niveau_remplissage_pct) > 0 
    THEN ROUND(AVG(latest.niveau_remplissage_pct), 2)
    ELSE NULL
  END as avg_fill_level,
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
GROUP BY z.id_zone, z.nom, z.code;

CREATE INDEX IF NOT EXISTS idx_analytics_zone_stats_zone 
ON analytics_zone_stats(id_zone);

-- Vue matérialisée pour les stats par type de conteneur
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_type_stats AS
SELECT 
  tc.id_type,
  tc.nom as container_type,
  COUNT(DISTINCT c.id_conteneur) as containers_count,
  CASE 
    WHEN COUNT(latest.niveau_remplissage_pct) > 0 
    THEN ROUND(AVG(latest.niveau_remplissage_pct), 2)
    ELSE NULL
  END as avg_fill_level,
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
GROUP BY tc.id_type, tc.nom;
