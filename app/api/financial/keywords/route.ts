import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { RujukanKategori } from '@/types';

// GET - Fetch all keywords or filter by jenis_transaksi
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only bendahari, admin, and head_imam can access
    if (!['bendahari', 'admin', 'head_imam'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const jenisTransaksi = searchParams.get('jenis_transaksi');

    let query = 'SELECT * FROM rujukan_kategori';
    const params: any[] = [];

    if (jenisTransaksi && (jenisTransaksi === 'penerimaan' || jenisTransaksi === 'pembayaran')) {
      query += ' WHERE jenis_transaksi = ?';
      params.push(jenisTransaksi);
    }

    query += ' ORDER BY jenis_transaksi, kategori_nama, keyword';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

// POST - Create new keyword
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only bendahari can create keywords
    if (!['bendahari', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { jenis_transaksi, kategori_nama, keyword, aktif = true } = body;

    // Validation
    if (!jenis_transaksi || !kategori_nama || !keyword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (jenis_transaksi !== 'penerimaan' && jenis_transaksi !== 'pembayaran') {
      return NextResponse.json(
        { error: 'Invalid jenis_transaksi' },
        { status: 400 }
      );
    }

    // Check for duplicate keyword
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM rujukan_kategori WHERE jenis_transaksi = ? AND keyword = ? AND kategori_nama = ?',
      [jenis_transaksi, keyword, kategori_nama]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Keyword already exists for this category' },
        { status: 409 }
      );
    }

    // Insert new keyword
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES (?, ?, ?, ?)',
      [jenis_transaksi, kategori_nama, keyword, aktif]
    );

    return NextResponse.json(
      {
        message: 'Keyword created successfully',
        id: result.insertId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating keyword:', error);
    return NextResponse.json(
      { error: 'Failed to create keyword' },
      { status: 500 }
    );
  }
}

// PUT - Update keyword
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only bendahari can update keywords
    if (!['bendahari', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, jenis_transaksi, kategori_nama, keyword, aktif } = body;

    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'Missing keyword ID' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (jenis_transaksi) {
      if (jenis_transaksi !== 'penerimaan' && jenis_transaksi !== 'pembayaran') {
        return NextResponse.json(
          { error: 'Invalid jenis_transaksi' },
          { status: 400 }
        );
      }
      updates.push('jenis_transaksi = ?');
      params.push(jenis_transaksi);
    }

    if (kategori_nama) {
      updates.push('kategori_nama = ?');
      params.push(kategori_nama);
    }

    if (keyword) {
      updates.push('keyword = ?');
      params.push(keyword);
    }

    if (typeof aktif === 'boolean') {
      updates.push('aktif = ?');
      params.push(aktif);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    params.push(id);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE rujukan_kategori SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Keyword updated successfully' });
  } catch (error) {
    console.error('Error updating keyword:', error);
    return NextResponse.json(
      { error: 'Failed to update keyword' },
      { status: 500 }
    );
  }
}

// DELETE - Delete keyword
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only bendahari can delete keywords
    if (!['bendahari', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing keyword ID' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM rujukan_kategori WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Keyword deleted successfully' });
  } catch (error) {
    console.error('Error deleting keyword:', error);
    return NextResponse.json(
      { error: 'Failed to delete keyword' },
      { status: 500 }
    );
  }
}
