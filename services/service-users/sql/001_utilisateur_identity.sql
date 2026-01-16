-- Active: 1767888629669@@127.0.0.1@5432@ecotrack_prod
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'utilisateur_id_utilisateur_seq') THEN
    CREATE SEQUENCE utilisateur_id_utilisateur_seq START WITH 1 INCREMENT BY 1;
  END IF;

  EXECUTE 'ALTER TABLE UTILISATEUR ALTER COLUMN id_utilisateur SET DEFAULT nextval(''utilisateur_id_utilisateur_seq'')';
  BEGIN
    ALTER TABLE UTILISATEUR ADD PRIMARY KEY (id_utilisateur);
  EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
  END;
END$$;

SELECT setval('utilisateur_id_utilisateur_seq', COALESCE((SELECT MAX(id_utilisateur) FROM UTILISATEUR),0)+1, false);