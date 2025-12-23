-- Migration: Create aktiviti_surau table
-- Date: 2025-11-29
-- Description: Table for storing surau activities/events for public calendar

CREATE TABLE IF NOT EXISTS aktiviti_surau (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Activity details
  tajuk VARCHAR(255) NOT NULL,
  keterangan TEXT,

  -- Date and time
  tarikh_mula DATE NOT NULL,
  tarikh_tamat DATE,
  masa_mula TIME,
  masa_tamat TIME,

  -- Location and category
  lokasi VARCHAR(255) DEFAULT 'Surau Ar-Raudhah',
  kategori ENUM('kuliah', 'program_khas', 'gotong_royong', 'mesyuarat', 'majlis', 'lain_lain') DEFAULT 'lain_lain',

  -- Organizer
  penganjur VARCHAR(255),

  -- Status
  status ENUM('aktif', 'batal') DEFAULT 'aktif',

  -- Audit
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  -- Indexes
  INDEX idx_tarikh_mula (tarikh_mula),
  INDEX idx_tarikh_tamat (tarikh_tamat),
  INDEX idx_status (status),
  INDEX idx_kategori (kategori)
);
