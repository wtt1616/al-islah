import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

interface CustomRole extends RowDataPacket {
  id: number;
  role_key: string;
  role_label: string;
  category: 'pengguna_dalaman' | 'petugas';
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// GET - Fetch all custom roles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = 'SELECT * FROM custom_roles WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (activeOnly) {
      query += ' AND is_active = TRUE';
    }

    query += ' ORDER BY category, role_label';

    const [roles] = await pool.query<CustomRole[]>(query, params);

    return NextResponse.json({ data: roles });
  } catch (error) {
    console.error('Error fetching custom roles:', error);
    return NextResponse.json({ error: 'Failed to fetch custom roles' }, { status: 500 });
  }
}

// POST - Create new custom role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role_key, role_label, category, description } = body;

    // Validation
    if (!role_key || !role_label || !category) {
      return NextResponse.json(
        { error: 'role_key, role_label, dan category diperlukan' },
        { status: 400 }
      );
    }

    // Validate role_key format (lowercase, no spaces, alphanumeric with underscore)
    if (!/^[a-z][a-z0-9_]*$/.test(role_key)) {
      return NextResponse.json(
        { error: 'role_key mesti bermula dengan huruf kecil dan hanya mengandungi huruf kecil, nombor, dan underscore' },
        { status: 400 }
      );
    }

    // Check for reserved role keys
    const reservedRoles = ['admin', 'bendahari', 'aset', 'pegawai', 'imam', 'bilal', 'imam_jumaat', 'bilal_jumaat', 'penceramah', 'head_imam'];
    if (reservedRoles.includes(role_key)) {
      return NextResponse.json(
        { error: 'role_key ini adalah peranan sistem dan tidak boleh digunakan' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM custom_roles WHERE role_key = ?',
      [role_key]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'role_key sudah wujud' },
        { status: 400 }
      );
    }

    // Insert new role
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO custom_roles (role_key, role_label, category, description) VALUES (?, ?, ?, ?)`,
      [role_key, role_label, category, description || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Peranan baru berjaya ditambah',
      id: result.insertId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating custom role:', error);
    return NextResponse.json({ error: 'Gagal menambah peranan baru' }, { status: 500 });
  }
}

// PUT - Update custom role
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, role_label, description, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'id diperlukan' }, { status: 400 });
    }

    // Check if role exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM custom_roles WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Peranan tidak dijumpai' }, { status: 404 });
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (role_label !== undefined) {
      updates.push('role_label = ?');
      params.push(role_label);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Tiada data untuk dikemaskini' }, { status: 400 });
    }

    params.push(id);

    await pool.query(
      `UPDATE custom_roles SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return NextResponse.json({
      success: true,
      message: 'Peranan berjaya dikemaskini'
    });
  } catch (error) {
    console.error('Error updating custom role:', error);
    return NextResponse.json({ error: 'Gagal mengemaskini peranan' }, { status: 500 });
  }
}

// DELETE - Delete custom role
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id diperlukan' }, { status: 400 });
    }

    // Check if role exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT role_key FROM custom_roles WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Peranan tidak dijumpai' }, { status: 404 });
    }

    const roleKey = existing[0].role_key;

    // Check if any users are using this role
    const [usersWithRole] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE role = ?',
      [roleKey]
    );

    if (usersWithRole[0].count > 0) {
      return NextResponse.json(
        { error: `Tidak boleh padam peranan ini kerana ${usersWithRole[0].count} pengguna masih menggunakannya` },
        { status: 400 }
      );
    }

    // Delete the role
    await pool.query('DELETE FROM custom_roles WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Peranan berjaya dipadam'
    });
  } catch (error) {
    console.error('Error deleting custom role:', error);
    return NextResponse.json({ error: 'Gagal memadam peranan' }, { status: 500 });
  }
}
