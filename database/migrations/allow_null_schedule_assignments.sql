-- Migration: Allow NULL values for imam_id and bilal_id in schedules table
-- Date: 2025-11-22
-- Reason: Enable copy schedule functionality to handle unavailable users
--         by allowing partial schedule entries that can be filled in later

USE isar_db;

-- Modify imam_id to allow NULL
ALTER TABLE schedules
MODIFY COLUMN imam_id INT NULL;

-- Modify bilal_id to allow NULL
ALTER TABLE schedules
MODIFY COLUMN bilal_id INT NULL;

-- This allows the copy schedule feature to create schedule entries
-- with NULL values when an imam or bilal marks themselves as unavailable,
-- which the Head Imam can then fill in manually later.
