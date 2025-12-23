-- Migration: Expand no_kp columns for encryption
-- Date: 2025-12-21
-- Description: Expand VARCHAR(20) to VARCHAR(255) to accommodate encrypted IC numbers
-- Note: AES-256-GCM encrypted data is ~90 characters (iv:authTag:encrypted format)

-- Expand khairat_ahli.no_kp
ALTER TABLE khairat_ahli MODIFY COLUMN no_kp VARCHAR(255) NOT NULL;

-- Expand khairat_tanggungan.no_kp
ALTER TABLE khairat_tanggungan MODIFY COLUMN no_kp VARCHAR(255);

-- Verify the changes
-- DESCRIBE khairat_ahli;
-- DESCRIBE khairat_tanggungan;
