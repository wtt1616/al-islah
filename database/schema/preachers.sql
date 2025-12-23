-- Preachers Table
-- Stores information about preachers who can be scheduled for Subuh and Maghrib preaching
CREATE TABLE IF NOT EXISTS preachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preacher Schedules Table
-- Stores the monthly schedule for preaching
-- Note: Monday and Thursday have no preaching
-- Friday has only Friday Preach (Jumaat), other days have Subuh and Maghrib
CREATE TABLE IF NOT EXISTS preacher_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_date DATE NOT NULL,
  subuh_preacher_id INT,
  maghrib_preacher_id INT,
  friday_preacher_id INT,
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subuh_preacher_id) REFERENCES preachers(id) ON DELETE SET NULL,
  FOREIGN KEY (maghrib_preacher_id) REFERENCES preachers(id) ON DELETE SET NULL,
  FOREIGN KEY (friday_preacher_id) REFERENCES preachers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE KEY unique_schedule_date (schedule_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for faster date-based queries
CREATE INDEX idx_schedule_date ON preacher_schedules(schedule_date);
CREATE INDEX idx_subuh_preacher ON preacher_schedules(subuh_preacher_id);
CREATE INDEX idx_maghrib_preacher ON preacher_schedules(maghrib_preacher_id);
CREATE INDEX idx_friday_preacher ON preacher_schedules(friday_preacher_id);
