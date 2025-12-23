-- iSAR Database Schema
-- Prayer Schedule Management System

CREATE DATABASE IF NOT EXISTS isar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE isar_db;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'head_imam', 'imam', 'bilal') NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- Prayer Times Table (for reference)
CREATE TABLE prayer_times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak') NOT NULL,
    display_order INT NOT NULL,
    UNIQUE KEY unique_prayer (name)
) ENGINE=InnoDB;

-- Availability Table (when Imam/Bilal cannot be on duty)
CREATE TABLE availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    prayer_time ENUM('Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak') NOT NULL,
    is_available BOOLEAN DEFAULT FALSE,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, date),
    INDEX idx_date (date),
    UNIQUE KEY unique_availability (user_id, date, prayer_time)
) ENGINE=InnoDB;

-- Schedules Table
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    prayer_time ENUM('Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak') NOT NULL,
    imam_id INT NULL,
    bilal_id INT NULL,
    week_number INT NOT NULL,
    year INT NOT NULL,
    is_auto_generated BOOLEAN DEFAULT TRUE,
    created_by INT,
    modified_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (imam_id) REFERENCES users(id),
    FOREIGN KEY (bilal_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (modified_by) REFERENCES users(id),
    INDEX idx_date (date),
    INDEX idx_week (week_number, year),
    UNIQUE KEY unique_schedule (date, prayer_time)
) ENGINE=InnoDB;

-- Insert default prayer times
INSERT INTO prayer_times (name, display_order) VALUES
('Subuh', 1),
('Zohor', 2),
('Asar', 3),
('Maghrib', 4),
('Isyak', 5);

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (name, email, password, role, phone) VALUES
('Admin', 'admin@isar.com', '$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2', 'admin', '0123456789'),
('Head Imam', 'headimam@isar.com', '$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2', 'head_imam', '0123456780'),
('Imam 1', 'imam1@isar.com', '$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2', 'imam', '0123456781'),
('Imam 2', 'imam2@isar.com', '$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2', 'imam', '0123456782'),
('Bilal 1', 'bilal1@isar.com', '$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2', 'bilal', '0123456783'),
('Bilal 2', 'bilal2@isar.com', '$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2', 'bilal', '0123456784');
