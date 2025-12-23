-- Migration: Add Dhuha Preacher
-- Date: 2025-11-20
-- Description: Add dhuha_preacher_id for Saturday and Sunday schedules

-- Add dhuha_preacher_id column to preacher_schedules table (ignore error if exists)
ALTER TABLE preacher_schedules
ADD COLUMN dhuha_preacher_id INT NULL AFTER subuh_preacher_id;
