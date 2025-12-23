-- Update inventory_staff user password
-- Password: inventory123

UPDATE users
SET password = '$2a$10$VFIWF9X2gaEIPEAVzQ3npemtcX6Mlxd7fsTjDmV77DHM52YbVK4Si'
WHERE email = 'inventory@isar.com';

SELECT id, name, email, role, 'Password updated successfully' as status
FROM users
WHERE email = 'inventory@isar.com';
