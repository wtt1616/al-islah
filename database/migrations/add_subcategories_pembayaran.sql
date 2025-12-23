-- Migration: Add sub-category columns for pembayaran to financial_transactions
-- Date: 2025-11-25
-- Description: Add sub_category1_pembayaran and sub_category2_pembayaran columns

ALTER TABLE financial_transactions
ADD COLUMN sub_category1_pembayaran VARCHAR(255) DEFAULT NULL AFTER category_pembayaran,
ADD COLUMN sub_category2_pembayaran VARCHAR(255) DEFAULT NULL AFTER sub_category1_pembayaran;
