-- Migration: Add Preacher Photo
-- Date: 2025-11-20
-- Description: Add photo field to preachers table for displaying preacher images in schedules

-- Add photo column to preachers table (ignore error if exists)
ALTER TABLE preachers
ADD COLUMN photo VARCHAR(255) NULL AFTER name;

-- Update existing records to have NULL photo (optional, already default)
-- Note: Photos will be stored in /uploads/preachers/ directory
-- Recommended photo size: 150x150 pixels for optimal display and printing
