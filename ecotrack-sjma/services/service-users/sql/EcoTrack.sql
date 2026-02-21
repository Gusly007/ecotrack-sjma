-- PostgreSQL + PostGIS version of the schema (Neon compatible)

CREATE EXTENSION IF NOT EXISTS postgis;

-- Tables indépendantes
CREATE TABLE role (
  id_role INTEGER,
  name VARCHAR(20) NOT NULL,
  description VARCHAR(255),
  CONSTRAINT pk_role PRIMARY KEY (id_role),
  CONSTRAINT uk_role_name UNIQUE (name),
  CONSTRAINT ck_role_name_length CHECK (length(name) >= 2)
);

CREATE INDEX idx_role_name ON role(name);

CREATE TABLE type_signalement (
  id_type INTEGER,
  libelle VARCHAR(30) NOT NULL,
  priorite VARCHAR(10) NOT NULL,
  sla_heures INTEGER NOT NULL,
  CONSTRAINT pk_type_signalement PRIMARY KEY (id_type),
  CONSTRAINT uk_type_signalement_libelle UNIQUE (libelle),
  CONSTRAINT ck_priorite_values CHECK (priorite IN ('BASSE', 'NORMALE', 'HAUTE', 'URGENTE'))
);

CREATE INDEX idx_type_signalement_priorite ON type_signalement(priorite);

CREATE TABLE maintenance (
  id_maintenance INTEGER,
  type_maintenance VARCHAR(30) NOT NULL,
  statut VARCHAR(20) NOT NULL,
  date_planifiee TIMESTAMP NOT NULL,
  date_realisation TIMESTAMP,
  CONSTRAINT pk_maintenance PRIMARY KEY (id_maintenance),
  CONSTRAINT ck_maintenance_statut CHECK (statut IN ('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'))
);

CREATE INDEX idx_maintenance_date_statut ON maintenance(date_planifiee, statut);

CREATE TABLE badge (
  id_badge INTEGER,
  code VARCHAR(20) NOT NULL,
  nom VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  CONSTRAINT pk_badge PRIMARY KEY (id_badge),
  CONSTRAINT uk_badge_code UNIQUE (code),
  CONSTRAINT ck_code_length CHECK (length(code) >= 3)
);

CREATE TABLE type_conteneur (
  id_type INTEGER,
  code VARCHAR(10) NOT NULL,
  nom VARCHAR(30) NOT NULL,
  CONSTRAINT pk_type_conteneur PRIMARY KEY (id_type),
  CONSTRAINT uk_type_conteneur_code UNIQUE (code),
  CONSTRAINT ck_type_conteneur_nom CHECK (nom IN ('ORDURE', 'RECYCLAGE', 'VERRE', 'COMPOST'))
);

CREATE TABLE vehicule (
  id_vehicule INTEGER,
  numero_immatriculation VARCHAR(10) NOT NULL,
  modele VARCHAR(50) NOT NULL,
  capacite_kg INTEGER NOT NULL,
  CONSTRAINT pk_vehicule PRIMARY KEY (id_vehicule),
  CONSTRAINT uk_vehicule_immatriculation UNIQUE (numero_immatriculation),
  CONSTRAINT ck_capacite_positive CHECK (capacite_kg > 0)
);

CREATE INDEX idx_vehicule_immatriculation ON vehicule(numero_immatriculation);

-- Tables géographiques (PostGIS)
CREATE TABLE zone (
  id_zone INTEGER,
  code VARCHAR(10) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  population INTEGER,
  superficie_km2 NUMERIC(10,2),
  geom geometry(Polygon, 4326) NOT NULL,
  CONSTRAINT pk_zone PRIMARY KEY (id_zone),
  CONSTRAINT uk_zone_code UNIQUE (code),
  CONSTRAINT ck_population_positive CHECK (population >= 0),
  CONSTRAINT ck_superficie_positive CHECK (superficie_km2 > 0)
);

CREATE INDEX idx_zone_geom ON zone USING GIST (geom);
CREATE INDEX idx_zone_code ON zone(code);

-- Utilisateur
CREATE TABLE utilisateur (
  id_utilisateur INTEGER GENERATED ALWAYS AS IDENTITY,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nom VARCHAR(50) NOT NULL,
  prenom VARCHAR(50) NOT NULL,
  role_par_defaut VARCHAR(20),
  points INTEGER NOT NULL DEFAULT 0,
  est_active BOOLEAN NOT NULL DEFAULT TRUE,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  avatar_url VARCHAR(255),
  avatar_thumbnail VARCHAR(255),
  avatar_mini VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_utilisateur PRIMARY KEY (id_utilisateur),
  CONSTRAINT uk_utilisateur_email UNIQUE (email),
  CONSTRAINT ck_email_format CHECK (email LIKE '%@%'),
  CONSTRAINT ck_points_non_negatifs CHECK (points >= 0),
  CONSTRAINT ck_role_valide CHECK (role_par_defaut IN ('CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'))
);

CREATE INDEX idx_utilisateur_email ON utilisateur(email);
CREATE INDEX idx_utilisateur_role ON utilisateur(role_par_defaut);
CREATE INDEX idx_utilisateur_actif ON utilisateur(est_active);
CREATE INDEX idx_utilisateur_points ON utilisateur(points DESC);
CREATE INDEX idx_utilisateur_avatar ON utilisateur(avatar_url);

-- Associations N:N
CREATE TABLE user_role (
  id_utilisateur INTEGER,
  id_role INTEGER,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_user_role PRIMARY KEY (id_utilisateur, id_role),
  CONSTRAINT fk_user_role_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  CONSTRAINT fk_user_role_role FOREIGN KEY (id_role) REFERENCES role(id_role) ON DELETE CASCADE
);

CREATE INDEX idx_user_role_utilisateur ON user_role(id_utilisateur);
CREATE INDEX idx_user_role_role ON user_role(id_role);

CREATE TABLE user_badge (
  id_utilisateur INTEGER,
  id_badge INTEGER,
  date_obtention TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_user_badge PRIMARY KEY (id_utilisateur, id_badge),
  CONSTRAINT fk_user_badge_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  CONSTRAINT fk_user_badge_badge FOREIGN KEY (id_badge) REFERENCES badge(id_badge) ON DELETE CASCADE
);

CREATE INDEX idx_user_badge_utilisateur ON user_badge(id_utilisateur);
CREATE INDEX idx_user_badge_badge ON user_badge(id_badge);
CREATE INDEX idx_user_badge_date ON user_badge(date_obtention DESC);

-- Conteneurs et capteurs
CREATE TABLE conteneur (
  id_conteneur INTEGER,
  uid VARCHAR(20) NOT NULL,
  capacite_l INTEGER NOT NULL,
  statut VARCHAR(20) NOT NULL,
  date_installation DATE NOT NULL,
  position geometry(Point, 4326) NOT NULL,
  id_zone INTEGER,
  id_type INTEGER,
  CONSTRAINT pk_conteneur PRIMARY KEY (id_conteneur),
  CONSTRAINT uk_conteneur_uid UNIQUE (uid),
  CONSTRAINT fk_conteneur_zone FOREIGN KEY (id_zone) REFERENCES zone(id_zone) ON DELETE SET NULL,
  CONSTRAINT fk_conteneur_type FOREIGN KEY (id_type) REFERENCES type_conteneur(id_type) ON DELETE SET NULL,
  CONSTRAINT ck_capacite_range CHECK (capacite_l BETWEEN 100 AND 5000),
  CONSTRAINT ck_statut_valide CHECK (statut IN ('ACTIF', 'INACTIF', 'EN_MAINTENANCE'))
);

CREATE INDEX idx_conteneur_position ON conteneur USING GIST (position);
CREATE INDEX idx_conteneur_zone ON conteneur(id_zone);
CREATE INDEX idx_conteneur_type ON conteneur(id_type);
CREATE INDEX idx_conteneur_statut ON conteneur(statut);
CREATE INDEX idx_conteneur_date_installation ON conteneur(date_installation DESC);
CREATE INDEX idx_conteneur_uid ON conteneur(uid);

CREATE TABLE capteur (
  id_capteur INTEGER,
  uid_capteur VARCHAR(30) NOT NULL,
  modele VARCHAR(30) NOT NULL,
  version_firmware VARCHAR(20),
  derniere_communication TIMESTAMP,
  id_conteneur INTEGER NOT NULL,
  CONSTRAINT pk_capteur PRIMARY KEY (id_capteur),
  CONSTRAINT uk_capteur_uid UNIQUE (uid_capteur),
  CONSTRAINT uk_capteur_conteneur UNIQUE (id_conteneur),
  CONSTRAINT fk_capteur_conteneur FOREIGN KEY (id_conteneur) REFERENCES conteneur(id_conteneur) ON DELETE CASCADE
);

CREATE INDEX idx_capteur_conteneur ON capteur(id_conteneur);
CREATE INDEX idx_capteur_derniere_com ON capteur(derniere_communication DESC);
CREATE INDEX idx_capteur_uid ON capteur(uid_capteur);

CREATE TABLE mesure (
  id_mesure INTEGER,
  niveau_remplissage_pct NUMERIC(5,2) NOT NULL,
  batterie_pct NUMERIC(5,2) NOT NULL,
  temperature NUMERIC(5,2),
  date_heure_mesure TIMESTAMP NOT NULL,
  id_capteur INTEGER NOT NULL,
  id_conteneur INTEGER NOT NULL,
  CONSTRAINT pk_mesure PRIMARY KEY (id_mesure),
  CONSTRAINT fk_mesure_capteur FOREIGN KEY (id_capteur) REFERENCES capteur(id_capteur) ON DELETE CASCADE,
  CONSTRAINT fk_mesure_conteneur FOREIGN KEY (id_conteneur) REFERENCES conteneur(id_conteneur) ON DELETE CASCADE,
  CONSTRAINT ck_remplissage_range CHECK (niveau_remplissage_pct BETWEEN 0 AND 100),
  CONSTRAINT ck_batterie_range CHECK (batterie_pct BETWEEN 0 AND 100)
);

CREATE INDEX idx_mesure_date ON mesure(date_heure_mesure DESC);
CREATE INDEX idx_mesure_capteur ON mesure(id_capteur);
CREATE INDEX idx_mesure_conteneur ON mesure(id_conteneur);
CREATE INDEX idx_mesure_remplissage ON mesure(niveau_remplissage_pct);
CREATE INDEX idx_mesure_conteneur_date ON mesure(id_conteneur, date_heure_mesure DESC);

-- Tournées et collectes
CREATE TABLE tournee (
  id_tournee INTEGER,
  code VARCHAR(20) NOT NULL,
  date_tournee DATE NOT NULL,
  statut VARCHAR(20) NOT NULL,
  distance_prevue_km NUMERIC(10,2),
  duree_prevue_min INTEGER,
  duree_reelle_min INTEGER,
  distance_reelle_km NUMERIC(10,2),
  id_vehicule INTEGER,
  id_zone INTEGER,
  id_agent INTEGER,
  CONSTRAINT pk_tournee PRIMARY KEY (id_tournee),
  CONSTRAINT uk_tournee_code UNIQUE (code),
  CONSTRAINT fk_tournee_vehicule FOREIGN KEY (id_vehicule) REFERENCES vehicule(id_vehicule) ON DELETE SET NULL,
  CONSTRAINT fk_tournee_zone FOREIGN KEY (id_zone) REFERENCES zone(id_zone) ON DELETE CASCADE,
  CONSTRAINT fk_tournee_agent FOREIGN KEY (id_agent) REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL,
  CONSTRAINT ck_statut_tournee CHECK (statut IN ('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE')),
  CONSTRAINT ck_dates_valides CHECK (date_tournee >= CURRENT_DATE),
  CONSTRAINT ck_duree_positive CHECK (duree_prevue_min > 0 AND duree_reelle_min >= 0),
  CONSTRAINT ck_distance_positive CHECK (distance_prevue_km > 0 AND distance_reelle_km >= 0)
);

CREATE INDEX idx_tournee_date ON tournee(date_tournee DESC);
CREATE INDEX idx_tournee_statut ON tournee(statut);
CREATE INDEX idx_tournee_agent ON tournee(id_agent);
CREATE INDEX idx_tournee_zone ON tournee(id_zone);
CREATE INDEX idx_tournee_vehicule ON tournee(id_vehicule);
CREATE INDEX idx_tournee_code ON tournee(code);
CREATE INDEX idx_tournee_date_statut ON tournee(date_tournee, statut);

CREATE TABLE etape_tournee (
  id_etape INTEGER,
  sequence INTEGER NOT NULL,
  heure_estimee TIME,
  collectee BOOLEAN NOT NULL DEFAULT FALSE,
  id_tournee INTEGER NOT NULL,
  id_conteneur INTEGER NOT NULL,
  CONSTRAINT pk_etape_tournee PRIMARY KEY (id_etape),
  CONSTRAINT fk_etape_tournee_tournee FOREIGN KEY (id_tournee) REFERENCES tournee(id_tournee) ON DELETE CASCADE,
  CONSTRAINT fk_etape_tournee_conteneur FOREIGN KEY (id_conteneur) REFERENCES conteneur(id_conteneur) ON DELETE CASCADE,
  CONSTRAINT ck_sequence_positive CHECK (sequence > 0),
  CONSTRAINT uk_etape_tournee UNIQUE (id_tournee, sequence)
);

CREATE INDEX idx_etape_tournee_tournee ON etape_tournee(id_tournee);
CREATE INDEX idx_etape_tournee_conteneur ON etape_tournee(id_conteneur);
CREATE INDEX idx_etape_tournee_sequence ON etape_tournee(sequence);
CREATE INDEX idx_etape_tournee_collectee ON etape_tournee(collectee);
CREATE INDEX idx_etape_tournee_ordre ON etape_tournee(id_tournee, sequence);

CREATE TABLE collecte (
  id_collecte INTEGER,
  date_heure_collecte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  quantite_kg NUMERIC(10,2) NOT NULL,
  id_tournee INTEGER NOT NULL,
  id_conteneur INTEGER NOT NULL,
  CONSTRAINT pk_collecte PRIMARY KEY (id_collecte),
  CONSTRAINT fk_collecte_tournee FOREIGN KEY (id_tournee) REFERENCES tournee(id_tournee) ON DELETE CASCADE,
  CONSTRAINT fk_collecte_conteneur FOREIGN KEY (id_conteneur) REFERENCES conteneur(id_conteneur) ON DELETE CASCADE,
  CONSTRAINT ck_quantite_positive CHECK (quantite_kg > 0)
);

CREATE INDEX idx_collecte_date ON collecte(date_heure_collecte DESC);
CREATE INDEX idx_collecte_tournee ON collecte(id_tournee);
CREATE INDEX idx_collecte_conteneur ON collecte(id_conteneur);
CREATE INDEX idx_collecte_quantite ON collecte(quantite_kg);
CREATE INDEX idx_collecte_conteneur_date ON collecte(id_conteneur, date_heure_collecte DESC);

-- Signalements
CREATE TABLE signalement (
  id_signalement INTEGER,
  description VARCHAR(1000) NOT NULL,
  url_photo VARCHAR(255),
  statut VARCHAR(20) NOT NULL DEFAULT 'OUVERT',
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_type INTEGER NOT NULL,
  id_conteneur INTEGER NOT NULL,
  id_citoyen INTEGER NOT NULL,
  CONSTRAINT pk_signalement PRIMARY KEY (id_signalement),
  CONSTRAINT fk_signalement_type FOREIGN KEY (id_type) REFERENCES type_signalement(id_type) ON DELETE CASCADE,
  CONSTRAINT fk_signalement_conteneur FOREIGN KEY (id_conteneur) REFERENCES conteneur(id_conteneur) ON DELETE CASCADE,
  CONSTRAINT fk_signalement_citoyen FOREIGN KEY (id_citoyen) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  CONSTRAINT ck_statut_signalement CHECK (statut IN ('OUVERT', 'EN_COURS', 'RESOLU', 'FERME'))
);

CREATE INDEX idx_signalement_statut ON signalement(statut);
CREATE INDEX idx_signalement_date ON signalement(date_creation DESC);
CREATE INDEX idx_signalement_conteneur ON signalement(id_conteneur);
CREATE INDEX idx_signalement_citoyen ON signalement(id_citoyen);
CREATE INDEX idx_signalement_type ON signalement(id_type);
CREATE INDEX idx_signalement_statut_date ON signalement(statut, date_creation DESC);

CREATE TABLE traitement_signalement (
  id_traitement INTEGER,
  date_traitement TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  commentaire VARCHAR(500),
  id_signalement INTEGER NOT NULL,
  id_agent INTEGER NOT NULL,
  CONSTRAINT pk_traitement_signalement PRIMARY KEY (id_traitement),
  CONSTRAINT fk_traitement_signalement_signalement FOREIGN KEY (id_signalement) REFERENCES signalement(id_signalement) ON DELETE CASCADE,
  CONSTRAINT fk_traitement_signalement_agent FOREIGN KEY (id_agent) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  CONSTRAINT uk_traitement_signalement UNIQUE (id_signalement)
);

CREATE INDEX idx_traitement_signalement_date ON traitement_signalement(date_traitement DESC);
CREATE INDEX idx_traitement_signalement_agent ON traitement_signalement(id_agent);
CREATE INDEX idx_traitement_signalement_signalement ON traitement_signalement(id_signalement);

-- Gamification
CREATE TABLE historique_points (
  id_historique INTEGER,
  delta_points INTEGER NOT NULL,
  raison VARCHAR(100) NOT NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_utilisateur INTEGER NOT NULL,
  CONSTRAINT pk_historique_points PRIMARY KEY (id_historique),
  CONSTRAINT fk_historique_points_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  CONSTRAINT ck_delta_points_non_nul CHECK (delta_points != 0)
);

CREATE INDEX idx_historique_points_utilisateur ON historique_points(id_utilisateur);
CREATE INDEX idx_historique_points_date ON historique_points(date_creation DESC);
CREATE INDEX idx_historique_points_delta ON historique_points(delta_points DESC);
CREATE INDEX idx_historique_points_user_date ON historique_points(id_utilisateur, date_creation DESC);

CREATE TABLE notification (
  id_notification INTEGER,
  type VARCHAR(30) NOT NULL,
  titre VARCHAR(100) NOT NULL,
  corps TEXT NOT NULL,
  est_lu BOOLEAN NOT NULL DEFAULT FALSE,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_utilisateur INTEGER NOT NULL,
  CONSTRAINT pk_notification PRIMARY KEY (id_notification),
  CONSTRAINT fk_notification_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  CONSTRAINT ck_type_notification CHECK (type IN ('ALERTE', 'TOURNEE', 'BADGE', 'SYSTEME'))
);

CREATE INDEX idx_notification_utilisateur ON notification(id_utilisateur);
CREATE INDEX idx_notification_lu ON notification(est_lu);
CREATE INDEX idx_notification_date ON notification(date_creation DESC);
CREATE INDEX idx_notification_type ON notification(type);
CREATE INDEX idx_notification_user_lu_date ON notification(id_utilisateur, est_lu, date_creation DESC);

-- Historique et audit
CREATE TABLE historique_statut (
  id_historique INTEGER,
  type_entite VARCHAR(30) NOT NULL,
  ancien_statut VARCHAR(20),
  nouveau_statut VARCHAR(20) NOT NULL,
  date_changement TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_entite INTEGER NOT NULL,
  CONSTRAINT pk_historique_statut PRIMARY KEY (id_historique),
  CONSTRAINT ck_type_entite_valide CHECK (type_entite IN ('CONTENEUR', 'TOURNEE', 'SIGNALEMENT'))
);

CREATE INDEX idx_historique_statut_entite ON historique_statut(type_entite, id_entite);
CREATE INDEX idx_historique_statut_date ON historique_statut(date_changement DESC);
CREATE INDEX idx_historique_statut_nouveau ON historique_statut(nouveau_statut);

CREATE TABLE journal_audit (
  id_audit INTEGER,
  id_acteur INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  type_entite VARCHAR(30) NOT NULL,
  id_entite INTEGER,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_journal_audit PRIMARY KEY (id_audit),
  CONSTRAINT fk_journal_audit_acteur FOREIGN KEY (id_acteur) REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL
);

CREATE INDEX idx_journal_audit_acteur ON journal_audit(id_acteur);
CREATE INDEX idx_journal_audit_date ON journal_audit(date_creation DESC);
CREATE INDEX idx_journal_audit_entite ON journal_audit(type_entite, id_entite);
CREATE INDEX idx_journal_audit_action ON journal_audit(action);
CREATE INDEX idx_journal_audit_acteur_date ON journal_audit(id_acteur, date_creation DESC);

-- Alertes
CREATE TABLE alerte_capteur (
  id_alerte INTEGER,
  type_alerte VARCHAR(30) NOT NULL,
  valeur_detectee NUMERIC(8,2) NOT NULL,
  seuil NUMERIC(8,2) NOT NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_traitement TIMESTAMP,
  description VARCHAR(1000),
  id_conteneur INTEGER NOT NULL,
  CONSTRAINT pk_alerte_capteur PRIMARY KEY (id_alerte),
  CONSTRAINT fk_alerte_capteur_conteneur FOREIGN KEY (id_conteneur) REFERENCES conteneur(id_conteneur) ON DELETE CASCADE,
  CONSTRAINT ck_type_alerte_valide CHECK (type_alerte IN ('DEBORDEMENT', 'BATTERIE_FAIBLE', 'CAPTEUR_DEFAILLANT')),
  CONSTRAINT ck_statut_alerte CHECK (statut IN ('ACTIVE', 'RESOLUE', 'IGNOREE')),
  CONSTRAINT ck_valeur_seuil CHECK (valeur_detectee >= seuil)
);

CREATE INDEX idx_alerte_capteur_statut ON alerte_capteur(statut);
CREATE INDEX idx_alerte_capteur_date ON alerte_capteur(date_creation DESC);
CREATE INDEX idx_alerte_capteur_conteneur ON alerte_capteur(id_conteneur);
CREATE INDEX idx_alerte_capteur_type ON alerte_capteur(type_alerte);
CREATE INDEX idx_alerte_capteur_statut_date ON alerte_capteur(statut, date_creation DESC);
CREATE INDEX idx_alerte_capteur_conteneur_statut ON alerte_capteur(id_conteneur, statut, date_creation DESC);

-- Fin du script