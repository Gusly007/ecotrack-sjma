-- 029_add_gdpr_consent_indexes.sql
--
-- Index composites supplémentaires sur les tables GDPR créées en 027.
-- Migration 027 crée les index simples (user_id, created_at, expires_at...).
-- Cette migration ajoute les index composites pour les requêtes d'audit RGPD :
--   - Historique des consentements d'un utilisateur, triés par date
--   - Piste d'audit d'un utilisateur, triée par date d'archivage
--
-- Les tables cibles sont dans le schéma ecotrack_archive (pas public).

-- Index composite: consentements d'un utilisateur triés par date (Art. 7 RGPD)
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_date
    ON ecotrack_archive.consent_logs(id_utilisateur, created_at DESC);

-- Index composite: consentements par type + action (requêtes d'audit CNIL)
CREATE INDEX IF NOT EXISTS idx_consent_logs_type_action
    ON ecotrack_archive.consent_logs(type_consent, action_consent);

-- Index composite: piste d'audit par utilisateur triée par date d'archivage (Art. 25, 32 RGPD)
CREATE INDEX IF NOT EXISTS idx_archived_logs_user_date
    ON ecotrack_archive.archived_logs(id_utilisateur, archived_at DESC);
