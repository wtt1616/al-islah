import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export interface Module {
  id: string;
  nama: string;
  icon: string;
  path: string;
  urutan: number;
  is_active: boolean;
  created_at: Date;
}

// GET - Fetch all modules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = 'SELECT * FROM modules';
    if (activeOnly) {
      query += ' WHERE is_active = TRUE';
    }
    query += ' ORDER BY urutan ASC';

    const [modules] = await pool.query(query) as any[];

    return NextResponse.json({ data: modules });

  } catch (error: any) {
    console.error('Fetch modules error:', error);
    return NextResponse.json({
      error: 'Failed to fetch modules',
      details: error.message
    }, { status: 500 });
  }
}

// POST - Create new module (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, nama, icon, path, urutan } = body;

    if (!id || !nama) {
      return NextResponse.json({ error: 'ID dan nama diperlukan' }, { status: 400 });
    }

    // Check if module ID already exists
    const [existing] = await pool.query('SELECT id FROM modules WHERE id = ?', [id]) as any[];
    if (existing.length > 0) {
      return NextResponse.json({ error: 'ID modul sudah wujud' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO modules (id, nama, icon, path, urutan, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [id, nama, icon || 'bi-grid', path || '', urutan || 0]
    );

    return NextResponse.json({
      success: true,
      message: 'Modul berjaya ditambah'
    });

  } catch (error: any) {
    console.error('Create module error:', error);
    return NextResponse.json({
      error: 'Failed to create module',
      details: error.message
    }, { status: 500 });
  }
}

// PUT - Update module (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, nama, icon, path, urutan, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID modul diperlukan' }, { status: 400 });
    }

    // Check if module exists
    const [existing] = await pool.query('SELECT id FROM modules WHERE id = ?', [id]) as any[];
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Modul tidak ditemui' }, { status: 404 });
    }

    await pool.query(
      `UPDATE modules SET nama = ?, icon = ?, path = ?, urutan = ?, is_active = ?
       WHERE id = ?`,
      [nama, icon, path, urutan, is_active, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Modul berjaya dikemaskini'
    });

  } catch (error: any) {
    console.error('Update module error:', error);
    return NextResponse.json({
      error: 'Failed to update module',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete module (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID modul diperlukan' }, { status: 400 });
    }

    // Check if module exists
    const [existing] = await pool.query('SELECT id FROM modules WHERE id = ?', [id]) as any[];
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Modul tidak ditemui' }, { status: 404 });
    }

    // Delete module (cascade will delete role_permissions)
    await pool.query('DELETE FROM modules WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Modul berjaya dipadam'
    });

  } catch (error: any) {
    console.error('Delete module error:', error);
    return NextResponse.json({
      error: 'Failed to delete module',
      details: error.message
    }, { status: 500 });
  }
}
