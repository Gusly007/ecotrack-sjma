-- Table des constantes environnementales dynamiques
CREATE TABLE environmental_constants (
    id SERIAL PRIMARY KEY,
    cle VARCHAR(100) UNIQUE NOT NULL,
    valeur TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'number',
    unite VARCHAR(30),
    description TEXT,
    est_modifiable BOOLEAN NOT NULL DEFAULT true,
    est_actif BOOLEAN NOT NULL DEFAULT true,
    min_valeur DECIMAL,
    max_valeur DECIMAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_env_const_cle ON environmental_constants(cle);
CREATE INDEX idx_env_const_est_actif ON environmental_constants(est_actif);

CREATE OR REPLACE FUNCTION update_env_const_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_env_const_updated_at
    BEFORE UPDATE ON environmental_constants
    FOR EACH ROW EXECUTE FUNCTION update_env_const_updated_at();

COMMENT ON TABLE environmental_constants IS 'Constantes environnementales dynamiques pour calculs CO2, coûts, etc.';
