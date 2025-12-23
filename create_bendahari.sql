-- Create/Update bendahari user with correct password hash for 'bendahari123'
-- First, try to update existing user
UPDATE users
SET password = '$2a$10$NjF1Fzo8jx37oyB5gKydYehQyUos6E.Jm8nC1thVSgn69fZXwemtK',
    is_active = 1,
    name = 'Bendahari',
    phone = '0123456789'
WHERE email = 'bendahari@masjid.com';

-- If no rows affected, insert new user
INSERT INTO users (name, email, password, role, phone, is_active)
SELECT 'Bendahari', 'bendahari@masjid.com', '$2a$10$NjF1Fzo8jx37oyB5gKydYehQyUos6E.Jm8nC1thVSgn69fZXwemtK', 'bendahari', '0123456789', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'bendahari@masjid.com');

-- Verify the user
SELECT id, name, email, role, is_active FROM users WHERE email='bendahari@masjid.com';
