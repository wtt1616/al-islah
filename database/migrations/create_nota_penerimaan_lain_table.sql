-- Migration: Create table for Nota Butiran Penerimaan Lain-lain Terimaan
-- This stores the breakdown of Lain-lain Terimaan receipts by perkara (sub-category)

CREATE TABLE IF NOT EXISTS nota_penerimaan_lain (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,                              -- Year this record applies to
  perkara VARCHAR(255) NOT NULL,                   -- Item description (Pelbagai, Pulangan bayaran, etc.)
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
  UNIQUE KEY unique_tahun_perkara (tahun, perkara)
);
