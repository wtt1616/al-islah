-- Migration: Create table for Nota Butiran Penerimaan Deposit Diterima/Wang Cagaran
-- This stores the breakdown of Deposit receipts by deposit type

CREATE TABLE IF NOT EXISTS nota_penerimaan_deposit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,                              -- Year this record applies to
  deposit VARCHAR(255) NOT NULL,                   -- Deposit type (Sewa Dewan, Sewa Peralatan, etc.)
  tarikh DATE,                                     -- Date of deposit
  jumlah_tahun_semasa DECIMAL(15,2) DEFAULT 0,     -- Current year amount
  jumlah_tahun_sebelum DECIMAL(15,2) DEFAULT 0,    -- Previous year amount
  auto_generated BOOLEAN DEFAULT TRUE,             -- Whether values are auto-calculated
  urutan INT DEFAULT 0,                            -- Display order
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_tahun (tahun),
  UNIQUE KEY unique_tahun_deposit (tahun, deposit)
);

-- Add deposit_type column to financial_transactions if it doesn't exist
-- This will store the specific deposit type for categorizing transactions
ALTER TABLE financial_transactions
ADD COLUMN IF NOT EXISTS deposit_type VARCHAR(255) DEFAULT NULL AFTER investment_institution;
