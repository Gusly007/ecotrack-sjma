-- Migration: Add couleur column to zone table
-- Description: Add color field for zone visualization

ALTER TABLE zone ADD COLUMN IF NOT EXISTS couleur VARCHAR(20) DEFAULT '#3388ff';

-- Update existing zones with default color
UPDATE zone SET couleur = '#3388ff' WHERE couleur IS NULL;

-- Add check constraint for valid hex colors
ALTER TABLE zone DROP CONSTRAINT IF EXISTS zone_couleur_check;
ALTER TABLE zone ADD CONSTRAINT zone_couleur_check 
    CHECK (couleur ~* '^#[0-9A-Fa-f]{6}$');
