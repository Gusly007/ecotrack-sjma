-- Migration: 014_create_constants_tables
-- Tables pour les constantes configurables par admin

-- Table: Paramètres de performance des agents
CREATE TABLE IF NOT EXISTS agent_performance_constants (
    id_constant SERIAL PRIMARY KEY,
    cle VARCHAR(50) UNIQUE NOT NULL,
    valeur NUMERIC(10,4) NOT NULL,
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Paramètres environnementaux
CREATE TABLE IF NOT EXISTS environmental_constants (
    id_constant SERIAL PRIMARY KEY,
    cle VARCHAR(50) UNIQUE NOT NULL,
    valeur NUMERIC(10,4) NOT NULL,
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default values for agent performance
INSERT INTO agent_performance_constants (cle, valeur, description) VALUES
    ('COLLECTION_RATE_WEIGHT', 0.4, 'Pondération taux de collecte (40%)'),
    ('COMPLETION_RATE_WEIGHT', 0.3, 'Pondération taux de complétion (30%)'),
    ('TIME_EFFICIENCY_WEIGHT', 0.15, 'Pondération efficacité temps (15%)'),
    ('DISTANCE_EFFICIENCY_WEIGHT', 0.15, 'Pondération efficacité distance (15%)')
ON CONFLICT (cle) DO NOTHING;

-- Insert default values for environmental
INSERT INTO environmental_constants (cle, valeur, description) VALUES
    ('CO2_PER_KM', 0.85, 'Émissions CO2 kg par km'),
    ('FUEL_CONSUMPTION_PER_100KM', 35, 'Consommation carburant L/100km'),
    ('FUEL_PRICE_PER_LITER', 1.65, 'Prix carburant €/L'),
    ('LABOR_COST_PER_HOUR', 50, 'Coût main œuvre €/heure'),
    ('MAINTENANCE_COST_PER_KM', 0.15, 'Coût maintenance €/km'),
    ('CO2_PER_TREE_PER_YEAR', 20, 'CO2 absorbé par arbre kg/an'),
    ('CO2_PER_KM_CAR', 0.12, 'CO2 voiture kg/km')
ON CONFLICT (cle) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_agent_perf_constants_cle ON agent_performance_constants(cle);
CREATE INDEX IF NOT EXISTS idx_env_constants_cle ON environmental_constants(cle);
