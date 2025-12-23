-- Migration: Create nota_pembayaran_dakwah table
-- Date: 2025-11-28
-- Description: Table to store detailed breakdown of Dakwah dan Pengimarahan payments

CREATE TABLE IF NOT EXISTS nota_pembayaran_dakwah (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,
  perkara VARCHAR(255) NOT NULL COMMENT 'Program hari kebesaran islam, Pengajian bersijil, Ibadah korban, etc.',
  jumlah_tahun_semasa DECIMAL(15,2) DEFAULT 0,
  jumlah_tahun_sebelum DECIMAL(15,2) DEFAULT 0,
  auto_generated BOOLEAN DEFAULT TRUE COMMENT 'If generated from transactions',
  urutan INT DEFAULT 0 COMMENT 'Display order',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tahun (tahun),
  INDEX idx_perkara (perkara),
  UNIQUE KEY uk_tahun_perkara (tahun, perkara)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data structure:
-- perkara values:
--   Program hari kebesaran islam
--   Pengajian bersijil
--   Ibadah korban
--   Ihya Ramadhan/Idulfitri
--   Dakwah non muslim
--   Program muslimat
--   Program kanak-kanak / remaja
--   Program interaktif
--   Kuliah/Tazkirah
