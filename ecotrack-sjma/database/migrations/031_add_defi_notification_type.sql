-- Migration 022 : Autoriser le type de notification 'DEFI' pour les
-- défis gamification complétés. Le orchestrateur enregistrerAction crée
-- désormais une notification {type:'DEFI'} quand un défi passe en TERMINE,
-- mais la contrainte ck_type_notification d'origine (migration 007) ne
-- listait que ALERTE / TOURNEE / BADGE / SYSTEME → INSERT échouait et
-- faisait rollback de toute la transaction d'action (points + défis).
ALTER TABLE notification
  DROP CONSTRAINT IF EXISTS ck_type_notification;

ALTER TABLE notification
  ADD CONSTRAINT ck_type_notification
  CHECK (type::text = ANY (ARRAY[
    'ALERTE'::varchar,
    'TOURNEE'::varchar,
    'BADGE'::varchar,
    'SYSTEME'::varchar,
    'DEFI'::varchar,
    'ADMIN_ALERTE'::varchar,
    'ADMIN_SERVICE'::varchar,
    'ADMIN_SEUIL'::varchar,
    'ADMIN_ML'::varchar,
    'ADMIN_SECURITE'::varchar,
    'ADMIN_PERFORMANCE'::varchar,
    'ADMIN_IOT'::varchar
  ]::text[]));
