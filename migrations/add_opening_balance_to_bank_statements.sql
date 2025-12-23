-- Migration: Add Opening Balance to Bank Statements
-- Date: 2025-11-24
-- Description: Add opening_balance field to bank_statements table for accurate Buku Tunai reporting

-- Add opening_balance column to bank_statements table
ALTER TABLE bank_statements
ADD COLUMN opening_balance DECIMAL(15,2) DEFAULT 0.00 AFTER total_transactions;

-- Add comment
ALTER TABLE bank_statements
MODIFY COLUMN opening_balance DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Baki awal bulan (opening balance from previous month)';

-- Update existing records to have 0.00 as opening balance (can be updated later by Bendahari)
UPDATE bank_statements SET opening_balance = 0.00 WHERE opening_balance IS NULL;
