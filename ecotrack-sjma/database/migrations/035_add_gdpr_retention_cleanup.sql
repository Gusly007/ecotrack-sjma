-- 035_add_gdpr_retention_cleanup.sql
--
-- Fonctions de nettoyage automatique des données GDPR à durée limitée :
--   - ecotrack_archive.consent_logs       → rétention 13 mois (Art. 7 RGPD)
--   - ecotrack_archive.archived_logs      → rétention 12 mois (Art. 25, 32 RGPD)
--   - cookie_consent (public)             → rétention 13 mois (directive ePrivacy)
--
-- Cette migration complète les tables créées en 027 et 028 en leur ajoutant :
--   1. Une colonne expires_at sur cookie_consent pour la cohérence avec ecotrack_archive
--   2. Une fonction SQL de purge centralisée invocable par cron ou pg_cron

-- 1. Ajouter expires_at sur cookie_consent (cohérence avec consent_logs)
ALTER TABLE cookie_consent
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP
    DEFAULT (CURRENT_TIMESTAMP + INTERVAL '13 months');

UPDATE cookie_consent
  SET expires_at = created_at + INTERVAL '13 months'
  WHERE expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cookie_consent_expires
  ON cookie_consent(expires_at);

-- 2. Fonction de purge centralisée des données GDPR expirées
CREATE OR REPLACE FUNCTION purge_expired_gdpr_data()
RETURNS TABLE(
  table_name   TEXT,
  rows_deleted BIGINT
) AS $$
DECLARE
  v_count BIGINT;
BEGIN
  -- Purge cookie_consent expirés
  DELETE FROM cookie_consent
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT 'cookie_consent'::TEXT, v_count;

  -- Purge consent_logs expirés (schema ecotrack_archive)
  DELETE FROM ecotrack_archive.consent_logs
  WHERE expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT 'ecotrack_archive.consent_logs'::TEXT, v_count;

  -- Purge archived_logs expirés (schema ecotrack_archive)
  DELETE FROM ecotrack_archive.archived_logs
  WHERE expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT 'ecotrack_archive.archived_logs'::TEXT, v_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Usage (à appeler via cron quotidien ou pg_cron) :
--    SELECT * FROM purge_expired_gdpr_data();
--    -> Retourne le nombre de lignes supprimées par table
COMMENT ON FUNCTION purge_expired_gdpr_data() IS
  'Purge les données GDPR expirées des tables cookie_consent et ecotrack_archive. '
  'Respecte les durées de rétention : 13 mois (consentements), 12 mois (logs archivés). '
  'Appeler quotidiennement via cron ou pg_cron.';
