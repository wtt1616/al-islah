-- Create feedback table for public feedback system
-- Run this migration on production database

CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  no_telefon VARCHAR(20) NOT NULL,
  alamat TEXT NOT NULL,
  emel VARCHAR(255) NOT NULL,
  mesej TEXT NOT NULL,
  status ENUM('baru', 'dibaca', 'dibalas') DEFAULT 'baru',
  admin_reply TEXT DEFAULT NULL,
  replied_by INT DEFAULT NULL,
  replied_at DATETIME DEFAULT NULL,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL
);
