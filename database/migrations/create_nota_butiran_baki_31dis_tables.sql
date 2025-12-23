-- Migration: Create tables for Nota Butiran Baki 31 Disember
-- This stores closing balance details at end of financial year

-- 1. Baki Semua Wang Di Bank Pada 31 Disember
CREATE TABLE IF NOT EXISTS nota_baki_bank_31dis (
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

-- 2. Baki Pelaburan Pada 31 Disember
CREATE TABLE IF NOT EXISTS nota_baki_pelaburan_31dis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,                           -- Year this record applies to
  nama_bank VARCHAR(255) NOT NULL,              -- Bank/Institution name
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

-- 3. Baki Deposit Di bayar Pada 31 Disember
CREATE TABLE IF NOT EXISTS nota_baki_deposit_31dis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun INT NOT NULL,                           -- Year this record applies to
  deposit VARCHAR(255) NOT NULL,                -- Deposit type (Air, Elektrik, Bon, Jaminan/Tahanan)
  tarikh DATE,                                  -- Date of deposit
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
INSERT INTO nota_baki_deposit_31dis (tahun, deposit, baki_tahun_semasa, baki_tahun_sebelum)
SELECT YEAR(CURDATE()), deposit, 0, 0
FROM (
  SELECT 'Air' as deposit
  UNION SELECT 'Elektrik'
  UNION SELECT 'Bon'
  UNION SELECT 'Jaminan/Tahanan'
) as default_items
WHERE NOT EXISTS (
  SELECT 1 FROM nota_baki_deposit_31dis WHERE tahun = YEAR(CURDATE())
);
