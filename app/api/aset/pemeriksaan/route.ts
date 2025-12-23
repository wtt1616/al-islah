import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET all pemeriksaan records
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const tahun = searchParams.get('tahun');
    const jenisAset = searchParams.get('jenis_aset');
    const keadaan = searchParams.get('keadaan');

    let query = `
      SELECT
        p.*,
        pemeriksa.name as nama_pemeriksa,
        pengesah.name as nama_pengesah,
        CASE
          WHEN p.jenis_aset = 'Harta Modal' THEN (SELECT keterangan FROM harta_modal WHERE id = p.aset_id)
          ELSE (SELECT keterangan FROM inventory WHERE id = p.aset_id)
        END as keterangan_aset
      FROM pemeriksaan_aset p
      LEFT JOIN users pemeriksa ON p.diperiksa_oleh = pemeriksa.id
      LEFT JOIN users pengesah ON p.disahkan_oleh = pengesah.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tahun) {
      query += ' AND YEAR(p.tarikh_pemeriksaan) = ?';
      params.push(tahun);
    }

    if (jenisAset) {
      query += ' AND p.jenis_aset = ?';
      params.push(jenisAset);
    }

    if (keadaan) {
      query += ' AND p.keadaan = ?';
      params.push(keadaan);
    }

    query += ' ORDER BY p.tarikh_pemeriksaan DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching pemeriksaan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pemeriksaan' },
      { status: 500 }
    );
  }
}

// POST - Create pemeriksaan record
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
      tarikh_pemeriksaan,
      jenis_aset,
      aset_id,
      no_siri_pendaftaran,
      keadaan,
      catatan,
      tindakan_diperlukan
    } = body;

    if (!tarikh_pemeriksaan || !jenis_aset || !aset_id || !keadaan) {
      return NextResponse.json(
        { error: 'Tarikh, jenis aset, ID aset, dan keadaan diperlukan' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO pemeriksaan_aset
       (tarikh_pemeriksaan, jenis_aset, aset_id, no_siri_pendaftaran, keadaan,
        catatan, tindakan_diperlukan, diperiksa_oleh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tarikh_pemeriksaan, jenis_aset, aset_id, no_siri_pendaftaran, keadaan,
       catatan || null, tindakan_diperlukan || null, userId]
    );

    // Update asset status if damaged or lost
    if (keadaan === 'Rosak Teruk' || keadaan === 'Hilang' || keadaan === 'Tidak Dijumpai') {
      const tableName = jenis_aset === 'Harta Modal' ? 'harta_modal' : 'inventory';
      const newStatus = keadaan === 'Hilang' || keadaan === 'Tidak Dijumpai' ? 'Hilang' : 'Rosak';
      await pool.execute(
        `UPDATE ${tableName} SET status = ? WHERE id = ?`,
        [newStatus, aset_id]
      );
    }

    return NextResponse.json({
      message: 'Rekod pemeriksaan berjaya ditambah',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating pemeriksaan:', error);
    return NextResponse.json(
      { error: 'Failed to create pemeriksaan' },
      { status: 500 }
    );
  }
}

// PUT - Update pemeriksaan (for verification)
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
    const { id, disahkan_oleh, tarikh_pengesahan, status_tindakan, catatan, tindakan_diperlukan } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    await pool.execute(
      `UPDATE pemeriksaan_aset
       SET disahkan_oleh = ?, tarikh_pengesahan = ?, status_tindakan = ?,
           catatan = ?, tindakan_diperlukan = ?
       WHERE id = ?`,
      [disahkan_oleh || userId, tarikh_pengesahan || new Date().toISOString().split('T')[0],
       status_tindakan || 'Belum Diambil', catatan || null, tindakan_diperlukan || null, id]
    );

    return NextResponse.json({ message: 'Rekod pemeriksaan berjaya dikemaskini' });
  } catch (error) {
    console.error('Error updating pemeriksaan:', error);
    return NextResponse.json(
      { error: 'Failed to update pemeriksaan' },
      { status: 500 }
    );
  }
}
