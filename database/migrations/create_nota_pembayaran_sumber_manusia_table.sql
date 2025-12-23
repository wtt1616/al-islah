-- Migration: Create nota_pembayaran_sumber_manusia table
-- Date: 2025-11-28
-- Description: Table to store detailed breakdown of HR payments (Pengurusan Sumber Manusia)

CREATE TABLE IF NOT EXISTS nota_pembayaran_sumber_manusia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,
  sub_kategori1 VARCHAR(255) NOT NULL COMMENT 'Emolumen, Kebajikan, Keraian Dan Hospitaliti, Kursus Dan Latihan',
  sub_kategori1_kod CHAR(1) NOT NULL COMMENT 'a, b, c, d',
  sub_kategori2 VARCHAR(255) NOT NULL COMMENT 'Specific item like Pengurus, Bantuan Musibah, etc.',
  jumlah_tahun_semasa DECIMAL(15,2) DEFAULT 0,
  jumlah_tahun_sebelum DECIMAL(15,2) DEFAULT 0,
  auto_generated BOOLEAN DEFAULT TRUE COMMENT 'If generated from transactions',
  urutan INT DEFAULT 0 COMMENT 'Display order',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tahun (tahun),
  INDEX idx_sub_kategori1 (sub_kategori1),
  INDEX idx_sub_kategori1_kod (sub_kategori1_kod),
  UNIQUE KEY uk_tahun_subkat (tahun, sub_kategori1_kod, sub_kategori2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data structure:
-- For sub_kategori1 = 'Emolumen' (kod 'a'), sub_kategori2 values:
--   Pengurus, Penolong Pengurus, Setiausaha, Imam 1, Bendahari
-- For sub_kategori1 = 'Kebajikan' (kod 'b'), sub_kategori2 values:
--   Bantuan Musibah, Bantuan Perubatan, Bantuan-Bantuan Khas, Caruman Insuran
-- For sub_kategori1 = 'Keraian Dan Hospitaliti' (kod 'c'), sub_kategori2 values:
--   (user-defined items)
-- For sub_kategori1 = 'Kursus Dan Latihan' (kod 'd'), sub_kategori2 values:
--   (user-defined items)
