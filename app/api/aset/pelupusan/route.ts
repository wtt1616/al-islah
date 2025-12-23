import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Helper to generate reference number
async function generateNoRujukan(): Promise<string> {
  const tahun = new Date().getFullYear();

  const [seqRows] = await pool.execute<RowDataPacket[]>(
    'SELECT last_number FROM aset_sequence WHERE jenis = ? AND tahun = ? FOR UPDATE',
    ['LP', tahun]
  );

  let nextNumber = 1;
  if (seqRows.length > 0) {
    nextNumber = seqRows[0].last_number + 1;
    await pool.execute(
      'UPDATE aset_sequence SET last_number = ? WHERE jenis = ? AND tahun = ?',
      [nextNumber, 'LP', tahun]
    );
  } else {
    await pool.execute(
      'INSERT INTO aset_sequence (jenis, tahun, last_number) VALUES (?, ?, ?)',
      ['LP', tahun, nextNumber]
    );
  }

  return `SAR/LP/${tahun}/${String(nextNumber).padStart(3, '0')}`;
}

// GET all pelupusan records
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const tahun = searchParams.get('tahun');
    const status = searchParams.get('status');
    const kaedah = searchParams.get('kaedah');

    let query = `
      SELECT
        p.*,
        pemohon.name as nama_pemohon,
        pelulus.name as nama_pelulus
      FROM pelupusan_aset p
      LEFT JOIN users pemohon ON p.dimohon_oleh = pemohon.id
      LEFT JOIN users pelulus ON p.diluluskan_oleh = pelulus.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tahun) {
      query += ' AND YEAR(p.tarikh_permohonan) = ?';
      params.push(tahun);
    }

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (kaedah) {
      query += ' AND p.kaedah_pelupusan = ?';
      params.push(kaedah);
    }

    query += ' ORDER BY p.tarikh_permohonan DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    // Get summary
    const [summary] = await pool.execute<RowDataPacket[]>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN status = 'Permohonan' OR status = 'Dalam Semakan' THEN 1 ELSE 0 END) as menunggu,
        COALESCE(SUM(CASE WHEN status = 'Selesai' THEN harga_asal ELSE 0 END), 0) as nilai_dilupuskan
      FROM pelupusan_aset
      WHERE YEAR(tarikh_permohonan) = YEAR(CURDATE())
    `);

    return NextResponse.json({
      data: rows,
      summary: summary[0]
    });
  } catch (error) {
    console.error('Error fetching pelupusan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pelupusan' },
      { status: 500 }
    );
  }
}

// POST - Create pelupusan request
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
      keterangan_aset,
      harga_asal,
      nilai_semasa,
      sebab_pelupusan,
      kaedah_pelupusan,
      nama_penerima,
      alamat_penerima,
      catatan
    } = body;

    if (!jenis_aset || !aset_id || !sebab_pelupusan || !kaedah_pelupusan) {
      return NextResponse.json(
        { error: 'Maklumat wajib tidak lengkap' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const noRujukan = await generateNoRujukan();
    const tarikhPermohonan = new Date().toISOString().split('T')[0];

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO pelupusan_aset
       (no_rujukan, jenis_aset, aset_id, no_siri_pendaftaran, keterangan_aset,
        harga_asal, nilai_semasa, tarikh_permohonan, sebab_pelupusan, kaedah_pelupusan,
        nama_penerima, alamat_penerima, catatan, status, dimohon_oleh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Permohonan', ?)`,
      [noRujukan, jenis_aset, aset_id, no_siri_pendaftaran, keterangan_aset,
       harga_asal || 0, nilai_semasa || 0, tarikhPermohonan, sebab_pelupusan,
       kaedah_pelupusan, nama_penerima || null, alamat_penerima || null,
       catatan || null, userId]
    );

    return NextResponse.json({
      message: 'Permohonan pelupusan berjaya dihantar',
      id: result.insertId,
      no_rujukan: noRujukan
    });
  } catch (error) {
    console.error('Error creating pelupusan:', error);
    return NextResponse.json(
      { error: 'Failed to create pelupusan' },
      { status: 500 }
    );
  }
}

// PUT - Update pelupusan (approve/reject/complete)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin boleh meluluskan pelupusan' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      id,
      status,
      tarikh_kelulusan,
      tarikh_pelupusan,
      harga_jualan,
      nama_pembeli,
      catatan,
      jenis_aset,
      aset_id
    } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID dan status diperlukan' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    await pool.execute(
      `UPDATE pelupusan_aset
       SET status = ?, tarikh_kelulusan = ?, diluluskan_oleh = ?,
           tarikh_pelupusan = ?, harga_jualan = ?, nama_pembeli = ?, catatan = ?
       WHERE id = ?`,
      [status, tarikh_kelulusan || null, userId, tarikh_pelupusan || null,
       harga_jualan || null, nama_pembeli || null, catatan || null, id]
    );

    // If completed, update asset status
    if (status === 'Selesai' && jenis_aset && aset_id) {
      const tableName = jenis_aset === 'Harta Modal' ? 'harta_modal' : 'inventory';
      await pool.execute(
        `UPDATE ${tableName}
         SET status = 'Dilupuskan', tarikh_lupus = ?, kaedah_lupus = (
           SELECT kaedah_pelupusan FROM pelupusan_aset WHERE id = ?
         )
         WHERE id = ?`,
        [tarikh_pelupusan || new Date().toISOString().split('T')[0], id, aset_id]
      );
    }

    return NextResponse.json({ message: 'Status pelupusan berjaya dikemaskini' });
  } catch (error) {
    console.error('Error updating pelupusan:', error);
    return NextResponse.json(
      { error: 'Failed to update pelupusan' },
      { status: 500 }
    );
  }
}
