import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET all asset categories
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const jenisAset = searchParams.get('jenis_aset');
    const aktif = searchParams.get('aktif');

    let query = 'SELECT * FROM kategori_aset WHERE 1=1';
    const params: any[] = [];

    if (jenisAset && jenisAset !== 'all') {
      query += ' AND (jenis_aset = ? OR jenis_aset = ?)';
      params.push(jenisAset, 'Kedua-dua');
    }

    if (aktif === 'true') {
      query += ' AND aktif = TRUE';
    }

    query += ' ORDER BY kod_kategori ASC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching kategori aset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kategori aset' },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (!['admin', 'inventory_staff'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { kod_kategori, nama_kategori, jenis_aset, keterangan } = body;

    if (!kod_kategori || !nama_kategori) {
      return NextResponse.json(
        { error: 'Kod kategori dan nama kategori diperlukan' },
        { status: 400 }
      );
    }

    // Check if kod_kategori already exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM kategori_aset WHERE kod_kategori = ?',
      [kod_kategori]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Kod kategori sudah wujud' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO kategori_aset (kod_kategori, nama_kategori, jenis_aset, keterangan)
       VALUES (?, ?, ?, ?)`,
      [kod_kategori, nama_kategori, jenis_aset || 'Kedua-dua', keterangan || null]
    );

    return NextResponse.json({
      message: 'Kategori aset berjaya ditambah',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Error creating kategori aset:', error);
    return NextResponse.json(
      { error: 'Failed to create kategori aset' },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (!['admin', 'inventory_staff'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, kod_kategori, nama_kategori, jenis_aset, keterangan, aktif } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    // Check if kod_kategori already exists (excluding current record)
    if (kod_kategori) {
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM kategori_aset WHERE kod_kategori = ? AND id != ?',
        [kod_kategori, id]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Kod kategori sudah wujud' },
          { status: 400 }
        );
      }
    }

    await pool.execute(
      `UPDATE kategori_aset
       SET kod_kategori = ?, nama_kategori = ?, jenis_aset = ?, keterangan = ?, aktif = ?
       WHERE id = ?`,
      [kod_kategori, nama_kategori, jenis_aset || 'Kedua-dua', keterangan || null, aktif !== false, id]
    );

    return NextResponse.json({ message: 'Kategori aset berjaya dikemaskini' });
  } catch (error) {
    console.error('Error updating kategori aset:', error);
    return NextResponse.json(
      { error: 'Failed to update kategori aset' },
      { status: 500 }
    );
  }
}
