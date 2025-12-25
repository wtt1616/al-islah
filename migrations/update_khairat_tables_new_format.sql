-- Migration: Update khairat tables for new Excel format
-- Date: 2025-12-26
-- Description: Add new columns and update enums to support new khairat-al-islah.xlsx format

-- 1. Add new columns to khairat_ahli
ALTER TABLE khairat_ahli
ADD COLUMN IF NOT EXISTS tarikh_lahir DATE NULL AFTER no_kp,
ADD COLUMN IF NOT EXISTS jantina ENUM('Lelaki', 'Perempuan') NULL AFTER umur,
ADD COLUMN IF NOT EXISTS taman VARCHAR(255) NULL AFTER alamat,
ADD COLUMN IF NOT EXISTS cara_bayaran VARCHAR(100) NULL AFTER amaun_bayaran,
ADD COLUMN IF NOT EXISTS catatan TEXT NULL AFTER cara_bayaran,
ADD COLUMN IF NOT EXISTS bil_excel INT NULL AFTER id;

-- 2. Modify pertalian enum in khairat_tanggungan to include more options
ALTER TABLE khairat_tanggungan
MODIFY COLUMN pertalian ENUM('isteri', 'suami', 'pasangan', 'anak', 'anak_oku', 'ibu', 'bapa') NOT NULL;

-- 3. Add jantina column to khairat_tanggungan
ALTER TABLE khairat_tanggungan
ADD COLUMN IF NOT EXISTS tarikh_lahir DATE NULL AFTER no_kp,
ADD COLUMN IF NOT EXISTS jantina ENUM('Lelaki', 'Perempuan') NULL AFTER umur;

-- 4. Expand no_kp column to accommodate encrypted data (if encryption is used)
ALTER TABLE khairat_ahli MODIFY COLUMN no_kp VARCHAR(255) NOT NULL;
ALTER TABLE khairat_tanggungan MODIFY COLUMN no_kp VARCHAR(255) NULL;
