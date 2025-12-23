-- Migration: Create tables for Nota Butiran Baki 1 Jan
-- This stores opening balance details for financial year

-- 1. Baki Semua Wang Di Bank Pada 1 Januari
CREATE TABLE IF NOT EXISTS nota_baki_bank (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,                           -- Year this record applies to
  nama_bank VARCHAR(255) NOT NULL,              -- Bank name
  cawangan VARCHAR(255),                        -- Branch
  baki_tahun_semasa DECIMAL(15,2) DEFAULT 0,    -- Current year balance
  baki_tahun_sebelum DECIMAL(15,2) DEFAULT 0,   -- Previous year balance
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_tahun (tahun)
);

-- 2. Baki Pelaburan Pada 1 Januari
CREATE TABLE IF NOT EXISTS nota_baki_pelaburan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,                           -- Year this record applies to
  nama_institusi VARCHAR(255) NOT NULL,         -- Institution name
  cawangan VARCHAR(255),                        -- Branch
  baki_tahun_semasa DECIMAL(15,2) DEFAULT 0,    -- Current year balance
  baki_tahun_sebelum DECIMAL(15,2) DEFAULT 0,   -- Previous year balance
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_tahun (tahun)
);

-- 3. Baki Deposit Pada 1 Jan
CREATE TABLE IF NOT EXISTS nota_baki_deposit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,                           -- Year this record applies to
  perkara VARCHAR(255) NOT NULL,                -- Item description (Deposit Air, Elektrik, etc.)
  baki_tahun_semasa DECIMAL(15,2) DEFAULT 0,    -- Current year balance
  baki_tahun_sebelum DECIMAL(15,2) DEFAULT 0,   -- Previous year balance
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_tahun (tahun)
);

-- Insert default deposit items for current year
INSERT INTO nota_baki_deposit (tahun, perkara, baki_tahun_semasa, baki_tahun_sebelum)
SELECT YEAR(CURDATE()), perkara, 0, 0
FROM (
  SELECT 'Deposit Air' as perkara
  UNION SELECT 'Elektrik'
  UNION SELECT 'Bon/Wang Jaminan'
  UNION SELECT 'Wang Tahanan'
) as default_items
WHERE NOT EXISTS (
  SELECT 1 FROM nota_baki_deposit WHERE tahun = YEAR(CURDATE())
);
