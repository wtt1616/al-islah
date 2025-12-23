-- Migration: Create Tender Tables
-- Date: 2025-12-16

-- Table for tender listings
CREATE TABLE IF NOT EXISTS tenders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tajuk VARCHAR(500) NOT NULL COMMENT 'Tajuk tender',
  keterangan TEXT COMMENT 'Keterangan tender',
  tarikh_mula DATE NOT NULL COMMENT 'Tarikh mula tender boleh dibeli',
  tarikh_akhir DATE NOT NULL COMMENT 'Tarikh akhir tender boleh dibeli',
  dokumen VARCHAR(500) COMMENT 'Path to tender document',
  harga DECIMAL(10,2) DEFAULT 0 COMMENT 'Harga dokumen tender (jika ada)',
  status ENUM('aktif', 'tamat', 'batal') DEFAULT 'aktif',
  created_by INT COMMENT 'User ID who created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_tarikh (tarikh_mula, tarikh_akhir)
);

-- Table for tender buyers/purchasers
CREATE TABLE IF NOT EXISTS tender_pembeli (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tender_id INT NOT NULL,
  nama_syarikat VARCHAR(255) NOT NULL COMMENT 'Nama syarikat pembeli',
  no_tel VARCHAR(20) NOT NULL COMMENT 'No telefon',
  nama_pembeli VARCHAR(255) NOT NULL COMMENT 'Nama orang yang beli/ambil tender',
  no_resit VARCHAR(100) COMMENT 'No resit bayaran',
  tarikh_beli DATE NOT NULL COMMENT 'Tarikh beli/ambil tender',
  keterangan TEXT COMMENT 'Keterangan tambahan',
  created_by INT COMMENT 'User ID who recorded',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE,
  INDEX idx_tender_id (tender_id),
  INDEX idx_tarikh_beli (tarikh_beli)
);
