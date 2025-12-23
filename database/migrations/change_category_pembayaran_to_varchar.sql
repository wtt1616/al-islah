-- Migration: Change category_pembayaran from ENUM to VARCHAR
-- This allows dynamic category names from kategori_pembayaran table
-- Date: 2025-12-19

-- Change category_pembayaran to VARCHAR to accept any category name
ALTER TABLE financial_transactions
MODIFY COLUMN category_pembayaran VARCHAR(255) DEFAULT NULL;

-- Verify the change
DESCRIBE financial_transactions;
