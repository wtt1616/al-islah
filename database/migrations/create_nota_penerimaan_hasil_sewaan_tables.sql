-- Migration: Create nota_penerimaan_hasil_sewaan tables
-- Date: 2025-11-28
-- Description: Tables to store Nota 6. Hasil Sewaan / Penjanaan Ekonomi
-- Three tables: main data, yuran penagajian, and summary

-- Table 1: Main data (Perkara with Tahun Semasa and Tahun Sebelum)
CREATE TABLE IF NOT EXISTS nota_penerimaan_hasil_sewaan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,
  perkara VARCHAR(255) NOT NULL COMMENT 'Sub-kategori: Telekomunikasi, Tanah/Bangunan/Tapak, Fasiliti Dan Peralatan',
  jumlah_tahun_semasa DECIMAL(15,2) DEFAULT 0,
  jumlah_tahun_sebelum DECIMAL(15,2) DEFAULT 0,
  auto_generated BOOLEAN DEFAULT FALSE COMMENT 'If generated from transactions',
  urutan INT DEFAULT 0 COMMENT 'Display order',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tahun (tahun),
  INDEX idx_perkara (perkara),
  UNIQUE KEY uk_tahun_perkara (tahun, perkara)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: Yuran Penagajian Dan Aktiviti (with Baki Awal, Terimaan, Belanja, Baki)
CREATE TABLE IF NOT EXISTS nota_penerimaan_hasil_sewaan_yuran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,
  yuran_aktiviti VARCHAR(255) NOT NULL COMMENT 'Sub-kategori: Telekomunikasi, Tanah/Bangunan/Tapak, Fasiliti Dan Peralatan',
  baki_awal DECIMAL(15,2) DEFAULT 0 COMMENT 'Opening balance',
  terimaan DECIMAL(15,2) DEFAULT 0 COMMENT 'Receipts/Income',
  belanja DECIMAL(15,2) DEFAULT 0 COMMENT 'Expenditure',
  -- Note: baki (closing balance) is calculated as baki_awal + terimaan - belanja
  urutan INT DEFAULT 0 COMMENT 'Display order',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tahun (tahun),
  INDEX idx_yuran_aktiviti (yuran_aktiviti),
  UNIQUE KEY uk_tahun_yuran (tahun, yuran_aktiviti)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: Summary (Perkara = column headers from Table 2, with Tahun Semasa and Tahun Sebelumnya)
CREATE TABLE IF NOT EXISTS nota_penerimaan_hasil_sewaan_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,
  perkara ENUM('Baki awal', 'Terimaan', 'Perbelanjaan', 'Baki') NOT NULL,
  jumlah_tahun_semasa DECIMAL(15,2) DEFAULT 0 COMMENT 'Can be auto-generated from yuran table',
  jumlah_tahun_sebelum DECIMAL(15,2) DEFAULT 0 COMMENT 'Previous year value, editable by bendahari',
  auto_generated BOOLEAN DEFAULT TRUE COMMENT 'If tahun_semasa was auto-generated',
  urutan INT DEFAULT 0 COMMENT 'Display order: 1=Baki awal, 2=Terimaan, 3=Perbelanjaan, 4=Baki',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tahun (tahun),
  UNIQUE KEY uk_tahun_perkara (tahun, perkara)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data structure:
-- Table 1 perkara values (sub-kategori penerimaan Hasil Sewaan):
--   Telekomunikasi
--   Tanah/ Bangunan / Tapak
--   Fasiliti Dan Peralatan
--
-- Table 2 yuran_aktiviti values (same as Table 1):
--   Telekomunikasi
--   Tanah/ Bangunan / Tapak
--   Fasiliti Dan Peralatan
--
-- Table 3 perkara values (column headers from Table 2):
--   Baki awal (sum of all baki_awal)
--   Terimaan (sum of all terimaan)
--   Perbelanjaan (sum of all belanja)
--   Baki (sum of all calculated baki)
