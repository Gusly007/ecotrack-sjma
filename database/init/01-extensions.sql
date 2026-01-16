-- ============================================================================
-- EXTENSIONS PostgreSQL (exécuté au premier démarrage uniquement)
-- ============================================================================

-- PostGIS pour les données géospatiales
CREATE EXTENSION IF NOT EXISTS postgis;

-- UUID pour générer des identifiants uniques
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fonctions de cryptographie (optionnel)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recherche full-text améliorée (optionnel)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Extensions PostgreSQL installées avec succès';
END $$;
