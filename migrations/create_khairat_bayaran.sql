-- Migration: Create Khairat Bayaran Table
-- Date: 2025-12-21
-- Description: Table for annual fee payments (yuran tahunan) by khairat members

CREATE TABLE IF NOT EXISTS khairat_bayaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  khairat_ahli_id INT NOT NULL,
  tahun INT NOT NULL,
  jenis_bayaran ENUM('tahunan', 'tunggakan') DEFAULT 'tahunan',
  amaun DECIMAL(10,2) DEFAULT 50.00,
  no_resit VARCHAR(100),
  resit_file VARCHAR(500),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  tarikh_bayar DATE,
  tarikh_lulus DATETIME,
  approved_by INT,
  reject_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_ahli_tahun (khairat_ahli_id, tahun),
  INDEX idx_status (status),
  INDEX idx_tahun (tahun),
  FOREIGN KEY (khairat_ahli_id) REFERENCES khairat_ahli(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_ahli_tahun (khairat_ahli_id, tahun)
);
