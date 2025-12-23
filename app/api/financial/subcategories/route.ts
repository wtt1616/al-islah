import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Fetch sub-categories (optionally filtered by category_id)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin, head_imam, and bendahari can access
    if (!['admin', 'head_imam', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const kategoriId = searchParams.get('kategori_id');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let query = 'SELECT * FROM subkategori_penerimaan';
    const params: any[] = [];
    const conditions: string[] = [];

    if (kategoriId) {
      conditions.push('kategori_id = ?');
      params.push(kategoriId);
    }

    if (!includeInactive) {
      conditions.push('aktif = TRUE');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY urutan ASC, nama_subkategori ASC';

    const [subCategories] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json(subCategories);
  } catch (error) {
    console.error('Error fetching sub-categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sub-categories' },
      { status: 500 }
    );
  }
}

// POST - Create new sub-category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only bendahari and admin can create
    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      kategori_id,
      nama_subkategori,
      kod_subkategori,
      penerangan,
      urutan
    } = body;

    if (!kategori_id || !nama_subkategori || !kod_subkategori) {
      return NextResponse.json(
        { error: 'Kategori ID, nama subkategori, and kod subkategori are required' },
        { status: 400 }
      );
    }

    // Check if parent category exists
    const [category] = await pool.query<RowDataPacket[]>(
      'SELECT id, ada_subkategori FROM kategori_penerimaan WHERE id = ?',
      [kategori_id]
    );

    if (category.length === 0) {
      return NextResponse.json(
        { error: 'Parent category not found' },
        { status: 404 }
      );
    }

    // If category doesn't have ada_subkategori flag, update it
    if (!category[0].ada_subkategori) {
      await pool.query(
        'UPDATE kategori_penerimaan SET ada_subkategori = TRUE WHERE id = ?',
        [kategori_id]
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO subkategori_penerimaan
       (kategori_id, nama_subkategori, kod_subkategori, penerangan, urutan)
       VALUES (?, ?, ?, ?, ?)`,
      [
        kategori_id,
        nama_subkategori,
        kod_subkategori,
        penerangan || null,
        urutan || 0
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Sub-category created successfully'
    });
  } catch (error: any) {
    console.error('Error creating sub-category:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Sub-category already exists for this category' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create sub-category' },
      { status: 500 }
    );
  }
}

// PUT - Update sub-category
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only bendahari and admin can update
    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      nama_subkategori,
      kod_subkategori,
      penerangan,
      aktif,
      urutan
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Sub-category ID is required' },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE subkategori_penerimaan
       SET nama_subkategori = COALESCE(?, nama_subkategori),
           kod_subkategori = COALESCE(?, kod_subkategori),
           penerangan = ?,
           aktif = COALESCE(?, aktif),
           urutan = COALESCE(?, urutan)
       WHERE id = ?`,
      [
        nama_subkategori,
        kod_subkategori,
        penerangan,
        aktif,
        urutan,
        id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Sub-category updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating sub-category:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Sub-category name already exists for this category' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update sub-category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete sub-category
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only bendahari and admin can delete
    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Sub-category ID is required' },
        { status: 400 }
      );
    }

    // Check if sub-category is used in transactions
    const [transactions] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM financial_transactions
       WHERE sub_category_penerimaan = (SELECT nama_subkategori FROM subkategori_penerimaan WHERE id = ?)`,
      [id]
    );

    if (transactions[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete sub-category that is used in transactions. Set to inactive instead.' },
        { status: 400 }
      );
    }

    await pool.query('DELETE FROM subkategori_penerimaan WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Sub-category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sub-category:', error);
    return NextResponse.json(
      { error: 'Failed to delete sub-category' },
      { status: 500 }
    );
  }
}
