-- Schéma minimal pour le microservice Gamification
-- (Les tables badge, user_badge, historique_points, notification et utilisateur
--  proviennent du schéma global EcoTrack.)

CREATE TABLE IF NOT EXISTS gamification_defi (
  id_defi SERIAL PRIMARY KEY,
  titre VARCHAR(100) NOT NULL,
  description TEXT,
  objectif INT NOT NULL,
  recompense_points INT NOT NULL DEFAULT 0,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  type_defi VARCHAR(30) NOT NULL DEFAULT 'INDIVIDUEL',
  CONSTRAINT ck_gamification_defi_objectif CHECK (objectif > 0),
  CONSTRAINT ck_gamification_defi_dates CHECK (date_fin >= date_debut)
);

CREATE TABLE IF NOT EXISTS gamification_participation_defi (
  id_participation SERIAL PRIMARY KEY,
  id_defi INT NOT NULL,
  id_utilisateur INT NOT NULL,
  progression INT NOT NULL DEFAULT 0,
  statut VARCHAR(20) NOT NULL DEFAULT 'EN_COURS',
  derniere_maj TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gamification_participation_defi
    FOREIGN KEY (id_defi)
    REFERENCES gamification_defi(id_defi)
    ON DELETE CASCADE,
  CONSTRAINT fk_gamification_participation_utilisateur
    FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateur(id_utilisateur)
    ON DELETE CASCADE,
  CONSTRAINT ck_gamification_participation_progression CHECK (progression >= 0)
);

CREATE INDEX IF NOT EXISTS idx_gamification_participation_defi ON gamification_participation_defi(id_defi, id_utilisateur);

INSERT INTO badge (code, nom, description)
VALUES
  ('DEBUTANT', 'Débutant', 'Premier palier de points atteint'),
  ('ECO_GUERRIER', 'Éco-Guerrier', 'Engagement régulier dans la communauté'),
  ('SUPER_HEROS', 'Super-Héros', 'Champion des bonnes pratiques')
ON CONFLICT (code) DO NOTHING;
