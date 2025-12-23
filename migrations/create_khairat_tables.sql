-- Migration: Create Khairat Kematian Tables
-- Date: 2025-12-04
-- Description: Tables for khairat kematian membership registration

-- Table for main applicant (pemohon)
CREATE TABLE IF NOT EXISTS khairat_ahli (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  no_kp VARCHAR(255) NOT NULL,  -- Supports encrypted IC (AES-256-GCM produces ~90 chars)
  umur INT,
  alamat TEXT,
  no_telefon_rumah VARCHAR(20),
  no_hp VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  jenis_yuran ENUM('keahlian', 'tahunan', 'isteri_kedua') NOT NULL DEFAULT 'keahlian',
  no_resit VARCHAR(100),
  amaun_bayaran DECIMAL(10, 2) DEFAULT 50.00,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  tarikh_daftar DATE,
  tarikh_lulus DATETIME,
  approved_by INT,
  reject_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_no_kp (no_kp),
  INDEX idx_no_hp (no_hp),
  INDEX idx_tarikh_daftar (tarikh_daftar),
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table for dependents (tanggungan) - one-to-many relationship
CREATE TABLE IF NOT EXISTS khairat_tanggungan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  khairat_ahli_id INT NOT NULL,
  nama_penuh VARCHAR(255) NOT NULL,
  no_kp VARCHAR(255),  -- Supports encrypted IC (AES-256-GCM produces ~90 chars)
  umur INT,
  pertalian ENUM('isteri', 'anak', 'anak_oku') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_khairat_ahli_id (khairat_ahli_id),
  INDEX idx_pertalian (pertalian),
  FOREIGN KEY (khairat_ahli_id) REFERENCES khairat_ahli(id) ON DELETE CASCADE
);
