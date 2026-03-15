-- Table pour stocker les prédictions
CREATE TABLE IF NOT EXISTS predictions (
  id_prediction SERIAL PRIMARY KEY,
  container_id INT NOT NULL REFERENCES CONTENEUR(id_conteneur) ON DELETE CASCADE,
  predicted_fill_level DECIMAL(5,2) NOT NULL,
  prediction_date TIMESTAMP NOT NULL,
  confidence INT CHECK (confidence BETWEEN 0 AND 100),
  model_version VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_prediction UNIQUE(container_id, prediction_date)
);

CREATE INDEX idx_predictions_container ON predictions(container_id);
CREATE INDEX idx_predictions_date ON predictions(prediction_date);
CREATE INDEX idx_predictions_confidence ON predictions(confidence DESC);