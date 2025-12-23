-- Migration: Add resit_file column to khairat_ahli table
-- Date: 2025-12-04
-- Description: Add column to store receipt file path for payment proof

ALTER TABLE khairat_ahli
ADD COLUMN resit_file VARCHAR(500) NULL AFTER no_resit;

-- Add comment for clarity
-- resit_file stores the path to the uploaded receipt file (e.g., /uploads/khairat/receipt_123_timestamp.jpg)
