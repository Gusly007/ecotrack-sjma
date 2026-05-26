-- 029_add_gdpr_consent_indexes.sql
--
-- Index d'optimisation pour les tables GDPR créées en 027 et 028.
-- Cette migration complète la séquence 027 (consent_and_archive) + 028 (cookie_consent)
-- en ajoutant les index de recherche manquants pour les tables de consentement RGPD.

-- Index sur user_consent (table créée en 027)
CREATE INDEX IF NOT EXISTS idx_user_consent_user
    ON user_consent(id_utilisateur);

CREATE INDEX IF NOT EXISTS idx_user_consent_date
    ON user_consent(date_consentement DESC);

CREATE INDEX IF NOT EXISTS idx_user_consent_type
    ON user_consent(type_consentement);

-- Index sur archived_data (table créée en 027)
CREATE INDEX IF NOT EXISTS idx_archived_data_user
    ON archived_data(id_utilisateur);

CREATE INDEX IF NOT EXISTS idx_archived_data_date
    ON archived_data(archived_at DESC);
