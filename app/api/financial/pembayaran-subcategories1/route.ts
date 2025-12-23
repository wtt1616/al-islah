import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Fetch sub-kategori1 by category ID or all
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kategoriId = searchParams.get('kategori_id');
    const kategoriNama = searchParams.get('kategori_nama');
    const activeOnly = searchParams.get('active_only') !== 'false';

    let query = `
      SELECT s1.id, s1.kategori_id, s1.nama_subkategori, s1.kod_subkategori,
             s1.penerangan, s1.aktif, s1.urutan, k.nama_kategori
      FROM subkategori1_pembayaran s1
      JOIN kategori_pembayaran k ON s1.kategori_id = k.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (kategoriId) {
      query += ' AND s1.kategori_id = ?';
      params.push(kategoriId);
    }

    if (kategoriNama) {
      query += ' AND k.nama_kategori = ?';
      params.push(kategoriNama);
    }

    if (activeOnly) {
      query += ' AND s1.aktif = TRUE';
    }

    query += ' ORDER BY s1.urutan ASC, s1.nama_subkategori ASC';

    const [subcategories] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json(subcategories);
  } catch (error) {
    console.error('Error fetching pembayaran subcategories1:', error);
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
  }
}

// POST - Create new sub-kategori1
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'bendahari'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { kategori_id, nama_subkategori, kod_subkategori, penerangan, urutan } = body;

    if (!kategori_id || !nama_subkategori || !kod_subkategori) {
      return NextResponse.json({ error: 'kategori_id, nama_subkategori and kod_subkategori are required' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO subkategori1_pembayaran (kategori_id, nama_subkategori, kod_subkategori, penerangan, urutan)
       VALUES (?, ?, ?, ?, ?)`,
      [kategori_id, nama_subkategori, kod_subkategori, penerangan || null, urutan || 0]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Sub-kategori 1 berjaya ditambah'
    });
  } catch (error: any) {
    console.error('Error creating pembayaran subcategory1:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Sub-kategori dengan nama ini sudah wujud untuk kategori ini' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 });
  }
}

// PUT - Update sub-kategori1
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'bendahari'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, nama_subkategori, kod_subkategori, penerangan, aktif, urutan } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE subkategori1_pembayaran
       SET nama_subkategori = ?, kod_subkategori = ?, penerangan = ?, aktif = ?, urutan = ?
       WHERE id = ?`,
      [nama_subkategori, kod_subkategori, penerangan || null, aktif ?? true, urutan || 0, id]
    );

    return NextResponse.json({ success: true, message: 'Sub-kategori 1 berjaya dikemaskini' });
  } catch (error: any) {
    console.error('Error updating pembayaran subcategory1:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Sub-kategori dengan nama ini sudah wujud untuk kategori ini' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 });
  }
}

// DELETE - Delete sub-kategori1
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

    await pool.execute('DELETE FROM subkategori1_pembayaran WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Sub-kategori 1 berjaya dipadam' });
  } catch (error) {
    console.error('Error deleting pembayaran subcategory1:', error);
    return NextResponse.json({ error: 'Failed to delete subcategory' }, { status: 500 });
  }
}
