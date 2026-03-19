-- Table des constantes de performance des agents
CREATE TABLE agent_performance_constants (
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

CREATE INDEX idx_agent_perf_cle ON agent_performance_constants(cle);
CREATE INDEX idx_agent_perf_est_actif ON agent_performance_constants(est_actif);

CREATE OR REPLACE FUNCTION update_agent_perf_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_perf_updated_at
    BEFORE UPDATE ON agent_performance_constants
    FOR EACH ROW EXECUTE FUNCTION update_agent_perf_updated_at();

COMMENT ON TABLE agent_performance_constants IS 'Constantes de performance pour les agents de collecte';
