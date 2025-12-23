-- Migration: Add Inventory Module
-- Date: 2025-11-20
-- Description: Add inventory_staff role and inventory table

-- Update users table to add inventory_staff role
ALTER TABLE users
MODIFY COLUMN role ENUM('admin', 'head_imam', 'imam', 'bilal', 'inventory_staff') NOT NULL;

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
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

-- Insert default inventory staff user
-- Password: inventory123 (hashed with bcrypt)
INSERT INTO users (name, email, password, role, phone) VALUES
('Inventory Staff', 'inventory@isar.com', '$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2', 'inventory_staff', '0123456790')
ON DUPLICATE KEY UPDATE email = email;
