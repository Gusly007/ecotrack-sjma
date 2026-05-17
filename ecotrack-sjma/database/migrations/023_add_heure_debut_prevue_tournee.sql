-- Migration: Add heure_debut_prevue column to tournees table
-- This file was re-created as a placeholder because the original was missing
-- from the migrations directory while still tracked in pgmigrations.
-- The ALTER is guarded so it is safe to run even if already applied.

ALTER TABLE tournee ADD COLUMN IF NOT EXISTS heure_debut_prevue TIME;
