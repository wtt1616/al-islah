-- Migration: Create nota_pembayaran_khidmat_sosial table
-- Date: 2025-11-28
-- Description: Table to store detailed breakdown of Khidmat Sosial dan Kemasyarakatan payments

CREATE TABLE IF NOT EXISTS nota_pembayaran_khidmat_sosial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,
  perkara VARCHAR(255) NOT NULL COMMENT 'Anak Yatim, Khairat Kematian, Pendidikan, Asnaf, Kebajikan, etc.',
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
--   Anak Yatim
--   Khairat Kematian
--   Pendidikan
--   Asnaf
--   Kebajikan
--   Pemulihan Akidah
--   Program Agensi / Korporat
--   Program Lapangan
