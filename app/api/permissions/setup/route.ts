import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// POST - Setup RBAC tables (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: string[] = [];

    // Step 1: Create modules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id VARCHAR(50) PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        icon VARCHAR(50),
        path VARCHAR(255),
        urutan INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('Table modules created');

    // Step 2: Create role_permissions table
    await pool.query(`
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
      )
    `);
    results.push('Table role_permissions created');

    // Step 3: Create indexes (ignore if exists)
    try {
      await pool.query('CREATE INDEX idx_role_permissions_role ON role_permissions(role)');
      results.push('Index idx_role_permissions_role created');
    } catch (e: any) {
      if (e.code !== 'ER_DUP_KEYNAME') throw e;
      results.push('Index idx_role_permissions_role already exists');
    }

    try {
      await pool.query('CREATE INDEX idx_modules_urutan ON modules(urutan)');
      results.push('Index idx_modules_urutan created');
    } catch (e: any) {
      if (e.code !== 'ER_DUP_KEYNAME') throw e;
      results.push('Index idx_modules_urutan already exists');
    }

    try {
      await pool.query('CREATE INDEX idx_modules_is_active ON modules(is_active)');
      results.push('Index idx_modules_is_active created');
    } catch (e: any) {
      if (e.code !== 'ER_DUP_KEYNAME') throw e;
      results.push('Index idx_modules_is_active already exists');
    }

    // Step 4: Insert 8 main modules
    const modules = [
      { id: 'dashboard', nama: 'Dashboard', icon: 'bi-speedometer2', path: '/dashboard', urutan: 1 },
      { id: 'penjadualan', nama: 'Penjadualan', icon: 'bi-calendar-week', path: '/schedules', urutan: 2 },
      { id: 'aset', nama: 'Aset', icon: 'bi-box-seam', path: '/aset', urutan: 3 },
      { id: 'kewangan', nama: 'Kewangan', icon: 'bi-cash-coin', path: '/financial', urutan: 4 },
      { id: 'laporan', nama: 'Laporan', icon: 'bi-file-earmark-text', path: '/dashboard/reports', urutan: 5 },
      { id: 'aktiviti', nama: 'Aktiviti', icon: 'bi-calendar-event', path: '/dashboard/aktiviti', urutan: 6 },
      { id: 'khairat', nama: 'Khairat Kematian', icon: 'bi-heart', path: '/dashboard/khairat', urutan: 7 },
      { id: 'pentadbiran', nama: 'Pentadbiran', icon: 'bi-gear', path: '/admin', urutan: 8 },
    ];

    for (const mod of modules) {
      await pool.query(
        `INSERT INTO modules (id, nama, icon, path, urutan, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE nama = VALUES(nama), icon = VALUES(icon), path = VALUES(path), urutan = VALUES(urutan)`,
        [mod.id, mod.nama, mod.icon, mod.path, mod.urutan]
      );
    }
    results.push('8 modules inserted/updated');

    // Step 5: Insert default role permissions
    const rolePermissions = [
      // ADMIN - Full access
      { role: 'admin', module_id: 'dashboard', can_view: true, can_create: true, can_edit: true, can_delete: true },
      { role: 'admin', module_id: 'penjadualan', can_view: true, can_create: true, can_edit: true, can_delete: true },
      { role: 'admin', module_id: 'aset', can_view: true, can_create: true, can_edit: true, can_delete: true },
      { role: 'admin', module_id: 'kewangan', can_view: true, can_create: true, can_edit: true, can_delete: true },
      { role: 'admin', module_id: 'laporan', can_view: true, can_create: true, can_edit: true, can_delete: true },
      { role: 'admin', module_id: 'aktiviti', can_view: true, can_create: true, can_edit: true, can_delete: true },
      { role: 'admin', module_id: 'khairat', can_view: true, can_create: true, can_edit: true, can_delete: true },
      { role: 'admin', module_id: 'pentadbiran', can_view: true, can_create: true, can_edit: true, can_delete: true },

      // BENDAHARI
      { role: 'bendahari', module_id: 'dashboard', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'bendahari', module_id: 'penjadualan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bendahari', module_id: 'aset', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bendahari', module_id: 'kewangan', can_view: true, can_create: true, can_edit: true, can_delete: true },
      { role: 'bendahari', module_id: 'laporan', can_view: true, can_create: true, can_edit: true, can_delete: false },
      { role: 'bendahari', module_id: 'aktiviti', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bendahari', module_id: 'khairat', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bendahari', module_id: 'pentadbiran', can_view: false, can_create: false, can_edit: false, can_delete: false },

      // HEAD_IMAM
      { role: 'head_imam', module_id: 'dashboard', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'head_imam', module_id: 'penjadualan', can_view: true, can_create: true, can_edit: true, can_delete: true },
      { role: 'head_imam', module_id: 'aset', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'head_imam', module_id: 'kewangan', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'head_imam', module_id: 'laporan', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'head_imam', module_id: 'aktiviti', can_view: true, can_create: true, can_edit: true, can_delete: true },
      { role: 'head_imam', module_id: 'khairat', can_view: true, can_create: true, can_edit: true, can_delete: true },
      { role: 'head_imam', module_id: 'pentadbiran', can_view: false, can_create: false, can_edit: false, can_delete: false },

      // ASET
      { role: 'aset', module_id: 'dashboard', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'aset', module_id: 'penjadualan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'aset', module_id: 'aset', can_view: true, can_create: true, can_edit: true, can_delete: true },
      { role: 'aset', module_id: 'kewangan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'aset', module_id: 'laporan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'aset', module_id: 'aktiviti', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'aset', module_id: 'khairat', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'aset', module_id: 'pentadbiran', can_view: false, can_create: false, can_edit: false, can_delete: false },

      // PEGAWAI
      { role: 'pegawai', module_id: 'dashboard', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'pegawai', module_id: 'penjadualan', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'pegawai', module_id: 'aset', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'pegawai', module_id: 'kewangan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'pegawai', module_id: 'laporan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'pegawai', module_id: 'aktiviti', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'pegawai', module_id: 'khairat', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'pegawai', module_id: 'pentadbiran', can_view: false, can_create: false, can_edit: false, can_delete: false },

      // IMAM (Petugas)
      { role: 'imam', module_id: 'dashboard', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam', module_id: 'penjadualan', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam', module_id: 'aset', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam', module_id: 'kewangan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam', module_id: 'laporan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam', module_id: 'aktiviti', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam', module_id: 'khairat', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam', module_id: 'pentadbiran', can_view: false, can_create: false, can_edit: false, can_delete: false },

      // BILAL (Petugas)
      { role: 'bilal', module_id: 'dashboard', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal', module_id: 'penjadualan', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal', module_id: 'aset', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal', module_id: 'kewangan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal', module_id: 'laporan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal', module_id: 'aktiviti', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal', module_id: 'khairat', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal', module_id: 'pentadbiran', can_view: false, can_create: false, can_edit: false, can_delete: false },

      // IMAM_JUMAAT (Petugas)
      { role: 'imam_jumaat', module_id: 'dashboard', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam_jumaat', module_id: 'penjadualan', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam_jumaat', module_id: 'aset', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam_jumaat', module_id: 'kewangan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam_jumaat', module_id: 'laporan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam_jumaat', module_id: 'aktiviti', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam_jumaat', module_id: 'khairat', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'imam_jumaat', module_id: 'pentadbiran', can_view: false, can_create: false, can_edit: false, can_delete: false },

      // BILAL_JUMAAT (Petugas)
      { role: 'bilal_jumaat', module_id: 'dashboard', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal_jumaat', module_id: 'penjadualan', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal_jumaat', module_id: 'aset', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal_jumaat', module_id: 'kewangan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal_jumaat', module_id: 'laporan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal_jumaat', module_id: 'aktiviti', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal_jumaat', module_id: 'khairat', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'bilal_jumaat', module_id: 'pentadbiran', can_view: false, can_create: false, can_edit: false, can_delete: false },

      // PENCERAMAH (Petugas)
      { role: 'penceramah', module_id: 'dashboard', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'penceramah', module_id: 'penjadualan', can_view: true, can_create: false, can_edit: false, can_delete: false },
      { role: 'penceramah', module_id: 'aset', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'penceramah', module_id: 'kewangan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'penceramah', module_id: 'laporan', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'penceramah', module_id: 'aktiviti', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'penceramah', module_id: 'khairat', can_view: false, can_create: false, can_edit: false, can_delete: false },
      { role: 'penceramah', module_id: 'pentadbiran', can_view: false, can_create: false, can_edit: false, can_delete: false },
    ];

    for (const perm of rolePermissions) {
      await pool.query(
        `INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_delete = VALUES(can_delete)`,
        [perm.role, perm.module_id, perm.can_view, perm.can_create, perm.can_edit, perm.can_delete]
      );
    }
    results.push(`${rolePermissions.length} role permissions inserted/updated`);

    return NextResponse.json({
      success: true,
      message: 'RBAC tables setup completed',
      results
    });

  } catch (error: any) {
    console.error('Setup RBAC error:', error);
    return NextResponse.json({
      error: 'Failed to setup RBAC tables',
      details: error.message
    }, { status: 500 });
  }
}

// GET - Check if RBAC tables exist
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if tables exist
    const [modulesTable] = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'modules'
    `) as any[];

    const [permissionsTable] = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'role_permissions'
    `) as any[];

    const modulesExists = modulesTable[0].count > 0;
    const permissionsExists = permissionsTable[0].count > 0;

    let modulesCount = 0;
    let permissionsCount = 0;

    if (modulesExists) {
      const [count] = await pool.query('SELECT COUNT(*) as count FROM modules') as any[];
      modulesCount = count[0].count;
    }

    if (permissionsExists) {
      const [count] = await pool.query('SELECT COUNT(*) as count FROM role_permissions') as any[];
      permissionsCount = count[0].count;
    }

    return NextResponse.json({
      tables: {
        modules: { exists: modulesExists, count: modulesCount },
        role_permissions: { exists: permissionsExists, count: permissionsCount }
      },
      ready: modulesExists && permissionsExists && modulesCount > 0 && permissionsCount > 0
    });

  } catch (error: any) {
    console.error('Check RBAC error:', error);
    return NextResponse.json({
      error: 'Failed to check RBAC tables',
      details: error.message
    }, { status: 500 });
  }
}
