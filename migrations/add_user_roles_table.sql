-- Migration: Add user_roles table for multiple roles support (Petugas only)
-- Date: 2025-12-17

-- Create user_roles junction table for petugas with multiple roles
CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role ENUM('imam', 'bilal', 'imam_jumaat', 'bilal_jumaat', 'penceramah', 'head_imam') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_role (user_id, role),
  INDEX idx_user_id (user_id),
  INDEX idx_role (role),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Migrate existing petugas roles to user_roles table
INSERT INTO user_roles (user_id, role)
SELECT id, role FROM users
WHERE user_type = 'petugas'
AND role IN ('imam', 'bilal', 'imam_jumaat', 'bilal_jumaat', 'penceramah', 'head_imam')
ON DUPLICATE KEY UPDATE role = VALUES(role);
