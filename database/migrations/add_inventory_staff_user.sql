-- Add inventory_staff user
-- Email: inventory@isar.com
-- Password: inventory123

INSERT INTO users (name, email, password, role, phone, is_active, created_at, updated_at)
VALUES (
  'Inventory Staff',
  'inventory@isar.com',
  '$2a$10$VFIWF9X2gaEIPEAVzQ3npemtcX6Mlxd7fsTjDmV77DHM52YbVK4Si',
  'inventory_staff',
  NULL,
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = 'Inventory Staff',
  role = 'inventory_staff',
  is_active = 1;
