-- Seed: RBAC Initial Data
-- Date: 2025-12-20
-- Description: Insert default modules and role permissions

-- =====================================================
-- Insert 8 Main Modules
-- =====================================================
INSERT INTO modules (id, nama, icon, path, urutan, is_active) VALUES
('dashboard', 'Dashboard', 'bi-speedometer2', '/dashboard', 1, TRUE),
('penjadualan', 'Penjadualan', 'bi-calendar-week', '/schedules', 2, TRUE),
('aset', 'Aset', 'bi-box-seam', '/aset', 3, TRUE),
('kewangan', 'Kewangan', 'bi-cash-coin', '/financial', 4, TRUE),
('laporan', 'Laporan', 'bi-file-earmark-text', '/dashboard/reports', 5, TRUE),
('aktiviti', 'Aktiviti', 'bi-calendar-event', '/dashboard/aktiviti', 6, TRUE),
('khairat', 'Khairat Kematian', 'bi-heart', '/dashboard/khairat', 7, TRUE),
('pentadbiran', 'Pentadbiran', 'bi-gear', '/admin', 8, TRUE)
ON DUPLICATE KEY UPDATE nama = VALUES(nama), icon = VALUES(icon), path = VALUES(path), urutan = VALUES(urutan);

-- =====================================================
-- Default Permissions for ADMIN (Full Access)
-- =====================================================
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete) VALUES
('admin', 'dashboard', TRUE, TRUE, TRUE, TRUE),
('admin', 'penjadualan', TRUE, TRUE, TRUE, TRUE),
('admin', 'aset', TRUE, TRUE, TRUE, TRUE),
('admin', 'kewangan', TRUE, TRUE, TRUE, TRUE),
('admin', 'laporan', TRUE, TRUE, TRUE, TRUE),
('admin', 'aktiviti', TRUE, TRUE, TRUE, TRUE),
('admin', 'khairat', TRUE, TRUE, TRUE, TRUE),
('admin', 'pentadbiran', TRUE, TRUE, TRUE, TRUE)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_delete = VALUES(can_delete);

-- =====================================================
-- Default Permissions for BENDAHARI
-- =====================================================
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete) VALUES
('bendahari', 'dashboard', TRUE, FALSE, FALSE, FALSE),
('bendahari', 'penjadualan', FALSE, FALSE, FALSE, FALSE),
('bendahari', 'aset', FALSE, FALSE, FALSE, FALSE),
('bendahari', 'kewangan', TRUE, TRUE, TRUE, TRUE),
('bendahari', 'laporan', TRUE, TRUE, TRUE, FALSE),
('bendahari', 'aktiviti', FALSE, FALSE, FALSE, FALSE),
('bendahari', 'khairat', FALSE, FALSE, FALSE, FALSE),
('bendahari', 'pentadbiran', FALSE, FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_delete = VALUES(can_delete);

-- =====================================================
-- Default Permissions for HEAD_IMAM
-- =====================================================
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete) VALUES
('head_imam', 'dashboard', TRUE, FALSE, FALSE, FALSE),
('head_imam', 'penjadualan', TRUE, TRUE, TRUE, TRUE),
('head_imam', 'aset', FALSE, FALSE, FALSE, FALSE),
('head_imam', 'kewangan', TRUE, FALSE, FALSE, FALSE),
('head_imam', 'laporan', TRUE, FALSE, FALSE, FALSE),
('head_imam', 'aktiviti', TRUE, TRUE, TRUE, TRUE),
('head_imam', 'khairat', TRUE, TRUE, TRUE, TRUE),
('head_imam', 'pentadbiran', FALSE, FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_delete = VALUES(can_delete);

-- =====================================================
-- Default Permissions for ASET
-- =====================================================
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete) VALUES
('aset', 'dashboard', TRUE, FALSE, FALSE, FALSE),
('aset', 'penjadualan', FALSE, FALSE, FALSE, FALSE),
('aset', 'aset', TRUE, TRUE, TRUE, TRUE),
('aset', 'kewangan', FALSE, FALSE, FALSE, FALSE),
('aset', 'laporan', FALSE, FALSE, FALSE, FALSE),
('aset', 'aktiviti', FALSE, FALSE, FALSE, FALSE),
('aset', 'khairat', FALSE, FALSE, FALSE, FALSE),
('aset', 'pentadbiran', FALSE, FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_delete = VALUES(can_delete);

-- =====================================================
-- Default Permissions for PEGAWAI
-- =====================================================
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete) VALUES
('pegawai', 'dashboard', TRUE, FALSE, FALSE, FALSE),
('pegawai', 'penjadualan', TRUE, FALSE, FALSE, FALSE),
('pegawai', 'aset', FALSE, FALSE, FALSE, FALSE),
('pegawai', 'kewangan', FALSE, FALSE, FALSE, FALSE),
('pegawai', 'laporan', FALSE, FALSE, FALSE, FALSE),
('pegawai', 'aktiviti', TRUE, FALSE, FALSE, FALSE),
('pegawai', 'khairat', FALSE, FALSE, FALSE, FALSE),
('pegawai', 'pentadbiran', FALSE, FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_delete = VALUES(can_delete);

-- =====================================================
-- Default Permissions for IMAM (Petugas)
-- =====================================================
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete) VALUES
('imam', 'dashboard', TRUE, FALSE, FALSE, FALSE),
('imam', 'penjadualan', TRUE, FALSE, FALSE, FALSE),
('imam', 'aset', FALSE, FALSE, FALSE, FALSE),
('imam', 'kewangan', FALSE, FALSE, FALSE, FALSE),
('imam', 'laporan', FALSE, FALSE, FALSE, FALSE),
('imam', 'aktiviti', FALSE, FALSE, FALSE, FALSE),
('imam', 'khairat', FALSE, FALSE, FALSE, FALSE),
('imam', 'pentadbiran', FALSE, FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_delete = VALUES(can_delete);

-- =====================================================
-- Default Permissions for BILAL (Petugas)
-- =====================================================
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete) VALUES
('bilal', 'dashboard', TRUE, FALSE, FALSE, FALSE),
('bilal', 'penjadualan', TRUE, FALSE, FALSE, FALSE),
('bilal', 'aset', FALSE, FALSE, FALSE, FALSE),
('bilal', 'kewangan', FALSE, FALSE, FALSE, FALSE),
('bilal', 'laporan', FALSE, FALSE, FALSE, FALSE),
('bilal', 'aktiviti', FALSE, FALSE, FALSE, FALSE),
('bilal', 'khairat', FALSE, FALSE, FALSE, FALSE),
('bilal', 'pentadbiran', FALSE, FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_delete = VALUES(can_delete);

-- =====================================================
-- Default Permissions for IMAM_JUMAAT (Petugas)
-- =====================================================
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete) VALUES
('imam_jumaat', 'dashboard', TRUE, FALSE, FALSE, FALSE),
('imam_jumaat', 'penjadualan', TRUE, FALSE, FALSE, FALSE),
('imam_jumaat', 'aset', FALSE, FALSE, FALSE, FALSE),
('imam_jumaat', 'kewangan', FALSE, FALSE, FALSE, FALSE),
('imam_jumaat', 'laporan', FALSE, FALSE, FALSE, FALSE),
('imam_jumaat', 'aktiviti', FALSE, FALSE, FALSE, FALSE),
('imam_jumaat', 'khairat', FALSE, FALSE, FALSE, FALSE),
('imam_jumaat', 'pentadbiran', FALSE, FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_delete = VALUES(can_delete);

-- =====================================================
-- Default Permissions for BILAL_JUMAAT (Petugas)
-- =====================================================
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete) VALUES
('bilal_jumaat', 'dashboard', TRUE, FALSE, FALSE, FALSE),
('bilal_jumaat', 'penjadualan', TRUE, FALSE, FALSE, FALSE),
('bilal_jumaat', 'aset', FALSE, FALSE, FALSE, FALSE),
('bilal_jumaat', 'kewangan', FALSE, FALSE, FALSE, FALSE),
('bilal_jumaat', 'laporan', FALSE, FALSE, FALSE, FALSE),
('bilal_jumaat', 'aktiviti', FALSE, FALSE, FALSE, FALSE),
('bilal_jumaat', 'khairat', FALSE, FALSE, FALSE, FALSE),
('bilal_jumaat', 'pentadbiran', FALSE, FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_delete = VALUES(can_delete);

-- =====================================================
-- Default Permissions for PENCERAMAH (Petugas)
-- =====================================================
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete) VALUES
('penceramah', 'dashboard', TRUE, FALSE, FALSE, FALSE),
('penceramah', 'penjadualan', TRUE, FALSE, FALSE, FALSE),
('penceramah', 'aset', FALSE, FALSE, FALSE, FALSE),
('penceramah', 'kewangan', FALSE, FALSE, FALSE, FALSE),
('penceramah', 'laporan', FALSE, FALSE, FALSE, FALSE),
('penceramah', 'aktiviti', FALSE, FALSE, FALSE, FALSE),
('penceramah', 'khairat', FALSE, FALSE, FALSE, FALSE),
('penceramah', 'pentadbiran', FALSE, FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_delete = VALUES(can_delete);
