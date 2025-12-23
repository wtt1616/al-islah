import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET all asset locations
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const aktif = searchParams.get('aktif');

    let query = `
      SELECT
        l.*,
        (SELECT COUNT(*) FROM harta_modal WHERE lokasi_id = l.id) as jumlah_harta_modal,
        (SELECT COUNT(*) FROM inventory WHERE lokasi_id = l.id) as jumlah_inventori
      FROM lokasi_aset l
    `;

    if (aktif === 'true') {
      query += ' WHERE l.aktif = TRUE';
    }

    query += ' ORDER BY l.kod_lokasi ASC';

    const [rows] = await pool.execute<RowDataPacket[]>(query);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching lokasi aset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lokasi aset' },
      { status: 500 }
    );
  }
}

// POST - Create new location
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
    const { kod_lokasi, nama_lokasi, keterangan, pegawai_bertanggungjawab, no_tel_pegawai } = body;

    if (!kod_lokasi || !nama_lokasi) {
      return NextResponse.json(
        { error: 'Kod lokasi dan nama lokasi diperlukan' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Check if kod_lokasi already exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM lokasi_aset WHERE kod_lokasi = ?',
      [kod_lokasi]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Kod lokasi sudah wujud' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO lokasi_aset (kod_lokasi, nama_lokasi, keterangan, pegawai_bertanggungjawab, no_tel_pegawai, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [kod_lokasi, nama_lokasi, keterangan || null, pegawai_bertanggungjawab || null, no_tel_pegawai || null, userId]
    );

    return NextResponse.json({
      message: 'Lokasi aset berjaya ditambah',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Error creating lokasi aset:', error);
    return NextResponse.json(
      { error: 'Failed to create lokasi aset' },
      { status: 500 }
    );
  }
}

// PUT - Update location
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
    const { id, kod_lokasi, nama_lokasi, keterangan, pegawai_bertanggungjawab, no_tel_pegawai, aktif } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    // Check if kod_lokasi already exists (excluding current record)
    if (kod_lokasi) {
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM lokasi_aset WHERE kod_lokasi = ? AND id != ?',
        [kod_lokasi, id]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Kod lokasi sudah wujud' },
          { status: 400 }
        );
      }
    }

    await pool.execute(
      `UPDATE lokasi_aset
       SET kod_lokasi = ?, nama_lokasi = ?, keterangan = ?,
           pegawai_bertanggungjawab = ?, no_tel_pegawai = ?, aktif = ?
       WHERE id = ?`,
      [kod_lokasi, nama_lokasi, keterangan || null, pegawai_bertanggungjawab || null, no_tel_pegawai || null, aktif !== false, id]
    );

    return NextResponse.json({ message: 'Lokasi aset berjaya dikemaskini' });
  } catch (error) {
    console.error('Error updating lokasi aset:', error);
    return NextResponse.json(
      { error: 'Failed to update lokasi aset' },
      { status: 500 }
    );
  }
}

// DELETE - Delete location
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    // Check if location is in use
    const [inUse] = await pool.execute<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM harta_modal WHERE lokasi_id = ?) as harta_modal_count,
        (SELECT COUNT(*) FROM inventory WHERE lokasi_id = ?) as inventory_count`,
      [id, id]
    );

    if (inUse[0].harta_modal_count > 0 || inUse[0].inventory_count > 0) {
      return NextResponse.json(
        { error: 'Lokasi ini masih digunakan oleh aset. Sila pindahkan aset terlebih dahulu.' },
        { status: 400 }
      );
    }

    await pool.execute('DELETE FROM lokasi_aset WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Lokasi aset berjaya dipadam' });
  } catch (error) {
    console.error('Error deleting lokasi aset:', error);
    return NextResponse.json(
      { error: 'Failed to delete lokasi aset' },
      { status: 500 }
    );
  }
}
