import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET all penyelenggaraan records
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const tahun = searchParams.get('tahun');
    const jenisAset = searchParams.get('jenis_aset');
    const status = searchParams.get('status');

    let query = `
      SELECT
        p.*,
        pelaksana.name as nama_pelaksana,
        pengesah.name as nama_pengesah,
        CASE
          WHEN p.jenis_aset = 'Harta Modal' THEN (SELECT keterangan FROM harta_modal WHERE id = p.aset_id)
          ELSE (SELECT keterangan FROM inventory WHERE id = p.aset_id)
        END as keterangan_aset
      FROM penyelenggaraan_aset p
      LEFT JOIN users pelaksana ON p.dilaksana_oleh = pelaksana.id
      LEFT JOIN users pengesah ON p.disahkan_oleh = pengesah.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tahun) {
      query += ' AND YEAR(p.tarikh_penyelenggaraan) = ?';
      params.push(tahun);
    }

    if (jenisAset) {
      query += ' AND p.jenis_aset = ?';
      params.push(jenisAset);
    }

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.tarikh_penyelenggaraan DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    // Get summary
    const [summary] = await pool.execute<RowDataPacket[]>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN status = 'Dalam Proses' THEN 1 ELSE 0 END) as dalam_proses,
        COALESCE(SUM(kos), 0) as jumlah_kos
      FROM penyelenggaraan_aset
      WHERE YEAR(tarikh_penyelenggaraan) = YEAR(CURDATE())
    `);

    return NextResponse.json({
      data: rows,
      summary: summary[0]
    });
  } catch (error) {
    console.error('Error fetching penyelenggaraan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch penyelenggaraan' },
      { status: 500 }
    );
  }
}

// POST - Create penyelenggaraan record
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
    const {
      jenis_aset,
      aset_id,
      no_siri_pendaftaran,
      tarikh_penyelenggaraan,
      jenis_penyelenggaraan,
      keterangan_kerja,
      nama_kontraktor,
      no_tel_kontraktor,
      kos,
      no_resit,
      catatan
    } = body;

    if (!jenis_aset || !aset_id || !tarikh_penyelenggaraan || !jenis_penyelenggaraan || !keterangan_kerja) {
      return NextResponse.json(
        { error: 'Maklumat wajib tidak lengkap' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Update asset status to "Sedang Diselenggara"
    const tableName = jenis_aset === 'Harta Modal' ? 'harta_modal' : 'inventory';
    await pool.execute(
      `UPDATE ${tableName} SET status = 'Sedang Diselenggara' WHERE id = ?`,
      [aset_id]
    );

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO penyelenggaraan_aset
       (jenis_aset, aset_id, no_siri_pendaftaran, tarikh_penyelenggaraan,
        jenis_penyelenggaraan, keterangan_kerja, nama_kontraktor, no_tel_kontraktor,
        kos, no_resit, catatan, status, dilaksana_oleh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dalam Proses', ?)`,
      [jenis_aset, aset_id, no_siri_pendaftaran, tarikh_penyelenggaraan,
       jenis_penyelenggaraan, keterangan_kerja, nama_kontraktor || null,
       no_tel_kontraktor || null, kos || 0, no_resit || null, catatan || null, userId]
    );

    return NextResponse.json({
      message: 'Rekod penyelenggaraan berjaya ditambah',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating penyelenggaraan:', error);
    return NextResponse.json(
      { error: 'Failed to create penyelenggaraan' },
      { status: 500 }
    );
  }
}

// PUT - Update penyelenggaraan
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
    const {
      id,
      tarikh_siap,
      status,
      kos,
      no_resit,
      catatan,
      jenis_aset,
      aset_id
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    await pool.execute(
      `UPDATE penyelenggaraan_aset
       SET tarikh_siap = ?, status = ?, kos = ?, no_resit = ?,
           catatan = ?, disahkan_oleh = ?
       WHERE id = ?`,
      [tarikh_siap || null, status, kos || 0, no_resit || null, catatan || null, userId, id]
    );

    // If completed, update asset status back to "Sedang Digunakan"
    if (status === 'Selesai' && jenis_aset && aset_id) {
      const tableName = jenis_aset === 'Harta Modal' ? 'harta_modal' : 'inventory';
      await pool.execute(
        `UPDATE ${tableName} SET status = 'Sedang Digunakan' WHERE id = ?`,
        [aset_id]
      );
    }

    return NextResponse.json({ message: 'Rekod penyelenggaraan berjaya dikemaskini' });
  } catch (error) {
    console.error('Error updating penyelenggaraan:', error);
    return NextResponse.json(
      { error: 'Failed to update penyelenggaraan' },
      { status: 500 }
    );
  }
}
