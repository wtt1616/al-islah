-- Migration: Add Budget/Anggaran Table
-- Date: 2025-11-23
-- Description: Add table for storing annual budget data for BR-KMS-001 report

-- Table for storing annual budgets (Anggaran Penerimaan dan Pembayaran)
CREATE TABLE IF NOT EXISTS budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year SMALLINT NOT NULL,
  masjid_name VARCHAR(255) DEFAULT 'MASJID/SURAU',

  -- PENERIMAAN (Income) - Column 1
  sumbangan_am_1 DECIMAL(15, 2) DEFAULT 0.00,
  sumbangan_khas_amanah_1 DECIMAL(15, 2) DEFAULT 0.00,
  hasil_sewaan_ekonomi_1 DECIMAL(15, 2) DEFAULT 0.00,
  tahlil_1 DECIMAL(15, 2) DEFAULT 0.00,
  sumbangan_elaun_1 DECIMAL(15, 2) DEFAULT 0.00,
  hibah_pelaburan_1 DECIMAL(15, 2) DEFAULT 0.00,
  deposit_1 DECIMAL(15, 2) DEFAULT 0.00,
  hibah_bank_1 DECIMAL(15, 2) DEFAULT 0.00,
  lain_terimaan_1 DECIMAL(15, 2) DEFAULT 0.00,

  -- PENERIMAAN (Income) - Column 2
  sumbangan_am_2 DECIMAL(15, 2) DEFAULT 0.00,
  sumbangan_khas_amanah_2 DECIMAL(15, 2) DEFAULT 0.00,
  hasil_sewaan_ekonomi_2 DECIMAL(15, 2) DEFAULT 0.00,
  tahlil_2 DECIMAL(15, 2) DEFAULT 0.00,
  sumbangan_elaun_2 DECIMAL(15, 2) DEFAULT 0.00,
  hibah_pelaburan_2 DECIMAL(15, 2) DEFAULT 0.00,
  deposit_2 DECIMAL(15, 2) DEFAULT 0.00,
  hibah_bank_2 DECIMAL(15, 2) DEFAULT 0.00,
  lain_terimaan_2 DECIMAL(15, 2) DEFAULT 0.00,

  -- PEMBAYARAN (Expenses) - Column 1
  pentadbiran_1 DECIMAL(15, 2) DEFAULT 0.00,
  pengurusan_sumber_manusia_1 DECIMAL(15, 2) DEFAULT 0.00,
  pembangunan_penyelenggaraan_1 DECIMAL(15, 2) DEFAULT 0.00,
  dakwah_pengimarahan_1 DECIMAL(15, 2) DEFAULT 0.00,
  khidmat_sosial_1 DECIMAL(15, 2) DEFAULT 0.00,
  pembelian_aset_1 DECIMAL(15, 2) DEFAULT 0.00,
  perbelanjaan_khas_amanah_1 DECIMAL(15, 2) DEFAULT 0.00,
  pelbagai_1 DECIMAL(15, 2) DEFAULT 0.00,

  -- PEMBAYARAN (Expenses) - Column 2
  pentadbiran_2 DECIMAL(15, 2) DEFAULT 0.00,
  pengurusan_sumber_manusia_2 DECIMAL(15, 2) DEFAULT 0.00,
  pembangunan_penyelenggaraan_2 DECIMAL(15, 2) DEFAULT 0.00,
  dakwah_pengimarahan_2 DECIMAL(15, 2) DEFAULT 0.00,
  khidmat_sosial_2 DECIMAL(15, 2) DEFAULT 0.00,
  pembelian_aset_2 DECIMAL(15, 2) DEFAULT 0.00,
  perbelanjaan_khas_amanah_2 DECIMAL(15, 2) DEFAULT 0.00,
  pelbagai_2 DECIMAL(15, 2) DEFAULT 0.00,

  -- Metadata
  prepared_by INT DEFAULT NULL, -- Bendahari
  approved_by INT DEFAULT NULL, -- Nazir
  status ENUM('draft', 'submitted', 'approved') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (prepared_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  UNIQUE KEY unique_year_budget (year),
  INDEX idx_year (year),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
