-- iSAR Database Schema
-- Run this directly in MySQL

USE isar;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'head_imam', 'imam', 'bilal') NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create availability table
CREATE TABLE availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  prayer_time ENUM('Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak') NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date_prayer (user_id, date, prayer_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create schedules table
CREATE TABLE schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  prayer_time ENUM('Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak') NOT NULL,
  imam_id INT,
  bilal_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (imam_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (bilal_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_date_prayer (date, prayer_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password, role, phone, is_active) VALUES
('Admin', 'admin@isar.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'admin', NULL, TRUE);
