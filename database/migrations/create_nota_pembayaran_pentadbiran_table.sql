-- Migration: Create table for Nota Butiran Pembayaran Pentadbiran
-- This stores the breakdown of Pentadbiran payments by sub-category1 and sub-category2
-- Structure: 11. Pentadbiran -> a. Utiliti, b. Perkhidmatan Keselamatan, c. Khidmat Perunding, etc.

CREATE TABLE IF NOT EXISTS nota_pembayaran_pentadbiran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,                              -- Year this record applies to
  sub_kategori1 VARCHAR(255) NOT NULL,             -- Sub-category 1 (Utiliti, Perkhidmatan Keselamatan, etc.)
  sub_kategori1_kod CHAR(1) NOT NULL,              -- Code (a, b, c, d, e)
  sub_kategori2 VARCHAR(255) NOT NULL,             -- Sub-category 2 (TNB, Rela, etc.)
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
  INDEX idx_sub_kategori1 (sub_kategori1),
  UNIQUE KEY unique_tahun_subkat1_subkat2 (tahun, sub_kategori1, sub_kategori2)
);

-- Predefined sub-categories for Pentadbiran
-- a. Utiliti: TNB, Syarikat Air Selangor, UNIFI
-- b. Perkhidmatan Keselamatan: Kawalan keselamatan, Rela, Perkhidmatan kawalan bank, Caruman insurans perlindungan
-- c. Khidmat Perunding: Perunding profesional, Bayaran Firma Audit, Bayaran Sistem Perakaunan
-- d. Perkhidmatan Pembersihan / Landskap: (user-defined items)
-- e. Pengurusan Pejabat: (user-defined items)
