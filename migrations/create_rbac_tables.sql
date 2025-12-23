-- Migration: Create RBAC Tables (modules & role_permissions)
-- Date: 2025-12-20
-- Description: Dynamic permission management system for iSAR

-- =====================================================
-- Table 1: modules - Senarai Modul Sistem
-- =====================================================
CREATE TABLE IF NOT EXISTS modules (
  id VARCHAR(50) PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  path VARCHAR(255),
  urutan INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table 2: role_permissions - Kebenaran Peranan
-- =====================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_role_module (role, module_id),
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- =====================================================
-- Index untuk prestasi query
-- =====================================================
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_modules_urutan ON modules(urutan);
CREATE INDEX idx_modules_is_active ON modules(is_active);
