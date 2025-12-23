USE isar_db;

-- Password hash for 'admin123': $2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG

-- Add 10 more Imams
INSERT INTO users (name, email, password, role, phone, is_active) VALUES
('Imam 3', 'imam3@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'imam', '0123456785', TRUE),
('Imam 4', 'imam4@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'imam', '0123456786', TRUE),
('Imam 5', 'imam5@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'imam', '0123456787', TRUE),
('Imam 6', 'imam6@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'imam', '0123456788', TRUE),
('Imam 7', 'imam7@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'imam', '0123456789', TRUE),
('Imam 8', 'imam8@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'imam', '0123456790', TRUE),
('Imam 9', 'imam9@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'imam', '0123456791', TRUE),
('Imam 10', 'imam10@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'imam', '0123456792', TRUE),
('Imam 11', 'imam11@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'imam', '0123456793', TRUE),
('Imam 12', 'imam12@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'imam', '0123456794', TRUE);

-- Add 10 more Bilals
INSERT INTO users (name, email, password, role, phone, is_active) VALUES
('Bilal 3', 'bilal3@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'bilal', '0123456795', TRUE),
('Bilal 4', 'bilal4@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'bilal', '0123456796', TRUE),
('Bilal 5', 'bilal5@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'bilal', '0123456797', TRUE),
('Bilal 6', 'bilal6@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'bilal', '0123456798', TRUE),
('Bilal 7', 'bilal7@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'bilal', '0123456799', TRUE),
('Bilal 8', 'bilal8@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'bilal', '0123456800', TRUE),
('Bilal 9', 'bilal9@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'bilal', '0123456801', TRUE),
('Bilal 10', 'bilal10@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'bilal', '0123456802', TRUE),
('Bilal 11', 'bilal11@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'bilal', '0123456803', TRUE),
('Bilal 12', 'bilal12@isar.com', '$2a$10$8IExknSmqMJndM6ZHiSA1uuujsU2oMWfB/4PadJMTADuHcjGvhTpG', 'bilal', '0123456804', TRUE);

-- Show summary
SELECT 'Users added successfully!' as result;
SELECT role, COUNT(*) as total FROM users WHERE is_active = TRUE GROUP BY role ORDER BY role;
SELECT 'Total active users:' as label, COUNT(*) as count FROM users WHERE is_active = TRUE;
