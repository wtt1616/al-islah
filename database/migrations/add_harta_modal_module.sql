-- Migration: Add Harta Modal Module
-- Date: 2025-11-20
-- Description: Add harta_modal table for capital assets management

-- Create harta_modal table
CREATE TABLE IF NOT EXISTS harta_modal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    no_siri_pendaftaran VARCHAR(100) UNIQUE NOT NULL,
    keterangan TEXT NOT NULL,
    cara_diperolehi VARCHAR(255) NOT NULL,
    created_by INT,
    modified_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (modified_by) REFERENCES users(id),
    INDEX idx_no_siri (no_siri_pendaftaran),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
