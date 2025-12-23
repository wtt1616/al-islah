import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Fetch sub-kategori2 by sub-kategori1 ID or name
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subkategori1Id = searchParams.get('subkategori1_id');
    const subkategori1Nama = searchParams.get('subkategori1_nama');
    const kategoriNama = searchParams.get('kategori_nama');
    const activeOnly = searchParams.get('active_only') !== 'false';

    let query = `
      SELECT s2.id, s2.subkategori1_id, s2.nama_subkategori, s2.kod_subkategori,
             s2.penerangan, s2.aktif, s2.urutan, s1.nama_subkategori as parent_nama,
             k.nama_kategori
      FROM subkategori2_pembayaran s2
      JOIN subkategori1_pembayaran s1 ON s2.subkategori1_id = s1.id
      JOIN kategori_pembayaran k ON s1.kategori_id = k.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subkategori1Id) {
      query += ' AND s2.subkategori1_id = ?';
      params.push(subkategori1Id);
    }

    if (subkategori1Nama && kategoriNama) {
      query += ' AND s1.nama_subkategori = ? AND k.nama_kategori = ?';
      params.push(subkategori1Nama, kategoriNama);
    }

    if (activeOnly) {
      query += ' AND s2.aktif = TRUE';
    }

    query += ' ORDER BY s2.urutan ASC, s2.nama_subkategori ASC';

    const [subcategories] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json(subcategories);
  } catch (error) {
    console.error('Error fetching pembayaran subcategories2:', error);
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
  }
}

// POST - Create new sub-kategori2
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'bendahari'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subkategori1_id, nama_subkategori, kod_subkategori, penerangan, urutan } = body;

    if (!subkategori1_id || !nama_subkategori || !kod_subkategori) {
      return NextResponse.json({ error: 'subkategori1_id, nama_subkategori and kod_subkategori are required' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO subkategori2_pembayaran (subkategori1_id, nama_subkategori, kod_subkategori, penerangan, urutan)
       VALUES (?, ?, ?, ?, ?)`,
      [subkategori1_id, nama_subkategori, kod_subkategori, penerangan || null, urutan || 0]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Sub-kategori 2 berjaya ditambah'
    });
  } catch (error: any) {
    console.error('Error creating pembayaran subcategory2:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Sub-kategori dengan nama ini sudah wujud untuk sub-kategori 1 ini' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 });
  }
}

// PUT - Update sub-kategori2
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
      `UPDATE subkategori2_pembayaran
       SET nama_subkategori = ?, kod_subkategori = ?, penerangan = ?, aktif = ?, urutan = ?
       WHERE id = ?`,
      [nama_subkategori, kod_subkategori, penerangan || null, aktif ?? true, urutan || 0, id]
    );

    return NextResponse.json({ success: true, message: 'Sub-kategori 2 berjaya dikemaskini' });
  } catch (error: any) {
    console.error('Error updating pembayaran subcategory2:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Sub-kategori dengan nama ini sudah wujud untuk sub-kategori 1 ini' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 });
  }
}

// DELETE - Delete sub-kategori2
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

    await pool.execute('DELETE FROM subkategori2_pembayaran WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Sub-kategori 2 berjaya dipadam' });
  } catch (error) {
    console.error('Error deleting pembayaran subcategory2:', error);
    return NextResponse.json({ error: 'Failed to delete subcategory' }, { status: 500 });
  }
}
