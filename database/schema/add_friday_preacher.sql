-- Migration to add friday_preacher_id column to existing preacher_schedules table
-- Run this if you already have the preacher_schedules table created

ALTER TABLE preacher_schedules
ADD COLUMN friday_preacher_id INT AFTER maghrib_preacher_id,
ADD FOREIGN KEY (friday_preacher_id) REFERENCES preachers(id) ON DELETE SET NULL,
ADD INDEX idx_friday_preacher (friday_preacher_id);
