-- Table de configuration dynamique (gérée par les administrateurs)
CREATE TABLE IF NOT EXISTS configurations (
    id SERIAL PRIMARY KEY,
    cle VARCHAR(100) UNIQUE NOT NULL,
    valeur TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'string',
    description TEXT,
    categorie VARCHAR(50) NOT NULL DEFAULT 'general',
    est_modifiable BOOLEAN NOT NULL DEFAULT true,
    est_actif BOOLEAN NOT NULL DEFAULT true,
    min_valeur DECIMAL,
    max_valeur DECIMAL,
    options JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche rapide
CREATE INDEX idx_configurations_cle ON configurations(cle);
CREATE INDEX idx_configurations_categorie ON configurations(categorie);
CREATE INDEX idx_configurations_est_actif ON configurations(est_actif);

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configurations_updated_at
    BEFORE UPDATE ON configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Contraintes de validation par clé
ALTER TABLE configurations ADD CONSTRAINT chk_type CHECK (type IN ('string', 'number', 'boolean', 'json'));

COMMENT ON TABLE configurations IS 'Table de configuration dynamique pour les paramètres système modifiables par les administrateurs';
