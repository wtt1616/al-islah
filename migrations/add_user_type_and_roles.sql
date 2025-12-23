-- Migration: Add user_type column and update role enum
-- Date: 2025-12-17

-- Add user_type column
ALTER TABLE users
ADD COLUMN user_type ENUM('pengguna_dalaman', 'petugas') DEFAULT 'petugas' AFTER password;

-- Update role enum to include all new roles
ALTER TABLE users
MODIFY COLUMN role ENUM(
  -- Pengguna Dalaman
  'admin',
  'bendahari',
  'aset',
  'pegawai',
  -- Petugas
  'imam',
  'bilal',
  'imam_jumaat',
  'bilal_jumaat',
  'penceramah',
  'head_imam',
  -- Legacy (backward compatibility)
  'inventory_staff'
) NOT NULL DEFAULT 'imam';

-- Update existing users based on their current role
-- Admin users -> pengguna_dalaman
UPDATE users SET user_type = 'pengguna_dalaman' WHERE role = 'admin';

-- Bendahari users -> pengguna_dalaman
UPDATE users SET user_type = 'pengguna_dalaman' WHERE role = 'bendahari';

-- Aset/Inventory staff users -> pengguna_dalaman
UPDATE users SET user_type = 'pengguna_dalaman', role = 'aset' WHERE role = 'inventory_staff';

-- Head imam -> petugas (but keep existing role)
UPDATE users SET user_type = 'petugas' WHERE role = 'head_imam';

-- Imam users -> petugas
UPDATE users SET user_type = 'petugas' WHERE role = 'imam';

-- Bilal users -> petugas
UPDATE users SET user_type = 'petugas' WHERE role = 'bilal';

-- Add index for user_type
CREATE INDEX idx_user_type ON users(user_type);
