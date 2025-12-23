-- Create table for Penyata Penyesuaian Bank (BR-KMS 020)
CREATE TABLE IF NOT EXISTS penyesuaian_bank (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,
  bulan INT NOT NULL, -- 1-12
  baki_penyata_bank DECIMAL(15,2) NOT NULL DEFAULT 0.00, -- Baki seperti di penyata bank
  caj_bank DECIMAL(15,2) NOT NULL DEFAULT 0.00, -- Caj bank
  komisen_bank DECIMAL(15,2) NOT NULL DEFAULT 0.00, -- Komisen bank
  cek_tak_laku DECIMAL(15,2) NOT NULL DEFAULT 0.00, -- Cek tak laku
  dividen_hibah DECIMAL(15,2) NOT NULL DEFAULT 0.00, -- Dividen/hibah
  nota TEXT, -- Nota tambahan
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_bulan_tahun (tahun, bulan),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for faster queries
CREATE INDEX idx_penyesuaian_tahun_bulan ON penyesuaian_bank(tahun, bulan);
