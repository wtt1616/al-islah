-- Migration: Create table for Nota Butiran Penerimaan Elaun (Sumbangan Elaun)
-- This stores the breakdown of Sumbangan Elaun receipts by position

CREATE TABLE IF NOT EXISTS nota_penerimaan_elaun (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,                           -- Year this record applies to
  jawatan VARCHAR(255) NOT NULL,                -- Position (Nazir, Imam 1, etc.)
  nama_pegawai VARCHAR(255),                    -- Staff name
  jumlah_tahun_semasa DECIMAL(15,2) DEFAULT 0,  -- Current year amount
  jumlah_tahun_sebelum DECIMAL(15,2) DEFAULT 0, -- Previous year amount
  auto_generated BOOLEAN DEFAULT TRUE,          -- Whether values are auto-calculated
  urutan INT DEFAULT 0,                         -- Display order
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_tahun (tahun),
  UNIQUE KEY unique_tahun_jawatan (tahun, jawatan)
);

-- Insert default positions for current year
INSERT INTO nota_penerimaan_elaun (tahun, jawatan, urutan)
SELECT YEAR(CURDATE()), jawatan, urutan
FROM (
  SELECT 'Nazir' as jawatan, 1 as urutan
  UNION SELECT 'Imam 1', 2
  UNION SELECT 'Imam II', 3
  UNION SELECT 'Bilal 1', 4
  UNION SELECT 'Bilal II', 5
  UNION SELECT 'Siak I', 6
  UNION SELECT 'Siak II', 7
  UNION SELECT 'Timbalan Nazir', 8
  UNION SELECT 'Setiausaha', 9
  UNION SELECT 'Penolong Setiausaha', 10
  UNION SELECT 'Bendahari', 11
) as default_items
WHERE NOT EXISTS (
  SELECT 1 FROM nota_penerimaan_elaun WHERE tahun = YEAR(CURDATE())
)
ORDER BY urutan;
