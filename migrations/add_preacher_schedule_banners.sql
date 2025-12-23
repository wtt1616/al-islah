-- Migration: Add banner columns to preacher_schedules table
-- Date: 2025-12-13
-- Description: Allow upload banner/poster for each kuliah slot

ALTER TABLE preacher_schedules
ADD COLUMN subuh_banner VARCHAR(500) NULL COMMENT 'Banner image URL for Kuliah Subuh',
ADD COLUMN dhuha_banner VARCHAR(500) NULL COMMENT 'Banner image URL for Kuliah Dhuha',
ADD COLUMN maghrib_banner VARCHAR(500) NULL COMMENT 'Banner image URL for Kuliah Maghrib',
ADD COLUMN friday_banner VARCHAR(500) NULL COMMENT 'Banner image URL for Tazkirah Jumaat',
ADD COLUMN friday_dhuha_banner VARCHAR(500) NULL COMMENT 'Banner image URL for Kuliah Dhuha Jumaat';
