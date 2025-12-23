-- Migration: Create permohonan_majlis table
-- Date: 2025-11-29
-- Description: Table for storing event/majlis booking requests at Surau Ar-Raudhah

CREATE TABLE IF NOT EXISTS permohonan_majlis (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Applicant details
  nama_pemohon VARCHAR(255) NOT NULL,
  no_kad_pengenalan VARCHAR(20) NOT NULL,
  alamat TEXT NOT NULL,
  no_telefon_rumah VARCHAR(20),
  no_handphone VARCHAR(20) NOT NULL,

  -- Event details
  tajuk_majlis VARCHAR(255) NOT NULL,
  tarikh_majlis DATE NOT NULL,
  hari_majlis VARCHAR(20) NOT NULL,
  masa_majlis VARCHAR(50) NOT NULL,
  waktu_majlis ENUM('pagi', 'petang', 'malam') NOT NULL,
  jumlah_jemputan INT NOT NULL,

  -- Equipment needed (stored as JSON)
  peralatan JSON,
  peralatan_lain TEXT,

  -- Agreement and signature
  bersetuju_terma BOOLEAN DEFAULT FALSE,
  tarikh_permohonan DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Approval workflow
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at DATETIME,
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,

  -- Indexes
  INDEX idx_status (status),
  INDEX idx_tarikh_majlis (tarikh_majlis),
  INDEX idx_no_kad_pengenalan (no_kad_pengenalan)
);
