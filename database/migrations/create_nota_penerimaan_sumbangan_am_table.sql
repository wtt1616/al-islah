-- Migration: Create table for Nota Butiran Penerimaan Sumbangan Am
-- This stores the breakdown of Sumbangan Am receipts by sub-category

CREATE TABLE IF NOT EXISTS nota_penerimaan_sumbangan_am (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,                           -- Year this record applies to
  perkara VARCHAR(255) NOT NULL,                -- Sub-category name (Kutipan Jumaat, Kutipan Harian, etc.)
  jumlah_tahun_semasa DECIMAL(15,2) DEFAULT 0,  -- Current year amount
  jumlah_tahun_sebelum DECIMAL(15,2) DEFAULT 0, -- Previous year amount
  auto_generated BOOLEAN DEFAULT TRUE,          -- Whether values are auto-calculated
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_tahun (tahun),
  UNIQUE KEY unique_tahun_perkara (tahun, perkara)
);

-- Insert default sub-categories for current year
INSERT INTO nota_penerimaan_sumbangan_am (tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum)
SELECT YEAR(CURDATE()), perkara, 0, 0
FROM (
  SELECT 'Kutipan Jumaat' as perkara, 1 as urutan
  UNION SELECT 'Kutipan Harian', 2
  UNION SELECT 'Kutipan Hari Raya', 3
  UNION SELECT 'Sumbangan Agensi/Korporat/Syarikat/Yayasan', 4
  UNION SELECT 'Tahlil dan Doa Selamat', 5
  UNION SELECT 'Aktiviti dan Pengimarahan', 6
) as default_items
WHERE NOT EXISTS (
  SELECT 1 FROM nota_penerimaan_sumbangan_am WHERE tahun = YEAR(CURDATE())
)
ORDER BY urutan;
