-- Migration: Create monthly_schedules table for Surau Al-Islah
-- Date: 2025-12-25
-- Description: New monthly scheduling system with support for:
--   - Prayer schedules (5 times daily) with Imam and Bilal
--   - Tadabbur (Monday-Friday)
--   - Tahsin (Daily)
--   - Imam Jumaat (Friday only)

CREATE TABLE IF NOT EXISTS monthly_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_date DATE NOT NULL,
  schedule_type ENUM('prayer', 'tadabbur', 'tahsin', 'imam_jumaat') NOT NULL,
  prayer_time ENUM('Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak') NULL,
  petugas_id INT NULL COMMENT 'User ID for assigned person',
  petugas_role ENUM('imam', 'bilal', 'siak', 'tadabbur', 'tahsin', 'imam_jumaat') NOT NULL,
  month_number INT NOT NULL COMMENT 'Month 1-12',
  year INT NOT NULL,
  is_auto_generated BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  modified_by INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (petugas_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (modified_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_date (schedule_date),
  INDEX idx_month_year (month_number, year),
  INDEX idx_type (schedule_type),
  INDEX idx_petugas (petugas_id),
  INDEX idx_role (petugas_role),

  -- Unique constraint: one assignment per date/type/prayer_time/role combination
  UNIQUE KEY unique_slot (schedule_date, schedule_type, prayer_time, petugas_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add custom roles for tadabbur and tahsin if not exist
INSERT IGNORE INTO custom_roles (role_key, role_label, category, is_active)
VALUES
  ('tadabbur', 'Petugas Tadabbur', 'petugas', TRUE),
  ('tahsin', 'Petugas Tahsin', 'petugas', TRUE);
