import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

// GET - Get all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = 'SELECT * FROM k2u_categories';
    if (!includeInactive) {
      query += ' WHERE is_active = TRUE';
    }
    query += ' ORDER BY urutan ASC';

    const [categories] = await pool.query<RowDataPacket[]>(query);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST - Create new category (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'head_imam'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nama, icon, urutan } = await request.json();

    if (!nama) {
      return NextResponse.json({ error: 'Nama kategori diperlukan' }, { status: 400 });
    }

    // Get max urutan if not provided
    let categoryOrder = urutan;
    if (!categoryOrder) {
      const [maxResult] = await pool.query<RowDataPacket[]>(
        'SELECT COALESCE(MAX(urutan), 0) + 1 as next_urutan FROM k2u_categories'
      );
      categoryOrder = maxResult[0].next_urutan;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO k2u_categories (nama, icon, urutan, is_active) VALUES (?, ?, ?, TRUE)',
      [nama, icon || 'bi-tag', categoryOrder]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Kategori berjaya ditambah'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// PUT - Update category (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'head_imam'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, nama, icon, urutan, is_active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID kategori diperlukan' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (nama !== undefined) {
      updates.push('nama = ?');
      params.push(nama);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }
    if (urutan !== undefined) {
      updates.push('urutan = ?');
      params.push(urutan);
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
      `UPDATE k2u_categories SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return NextResponse.json({
      success: true,
      message: 'Kategori berjaya dikemaskini'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE - Delete category (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'head_imam'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID kategori diperlukan' }, { status: 400 });
    }

    // Check if category has products
    const [products] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM k2u_products WHERE category_id = ?',
      [id]
    );

    if (products[0].count > 0) {
      // Soft delete - just mark as inactive
      await pool.query('UPDATE k2u_categories SET is_active = FALSE WHERE id = ?', [id]);
      return NextResponse.json({
        success: true,
        message: 'Kategori dinyahaktifkan kerana masih ada produk'
      });
    }

    // Hard delete if no products
    await pool.query('DELETE FROM k2u_categories WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Kategori berjaya dipadam'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
