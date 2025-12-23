-- Migration: Add bank information to preachers table
-- Date: 2025-12-04
-- Description: Add nama_bank and no_akaun columns for preacher payment info

ALTER TABLE preachers
ADD COLUMN nama_bank VARCHAR(100) NULL AFTER phone,
ADD COLUMN no_akaun VARCHAR(50) NULL AFTER nama_bank;
