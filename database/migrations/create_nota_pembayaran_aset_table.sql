-- Migration: Create nota_pembayaran_aset table
-- Date: 2025-11-28
-- Description: Table to store detailed breakdown of Aset (Sumbangan Am) payments
-- Structure is different from other nota - uses Baki Awal, Terimaan, Belanja, Baki columns

CREATE TABLE IF NOT EXISTS nota_pembayaran_aset (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,
  senarai_aset VARCHAR(255) NOT NULL COMMENT 'e.g., TV, Perabot, Komputer, etc.',
  baki_awal DECIMAL(15,2) DEFAULT 0 COMMENT 'Opening balance',
  terimaan DECIMAL(15,2) DEFAULT 0 COMMENT 'Receipts/Income',
  belanja DECIMAL(15,2) DEFAULT 0 COMMENT 'Expenditure',
  -- Note: baki (closing balance) is calculated as baki_awal + terimaan - belanja
  auto_generated BOOLEAN DEFAULT FALSE COMMENT 'If generated from transactions',
  urutan INT DEFAULT 0 COMMENT 'Display order',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tahun (tahun),
  INDEX idx_senarai_aset (senarai_aset),
  UNIQUE KEY uk_tahun_senarai_aset (tahun, senarai_aset)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Summary table for Tahun Semasa vs Tahun Sebelum comparison
-- This stores the summary values (Baki Awal, Terimaan, Perbelanjaan, Baki)
CREATE TABLE IF NOT EXISTS nota_pembayaran_aset_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,
  perkara ENUM('Baki awal', 'Terimaan', 'Perbelanjaan', 'Baki') NOT NULL,
  jumlah_tahun_semasa DECIMAL(15,2) DEFAULT 0 COMMENT 'Can be auto-generated from nota_pembayaran_aset',
  jumlah_tahun_sebelum DECIMAL(15,2) DEFAULT 0 COMMENT 'Previous year value, editable by bendahari',
  auto_generated BOOLEAN DEFAULT TRUE COMMENT 'If tahun_semasa was auto-generated',
  urutan INT DEFAULT 0 COMMENT 'Display order: 1=Baki awal, 2=Terimaan, 3=Perbelanjaan, 4=Baki',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tahun (tahun),
  UNIQUE KEY uk_tahun_perkara (tahun, perkara)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data structure:
-- nota_pembayaran_aset:
--   senarai_aset values (sub-kategori pembayaran Aset):
--     TV, Perabot, Komputer, Kenderaan, Mesin, Kelengkapan Pejabat, etc.
--
-- nota_pembayaran_aset_summary:
--   perkara values (column headers from first table):
--     Baki awal (sum of all baki_awal)
--     Terimaan (sum of all terimaan)
--     Perbelanjaan (sum of all belanja)
--     Baki (sum of all calculated baki = baki_awal + terimaan - belanja)
