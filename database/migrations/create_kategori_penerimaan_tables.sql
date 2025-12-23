-- Migration: Create Tables for Dynamic Penerimaan Categories and Sub-Categories
-- Date: 2025-11-25
-- Description: Allow bendahari to manage penerimaan categories and sub-categories dynamically

-- Table for main Penerimaan categories
CREATE TABLE IF NOT EXISTS kategori_penerimaan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_kategori VARCHAR(255) NOT NULL UNIQUE,
  kod_kategori VARCHAR(50) NOT NULL UNIQUE,
  penerangan TEXT,
  ada_subkategori BOOLEAN DEFAULT FALSE,
  perlu_maklumat_pelaburan BOOLEAN DEFAULT FALSE,
  aktif BOOLEAN DEFAULT TRUE,
  urutan INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_aktif (aktif),
  INDEX idx_kod_kategori (kod_kategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for sub-categories
CREATE TABLE IF NOT EXISTS subkategori_penerimaan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kategori_id INT NOT NULL,
  nama_subkategori VARCHAR(255) NOT NULL,
  kod_subkategori VARCHAR(50) NOT NULL,
  penerangan TEXT,
  aktif BOOLEAN DEFAULT TRUE,
  urutan INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES kategori_penerimaan(id) ON DELETE CASCADE,
  INDEX idx_kategori_id (kategori_id),
  INDEX idx_aktif (aktif),
  UNIQUE KEY unique_subkategori (kategori_id, nama_subkategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed initial categories (based on existing system)
INSERT INTO kategori_penerimaan (nama_kategori, kod_kategori, penerangan, ada_subkategori, perlu_maklumat_pelaburan, urutan) VALUES
('Sumbangan Am', 'SUMB_AM', 'Sumbangan am daripada masyarakat', TRUE, FALSE, 1),
('Sumbangan Khas (Amanah)', 'SUMB_KHAS', 'Sumbangan khas untuk tujuan tertentu', TRUE, FALSE, 2),
('Hasil Sewaan/Penjanaan Ekonomi', 'HASIL_SEWA', 'Pendapatan daripada sewaan dan penjanaan ekonomi', TRUE, FALSE, 3),
('Tahlil', 'TAHLIL', 'Penerimaan daripada majlis tahlil', FALSE, FALSE, 4),
('Sumbangan Elaun', 'SUMB_ELAUN', 'Elaun untuk kakitangan masjid', TRUE, FALSE, 5),
('Hibah Pelaburan', 'HIBAH_PELABURAN', 'Pendapatan daripada pelaburan', FALSE, TRUE, 6),
('Deposit', 'DEPOSIT', 'Deposit dan wang jaminan', FALSE, FALSE, 7),
('Hibah Bank', 'HIBAH_BANK', 'Hibah atau faedah daripada bank', FALSE, FALSE, 8),
('Lain-lain Terimaan', 'LAIN_LAIN', 'Terimaan lain yang tidak dikategorikan', FALSE, FALSE, 9);

-- Seed sub-categories for Sumbangan Am
INSERT INTO subkategori_penerimaan (kategori_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_AM'), 'Kutipan Jumaat', 'KUT_JUMAAT', 1),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_AM'), 'Kutipan Harian', 'KUT_HARIAN', 2),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_AM'), 'Kutipan Hari Raya', 'KUT_RAYA', 3),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_AM'), 'Sumbangan Agensi/Korporat/Syarikat/Yayasan', 'SUMB_KORPORAT', 4),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_AM'), 'Tahlil dan Doa Selamat', 'TAHLIL_DOA', 5),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_AM'), 'Aktiviti dan Pengimarahan', 'AKTIVITI', 6);

-- Seed sub-categories for Sumbangan Khas (Amanah)
INSERT INTO subkategori_penerimaan (kategori_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_KHAS'), 'Khairat Kematian', 'KHAIRAT', 1),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_KHAS'), 'Pembangunan & Selenggara Wakaf', 'WAKAF', 2),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_KHAS'), 'Yuran Pengajian', 'YURAN', 3),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_KHAS'), 'Pendidikan', 'PENDIDIKAN', 4),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_KHAS'), 'Ihya Ramadhan', 'RAMADHAN', 5),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_KHAS'), 'Ibadah Qurban', 'QURBAN', 6),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_KHAS'), 'Bantuan Bencana', 'BENCANA', 7),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_KHAS'), 'Anak Yatim', 'YATIM', 8);

-- Seed sub-categories for Hasil Sewaan/Penjanaan Ekonomi
INSERT INTO subkategori_penerimaan (kategori_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'HASIL_SEWA'), 'Telekomunikasi', 'TELEKOM', 1),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'HASIL_SEWA'), 'Tanah/Bangunan/Tapak', 'TANAH', 2),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'HASIL_SEWA'), 'Fasiliti dan Peralatan', 'FASILITI', 3),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'HASIL_SEWA'), 'Kitar Semula', 'KITAR_SEMULA', 4),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'HASIL_SEWA'), 'Solar', 'SOLAR', 5),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'HASIL_SEWA'), 'Jualan Kopiah', 'KOPIAH', 6);

-- Seed sub-categories for Sumbangan Elaun
INSERT INTO subkategori_penerimaan (kategori_id, nama_subkategori, kod_subkategori, urutan) VALUES
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_ELAUN'), 'Nazir', 'NAZIR', 1),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_ELAUN'), 'Imam 1', 'IMAM1', 2),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_ELAUN'), 'Imam 2', 'IMAM2', 3),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_ELAUN'), 'Bilal 1', 'BILAL1', 4),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_ELAUN'), 'Bilal 2', 'BILAL2', 5),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_ELAUN'), 'Siak 1', 'SIAK1', 6),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_ELAUN'), 'Siak 2', 'SIAK2', 7),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_ELAUN'), 'Timbalan Nazir', 'TIM_NAZIR', 8),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_ELAUN'), 'Setiausaha', 'SETIA', 9),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_ELAUN'), 'Penolong Setiausaha', 'PENOLONG_SETIA', 10),
((SELECT id FROM kategori_penerimaan WHERE kod_kategori = 'SUMB_ELAUN'), 'Bendahari', 'BENDAHARI', 11);
