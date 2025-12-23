import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Fetch all pembayaran categories with optional sub-categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeSubcategories = searchParams.get('include_subcategories') === 'true';
    const activeOnly = searchParams.get('active_only') !== 'false';

    let query = `
      SELECT id, nama_kategori, kod_kategori, penerangan, aktif, urutan
      FROM kategori_pembayaran
    `;

    if (activeOnly) {
      query += ' WHERE aktif = TRUE';
    }

    query += ' ORDER BY urutan ASC, nama_kategori ASC';

    const [categories] = await pool.query<RowDataPacket[]>(query);

    if (includeSubcategories) {
      // Fetch sub-kategori1 for each category
      for (const category of categories) {
        let subQuery = `
          SELECT id, nama_subkategori, kod_subkategori, penerangan, aktif, urutan
          FROM subkategori1_pembayaran
          WHERE kategori_id = ?
        `;
        if (activeOnly) {
          subQuery += ' AND aktif = TRUE';
        }
        subQuery += ' ORDER BY urutan ASC, nama_subkategori ASC';

        const [subcategories1] = await pool.query<RowDataPacket[]>(subQuery, [category.id]);

        // Fetch sub-kategori2 for each sub-kategori1
        for (const sub1 of subcategories1) {
          let sub2Query = `
            SELECT id, nama_subkategori, kod_subkategori, penerangan, aktif, urutan
            FROM subkategori2_pembayaran
            WHERE subkategori1_id = ?
          `;
          if (activeOnly) {
            sub2Query += ' AND aktif = TRUE';
          }
          sub2Query += ' ORDER BY urutan ASC, nama_subkategori ASC';

          const [subcategories2] = await pool.query<RowDataPacket[]>(sub2Query, [sub1.id]);
          (sub1 as any).subcategories2 = subcategories2;
        }

        (category as any).subcategories1 = subcategories1;
      }
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching pembayaran categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST - Create new pembayaran category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'bendahari'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nama_kategori, kod_kategori, penerangan, urutan } = body;

    if (!nama_kategori || !kod_kategori) {
      return NextResponse.json({ error: 'nama_kategori and kod_kategori are required' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO kategori_pembayaran (nama_kategori, kod_kategori, penerangan, urutan)
       VALUES (?, ?, ?, ?)`,
      [nama_kategori, kod_kategori, penerangan || null, urutan || 0]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Kategori pembayaran berjaya ditambah'
    });
  } catch (error: any) {
    console.error('Error creating pembayaran category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Kategori dengan nama atau kod ini sudah wujud' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// PUT - Update pembayaran category
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'bendahari'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, nama_kategori, kod_kategori, penerangan, aktif, urutan } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE kategori_pembayaran
       SET nama_kategori = ?, kod_kategori = ?, penerangan = ?, aktif = ?, urutan = ?
       WHERE id = ?`,
      [nama_kategori, kod_kategori, penerangan || null, aktif ?? true, urutan || 0, id]
    );

    return NextResponse.json({ success: true, message: 'Kategori berjaya dikemaskini' });
  } catch (error: any) {
    console.error('Error updating pembayaran category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Kategori dengan nama atau kod ini sudah wujud' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE - Delete pembayaran category
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'bendahari'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await pool.execute('DELETE FROM kategori_pembayaran WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Kategori berjaya dipadam' });
  } catch (error) {
    console.error('Error deleting pembayaran category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
