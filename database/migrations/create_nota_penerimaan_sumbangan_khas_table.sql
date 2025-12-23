-- Migration: Create table for Nota Butiran Penerimaan Sumbangan Khas (Amanah)
-- This stores the breakdown of Sumbangan Khas by sub-category with balances

CREATE TABLE IF NOT EXISTS nota_penerimaan_sumbangan_khas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,                              -- Year this record applies to
  subkategori VARCHAR(255) NOT NULL,               -- Sub-category name (Khairat Kematian, etc.)
  -- Tahun Sebelum values
  baki_awal_jan_sebelum DECIMAL(15,2) DEFAULT 0,   -- Opening balance 1 Jan (previous year)
  terimaan_semasa_sebelum DECIMAL(15,2) DEFAULT 0, -- Receipts during year (previous year)
  belanja_semasa_sebelum DECIMAL(15,2) DEFAULT 0,  -- Expenses during year (previous year)
  baki_akhir_dis_sebelum DECIMAL(15,2) DEFAULT 0,  -- Closing balance 31 Dec (previous year)
  -- Tahun Semasa values
  baki_awal_jan_semasa DECIMAL(15,2) DEFAULT 0,    -- Opening balance 1 Jan (current year)
  terimaan_semasa_semasa DECIMAL(15,2) DEFAULT 0,  -- Receipts during year (current year)
  belanja_semasa_semasa DECIMAL(15,2) DEFAULT 0,   -- Expenses during year (current year)
  baki_akhir_dis_semasa DECIMAL(15,2) DEFAULT 0,   -- Closing balance 31 Dec (current year)
  auto_generated BOOLEAN DEFAULT TRUE,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_tahun (tahun),
  UNIQUE KEY unique_tahun_subkategori (tahun, subkategori)
);

-- Insert default sub-categories for current year
INSERT INTO nota_penerimaan_sumbangan_khas (tahun, subkategori)
SELECT YEAR(CURDATE()), subkategori
FROM (
  SELECT 'Khairat Kematian' as subkategori, 1 as urutan
  UNION SELECT 'Pembangunan & Selenggara Wakaf', 2
  UNION SELECT 'Yuran Pengajian', 3
  UNION SELECT 'Pendidikan', 4
  UNION SELECT 'Ihya Ramadhan', 5
  UNION SELECT 'Ibadah Qurban', 6
  UNION SELECT 'Bantuan Bencana', 7
  UNION SELECT 'Anak Yatim', 8
) as default_items
WHERE NOT EXISTS (
  SELECT 1 FROM nota_penerimaan_sumbangan_khas WHERE tahun = YEAR(CURDATE())
)
ORDER BY urutan;
