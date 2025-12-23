import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export interface RolePermission {
  id: number;
  role: string;
  module_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  module_nama?: string;
  module_icon?: string;
  module_path?: string;
}

// GET - Fetch permissions (with optional role filter)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const moduleId = searchParams.get('module_id');
    const userId = searchParams.get('user_id');

    // If user_id provided, get user's role first then get permissions
    if (userId) {
      const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]) as any[];
      if (users.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const userRole = users[0].role;

      // Get permissions for user's role
      const [permissions] = await pool.query(`
        SELECT rp.*, m.nama as module_nama, m.icon as module_icon, m.path as module_path
        FROM role_permissions rp
        JOIN modules m ON rp.module_id = m.id
        WHERE rp.role = ? AND m.is_active = TRUE
        ORDER BY m.urutan ASC
      `, [userRole]) as any[];

      return NextResponse.json({ data: permissions, role: userRole });
    }

    // Build query based on filters
    let query = `
      SELECT rp.*, m.nama as module_nama, m.icon as module_icon, m.path as module_path
      FROM role_permissions rp
      JOIN modules m ON rp.module_id = m.id
      WHERE m.is_active = TRUE
    `;
    const params: any[] = [];

    if (role) {
      query += ' AND rp.role = ?';
      params.push(role);
    }

    if (moduleId) {
      query += ' AND rp.module_id = ?';
      params.push(moduleId);
    }

    query += ' ORDER BY rp.role, m.urutan ASC';

    const [permissions] = await pool.query(query, params) as any[];

    return NextResponse.json({ data: permissions });

  } catch (error: any) {
    console.error('Fetch permissions error:', error);
    return NextResponse.json({
      error: 'Failed to fetch permissions',
      details: error.message
    }, { status: 500 });
  }
}

// POST - Create or update permission (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role, module_id, can_view, can_create, can_edit, can_delete } = body;

    if (!role || !module_id) {
      return NextResponse.json({ error: 'Role dan module_id diperlukan' }, { status: 400 });
    }

    // Verify module exists
    const [modules] = await pool.query('SELECT id FROM modules WHERE id = ?', [module_id]) as any[];
    if (modules.length === 0) {
      return NextResponse.json({ error: 'Modul tidak ditemui' }, { status: 404 });
    }

    // Insert or update permission
    await pool.query(`
      INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        can_view = VALUES(can_view),
        can_create = VALUES(can_create),
        can_edit = VALUES(can_edit),
        can_delete = VALUES(can_delete),
        updated_at = CURRENT_TIMESTAMP
    `, [role, module_id, can_view ?? false, can_create ?? false, can_edit ?? false, can_delete ?? false]);

    return NextResponse.json({
      success: true,
      message: 'Kebenaran berjaya dikemaskini'
    });

  } catch (error: any) {
    console.error('Update permission error:', error);
    return NextResponse.json({
      error: 'Failed to update permission',
      details: error.message
    }, { status: 500 });
  }
}

// PUT - Bulk update permissions for a role (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role, permissions } = body;

    if (!role || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Role dan permissions array diperlukan' }, { status: 400 });
    }

    // Update each permission
    for (const perm of permissions) {
      const { module_id, can_view, can_create, can_edit, can_delete } = perm;

      if (!module_id) continue;

      await pool.query(`
        INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          can_view = VALUES(can_view),
          can_create = VALUES(can_create),
          can_edit = VALUES(can_edit),
          can_delete = VALUES(can_delete),
          updated_at = CURRENT_TIMESTAMP
      `, [role, module_id, can_view ?? false, can_create ?? false, can_edit ?? false, can_delete ?? false]);
    }

    return NextResponse.json({
      success: true,
      message: `Kebenaran untuk peranan "${role}" berjaya dikemaskini`
    });

  } catch (error: any) {
    console.error('Bulk update permissions error:', error);
    return NextResponse.json({
      error: 'Failed to update permissions',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete permission (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const role = searchParams.get('role');
    const moduleId = searchParams.get('module_id');

    if (id) {
      // Delete by ID
      await pool.query('DELETE FROM role_permissions WHERE id = ?', [id]);
    } else if (role && moduleId) {
      // Delete by role and module_id
      await pool.query('DELETE FROM role_permissions WHERE role = ? AND module_id = ?', [role, moduleId]);
    } else if (role) {
      // Delete all permissions for a role
      await pool.query('DELETE FROM role_permissions WHERE role = ?', [role]);
    } else {
      return NextResponse.json({ error: 'ID atau role+module_id diperlukan' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kebenaran berjaya dipadam'
    });

  } catch (error: any) {
    console.error('Delete permission error:', error);
    return NextResponse.json({
      error: 'Failed to delete permission',
      details: error.message
    }, { status: 500 });
  }
}
