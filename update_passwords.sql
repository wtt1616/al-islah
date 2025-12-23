USE isar_db;

-- Update all users with correct password hash for 'admin123'
UPDATE users SET password = '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG' WHERE id = 1;
UPDATE users SET password = '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG' WHERE id = 2;
UPDATE users SET password = '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG' WHERE id = 3;
UPDATE users SET password = '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG' WHERE id = 4;
UPDATE users SET password = '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG' WHERE id = 5;
UPDATE users SET password = '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG' WHERE id = 6;

SELECT 'Passwords updated successfully!' as result;
SELECT id, name, email, LEFT(password, 20) as password_preview FROM users;
