import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface KategoriRow extends RowDataPacket {
  id: number;
  nama_kategori: string;
  kod_kategori: string;
  penerangan: string | null;
  ada_subkategori: boolean;
  perlu_maklumat_pelaburan: boolean;
  aktif: boolean;
  urutan: number;
  created_at: Date;
  updated_at: Date;
}

interface SubkategoriRow extends RowDataPacket {
  id: number;
  kategori_id: number;
  nama_subkategori: string;
  kod_subkategori: string;
  penerangan: string | null;
  aktif: boolean;
  urutan: number;
  created_at: Date;
  updated_at: Date;
}

// GET - Fetch all categories with their sub-categories
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
    const includeInactive = searchParams.get('include_inactive') === 'true';

    // Fetch categories
    let categoryQuery = 'SELECT * FROM kategori_penerimaan';
    if (!includeInactive) {
      categoryQuery += ' WHERE aktif = TRUE';
    }
    categoryQuery += ' ORDER BY urutan ASC, nama_kategori ASC';

    const [categories] = await pool.query<KategoriRow[]>(categoryQuery);

    // Fetch sub-categories for each category
    const categoriesWithSubs = await Promise.all(
      categories.map(async (category) => {
        let subQuery = 'SELECT * FROM subkategori_penerimaan WHERE kategori_id = ?';
        if (!includeInactive) {
          subQuery += ' AND aktif = TRUE';
        }
        subQuery += ' ORDER BY urutan ASC, nama_subkategori ASC';

        const [subCategories] = await pool.query<SubkategoriRow[]>(subQuery, [category.id]);

        return {
          ...category,
          subkategori: subCategories
        };
      })
    );

    return NextResponse.json(categoriesWithSubs);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create new category
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
      nama_kategori,
      kod_kategori,
      penerangan,
      ada_subkategori,
      perlu_maklumat_pelaburan,
      urutan
    } = body;

    if (!nama_kategori || !kod_kategori) {
      return NextResponse.json(
        { error: 'Nama kategori and kod kategori are required' },
        { status: 400 }
      );
    }

    // Check for duplicate kod_kategori
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM kategori_penerimaan WHERE kod_kategori = ?',
      [kod_kategori]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Kod kategori already exists' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO kategori_penerimaan
       (nama_kategori, kod_kategori, penerangan, ada_subkategori, perlu_maklumat_pelaburan, urutan)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nama_kategori,
        kod_kategori,
        penerangan || null,
        ada_subkategori || false,
        perlu_maklumat_pelaburan || false,
        urutan || 0
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Category created successfully'
    });
  } catch (error: any) {
    console.error('Error creating category:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Nama kategori already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PUT - Update category
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
      nama_kategori,
      kod_kategori,
      penerangan,
      ada_subkategori,
      perlu_maklumat_pelaburan,
      aktif,
      urutan
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if kod_kategori is unique (excluding current category)
    if (kod_kategori) {
      const [existing] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM kategori_penerimaan WHERE kod_kategori = ? AND id != ?',
        [kod_kategori, id]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Kod kategori already exists' },
          { status: 400 }
        );
      }
    }

    await pool.query(
      `UPDATE kategori_penerimaan
       SET nama_kategori = COALESCE(?, nama_kategori),
           kod_kategori = COALESCE(?, kod_kategori),
           penerangan = ?,
           ada_subkategori = COALESCE(?, ada_subkategori),
           perlu_maklumat_pelaburan = COALESCE(?, perlu_maklumat_pelaburan),
           aktif = COALESCE(?, aktif),
           urutan = COALESCE(?, urutan)
       WHERE id = ?`,
      [
        nama_kategori,
        kod_kategori,
        penerangan,
        ada_subkategori,
        perlu_maklumat_pelaburan,
        aktif,
        urutan,
        id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating category:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Nama kategori or kod kategori already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
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
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category is used in transactions
    const [transactions] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM financial_transactions
       WHERE category_penerimaan = (SELECT nama_kategori FROM kategori_penerimaan WHERE id = ?)`,
      [id]
    );

    if (transactions[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that is used in transactions. Set to inactive instead.' },
        { status: 400 }
      );
    }

    await pool.query('DELETE FROM kategori_penerimaan WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
