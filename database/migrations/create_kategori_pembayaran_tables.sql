-- Migration: Create Tables for Dynamic Pembayaran Categories and Sub-Categories
-- Date: 2025-11-25
-- Description: Allow bendahari to manage pembayaran categories with sub-kategori1 and sub-kategori2

-- Table for main Pembayaran categories
CREATE TABLE IF NOT EXISTS kategori_pembayaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_kategori VARCHAR(255) NOT NULL UNIQUE,
  kod_kategori VARCHAR(50) NOT NULL UNIQUE,
  penerangan TEXT,
  aktif BOOLEAN DEFAULT TRUE,
  urutan INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_aktif (aktif),
  INDEX idx_kod_kategori (kod_kategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for sub-kategori1 (first level sub-category)
CREATE TABLE IF NOT EXISTS subkategori1_pembayaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kategori_id INT NOT NULL,
  nama_subkategori VARCHAR(255) NOT NULL,
  kod_subkategori VARCHAR(50) NOT NULL,
  penerangan TEXT,
  aktif BOOLEAN DEFAULT TRUE,
  urutan INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES kategori_pembayaran(id) ON DELETE CASCADE,
  INDEX idx_kategori_id (kategori_id),
  INDEX idx_aktif (aktif),
  UNIQUE KEY unique_subkategori1 (kategori_id, nama_subkategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for sub-kategori2 (second level sub-category)
CREATE TABLE IF NOT EXISTS subkategori2_pembayaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subkategori1_id INT NOT NULL,
  nama_subkategori VARCHAR(255) NOT NULL,
  kod_subkategori VARCHAR(50) NOT NULL,
  penerangan TEXT,
  aktif BOOLEAN DEFAULT TRUE,
  urutan INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subkategori1_id) REFERENCES subkategori1_pembayaran(id) ON DELETE CASCADE,
  INDEX idx_subkategori1_id (subkategori1_id),
  INDEX idx_aktif (aktif),
  UNIQUE KEY unique_subkategori2 (subkategori1_id, nama_subkategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed main Pembayaran categories
INSERT INTO kategori_pembayaran (nama_kategori, kod_kategori, penerangan, urutan) VALUES
('Pentadbiran', 'PENTADBIRAN', 'Perbelanjaan pentadbiran masjid', 1),
('Pengurusan Sumber Manusia', 'PSM', 'Perbelanjaan berkaitan kakitangan', 2),
('Pembangunan dan Penyelenggaraan', 'PEMBANGUNAN', 'Pembinaan dan penyelenggaraan bangunan/aset', 3),
('Dakwah dan Pengimarahan', 'DAKWAH', 'Program dakwah dan keagamaan', 4),
('Khidmat Sosial dan Kemasyarakatan', 'KHIDMAT_SOSIAL', 'Bantuan dan program kemasyarakatan', 5),
('Aset', 'ASET', 'Pembelian aset dan peralatan', 6),
('Perbelanjaan Khas', 'PERBELANJAAN_KHAS', 'Perbelanjaan khas (amanah)', 7),
('Pelbagai', 'PELBAGAI', 'Perbelanjaan pelbagai lain', 8);

-- Seed sub-kategori1 for Pentadbiran
INSERT INTO subkategori1_pembayaran (kategori_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'PENTADBIRAN'), 'Utiliti', 'UTILITI', 1),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'PENTADBIRAN'), 'Perkhidmatan Keselamatan', 'KESELAMATAN', 2),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'PENTADBIRAN'), 'Khidmat Perunding', 'PERUNDING', 3),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'PENTADBIRAN'), 'Perkhidmatan Pembersihan/Landskap', 'PEMBERSIHAN', 4),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'PENTADBIRAN'), 'Pengurusan Pejabat', 'PEJABAT', 5),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'PENTADBIRAN'), 'Pentadbiran', 'PENTADBIRAN_AM', 6);

-- Seed sub-kategori1 for Pengurusan Sumber Manusia
INSERT INTO subkategori1_pembayaran (kategori_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'PSM'), 'Emolumen', 'EMOLUMEN', 1),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'PSM'), 'Kebajikan', 'KEBAJIKAN_PSM', 2),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'PSM'), 'Pengurusan Sumber Manusia', 'PSM_AM', 3);

-- Seed sub-kategori1 for Pembangunan dan Penyelenggaraan
INSERT INTO subkategori1_pembayaran (kategori_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'PEMBANGUNAN'), 'Pembinaan dan Baik Pulih', 'PEMBINAAN', 1),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'PEMBANGUNAN'), 'Penyelenggaraan Bangunan', 'SELENGGARA_BANGUNAN', 2),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'PEMBANGUNAN'), 'Penyelenggaraan Aset dan Kelengkapan', 'SELENGGARA_ASET', 3);

-- Seed sub-kategori1 for Dakwah dan Pengimarahan
INSERT INTO subkategori1_pembayaran (kategori_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'DAKWAH'), 'Program Hari Kebesaran Islam', 'HARI_KEBESARAN', 1),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'DAKWAH'), 'Pengajian Bersijil', 'PENGAJIAN', 2),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'DAKWAH'), 'Dakwah Non-Muslim', 'DAKWAH_NON_MUSLIM', 3),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'DAKWAH'), 'Program Muslimat', 'MUSLIMAT', 4),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'DAKWAH'), 'Program Kanak-kanak/Remaja', 'KANAK_REMAJA', 5),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'DAKWAH'), 'Program Interaktif', 'INTERAKTIF', 6),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'DAKWAH'), 'Kuliah/Tazkirah', 'KULIAH', 7);

-- Seed sub-kategori1 for Khidmat Sosial dan Kemasyarakatan
INSERT INTO subkategori1_pembayaran (kategori_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'KHIDMAT_SOSIAL'), 'Anak Yatim', 'ANAK_YATIM', 1),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'KHIDMAT_SOSIAL'), 'Khairat Kematian', 'KHAIRAT', 2),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'KHIDMAT_SOSIAL'), 'Pendidikan', 'PENDIDIKAN_SOSIAL', 3),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'KHIDMAT_SOSIAL'), 'Asnaf', 'ASNAF', 4),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'KHIDMAT_SOSIAL'), 'Kebajikan', 'KEBAJIKAN_SOSIAL', 5),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'KHIDMAT_SOSIAL'), 'Pemulihan Akidah', 'PEMULIHAN_AKIDAH', 6),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'KHIDMAT_SOSIAL'), 'Program Agensi/Korporat', 'AGENSI_KORPORAT', 7),
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'KHIDMAT_SOSIAL'), 'Program Lapangan', 'LAPANGAN', 8);

-- Seed sub-kategori1 for Aset
INSERT INTO subkategori1_pembayaran (kategori_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM kategori_pembayaran WHERE kod_kategori = 'ASET'), 'Keperluan Modal/Peralatan', 'MODAL_PERALATAN', 1);

-- Seed sub-kategori2 for Pentadbiran > Utiliti
INSERT INTO subkategori2_pembayaran (subkategori1_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'UTILITI'), 'TNB', 'TNB', 1),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'UTILITI'), 'Syarikat Air Selangor', 'AIR_SELANGOR', 2),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'UTILITI'), 'UNIFI', 'UNIFI', 3);

-- Seed sub-kategori2 for Pentadbiran > Perkhidmatan Keselamatan
INSERT INTO subkategori2_pembayaran (subkategori1_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'KESELAMATAN'), 'Kawalan Keselamatan', 'KAWALAN', 1),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'KESELAMATAN'), 'Rela', 'RELA', 2),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'KESELAMATAN'), 'Perkhidmatan Kawalan Bank', 'KAWALAN_BANK', 3),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'KESELAMATAN'), 'Caruman Insuran Perlindungan', 'INSURAN_PERLINDUNGAN', 4);

-- Seed sub-kategori2 for Pentadbiran > Khidmat Perunding
INSERT INTO subkategori2_pembayaran (subkategori1_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'PERUNDING'), 'Perunding Profesional', 'PERUNDING_PRO', 1),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'PERUNDING'), 'Bayaran Firma Audit', 'FIRMA_AUDIT', 2),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'PERUNDING'), 'Bayaran Sistem Perakaunan', 'SISTEM_PERAKAUNAN', 3);

-- Seed sub-kategori2 for Pentadbiran > Pentadbiran
INSERT INTO subkategori2_pembayaran (subkategori1_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'PENTADBIRAN_AM'), 'Utiliti', 'PENTADBIRAN_UTILITI', 1),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'PENTADBIRAN_AM'), 'Perkhidmatan Keselamatan', 'PENTADBIRAN_KESELAMATAN', 2),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'PENTADBIRAN_AM'), 'Khidmat Perunding', 'PENTADBIRAN_PERUNDING', 3),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'PENTADBIRAN_AM'), 'Perkhidmatan Pembersihan/Landskap', 'PENTADBIRAN_PEMBERSIHAN', 4),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'PENTADBIRAN_AM'), 'Pengurusan Pejabat', 'PENTADBIRAN_PEJABAT', 5);

-- Seed sub-kategori2 for Pengurusan Sumber Manusia > Emolumen
INSERT INTO subkategori2_pembayaran (subkategori1_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'EMOLUMEN'), 'Pengurus', 'PENGURUS', 1),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'EMOLUMEN'), 'Penolong Pengurus', 'PENOLONG_PENGURUS', 2),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'EMOLUMEN'), 'Setiausaha', 'SETIAUSAHA', 3),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'EMOLUMEN'), 'Imam 1', 'IMAM_1', 4),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'EMOLUMEN'), 'Bendahari', 'BENDAHARI_EMOLUMEN', 5);

-- Seed sub-kategori2 for Pengurusan Sumber Manusia > Kebajikan
INSERT INTO subkategori2_pembayaran (subkategori1_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'KEBAJIKAN_PSM'), 'Bantuan Musibah', 'BANTUAN_MUSIBAH', 1),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'KEBAJIKAN_PSM'), 'Bantuan Perubatan', 'BANTUAN_PERUBATAN', 2),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'KEBAJIKAN_PSM'), 'Bantuan-bantuan Khas', 'BANTUAN_KHAS', 3),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'KEBAJIKAN_PSM'), 'Caruman Insuran', 'CARUMAN_INSURAN', 4);

-- Seed sub-kategori2 for Pengurusan Sumber Manusia > PSM
INSERT INTO subkategori2_pembayaran (subkategori1_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'PSM_AM'), 'Emolumen', 'PSM_EMOLUMEN', 1),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'PSM_AM'), 'Kebajikan', 'PSM_KEBAJIKAN', 2),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'PSM_AM'), 'Keraian dan Hospitaliti', 'KERAIAN', 3),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'PSM_AM'), 'Kursus dan Latihan', 'KURSUS_LATIHAN', 4);

-- Seed sub-kategori2 for Aset > Keperluan Modal/Peralatan
INSERT INTO subkategori2_pembayaran (subkategori1_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'MODAL_PERALATAN'), 'TV', 'TV', 1),
((SELECT id FROM subkategori1_pembayaran WHERE kod_subkategori = 'MODAL_PERALATAN'), 'Perabot', 'PERABOT', 2);
