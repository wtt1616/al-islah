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
    ['KH', tahun]
  );

  let nextNumber = 1;
  if (seqRows.length > 0) {
    nextNumber = seqRows[0].last_number + 1;
    await pool.execute(
      'UPDATE aset_sequence SET last_number = ? WHERE jenis = ? AND tahun = ?',
      [nextNumber, 'KH', tahun]
    );
  } else {
    await pool.execute(
      'INSERT INTO aset_sequence (jenis, tahun, last_number) VALUES (?, ?, ?)',
      ['KH', tahun, nextNumber]
    );
  }

  return `SAR/KH/${tahun}/${String(nextNumber).padStart(3, '0')}`;
}

// GET all kehilangan records
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const tahun = searchParams.get('tahun');
    const status = searchParams.get('status');

    let query = `
      SELECT
        k.*,
        pelapor.name as nama_pelapor,
        pelulus.name as nama_pelulus
      FROM kehilangan_aset k
      LEFT JOIN users pelapor ON k.dilaporkan_oleh = pelapor.id
      LEFT JOIN users pelulus ON k.diluluskan_oleh = pelulus.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tahun) {
      query += ' AND YEAR(k.tarikh_kehilangan) = ?';
      params.push(tahun);
    }

    if (status) {
      query += ' AND k.status = ?';
      params.push(status);
    }

    query += ' ORDER BY k.tarikh_kehilangan DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    // Get summary
    const [summary] = await pool.execute<RowDataPacket[]>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Dilaporkan' OR status = 'Dalam Siasatan' THEN 1 ELSE 0 END) as aktif,
        SUM(CASE WHEN status = 'Dijumpai' THEN 1 ELSE 0 END) as dijumpai,
        SUM(CASE WHEN status = 'Hapus Kira Diluluskan' THEN 1 ELSE 0 END) as hapus_kira,
        COALESCE(SUM(CASE WHEN status != 'Dijumpai' THEN nilai_semasa ELSE 0 END), 0) as nilai_hilang
      FROM kehilangan_aset
      WHERE YEAR(tarikh_kehilangan) = YEAR(CURDATE())
    `);

    return NextResponse.json({
      data: rows,
      summary: summary[0]
    });
  } catch (error) {
    console.error('Error fetching kehilangan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kehilangan' },
      { status: 500 }
    );
  }
}

// POST - Create kehilangan report
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
      tarikh_kehilangan,
      lokasi_terakhir,
      sebab_kehilangan,
      tindakan_diambil,
      no_laporan_polis,
      tarikh_laporan_polis,
      balai_polis,
      catatan
    } = body;

    if (!jenis_aset || !aset_id || !tarikh_kehilangan || !sebab_kehilangan) {
      return NextResponse.json(
        { error: 'Maklumat wajib tidak lengkap' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const noRujukan = await generateNoRujukan();

    // Update asset status to "Hilang"
    const tableName = jenis_aset === 'Harta Modal' ? 'harta_modal' : 'inventory';
    await pool.execute(
      `UPDATE ${tableName} SET status = 'Hilang' WHERE id = ?`,
      [aset_id]
    );

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO kehilangan_aset
       (no_rujukan, jenis_aset, aset_id, no_siri_pendaftaran, keterangan_aset,
        harga_asal, nilai_semasa, tarikh_kehilangan, lokasi_terakhir, sebab_kehilangan,
        tindakan_diambil, no_laporan_polis, tarikh_laporan_polis, balai_polis,
        catatan, status, dilaporkan_oleh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dilaporkan', ?)`,
      [noRujukan, jenis_aset, aset_id, no_siri_pendaftaran, keterangan_aset,
       harga_asal || 0, nilai_semasa || 0, tarikh_kehilangan, lokasi_terakhir || null,
       sebab_kehilangan, tindakan_diambil || null, no_laporan_polis || null,
       tarikh_laporan_polis || null, balai_polis || null, catatan || null, userId]
    );

    return NextResponse.json({
      message: 'Laporan kehilangan berjaya dihantar',
      id: result.insertId,
      no_rujukan: noRujukan
    });
  } catch (error) {
    console.error('Error creating kehilangan:', error);
    return NextResponse.json(
      { error: 'Failed to create kehilangan' },
      { status: 500 }
    );
  }
}

// PUT - Update kehilangan (investigate/found/write-off)
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
      status,
      tindakan_diambil,
      no_laporan_polis,
      tarikh_laporan_polis,
      balai_polis,
      tarikh_mohon_hapus_kira,
      tarikh_lulus_hapus_kira,
      catatan,
      jenis_aset,
      aset_id
    } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID dan status diperlukan' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Build update query dynamically
    let updates: string[] = ['status = ?'];
    let params: any[] = [status];

    if (tindakan_diambil !== undefined) {
      updates.push('tindakan_diambil = ?');
      params.push(tindakan_diambil);
    }
    if (no_laporan_polis !== undefined) {
      updates.push('no_laporan_polis = ?');
      params.push(no_laporan_polis);
    }
    if (tarikh_laporan_polis !== undefined) {
      updates.push('tarikh_laporan_polis = ?');
      params.push(tarikh_laporan_polis);
    }
    if (balai_polis !== undefined) {
      updates.push('balai_polis = ?');
      params.push(balai_polis);
    }
    if (tarikh_mohon_hapus_kira !== undefined) {
      updates.push('tarikh_mohon_hapus_kira = ?');
      params.push(tarikh_mohon_hapus_kira);
    }
    if (status === 'Hapus Kira Diluluskan') {
      updates.push('tarikh_lulus_hapus_kira = ?');
      updates.push('diluluskan_oleh = ?');
      params.push(tarikh_lulus_hapus_kira || new Date().toISOString().split('T')[0]);
      params.push(userId);
    }
    if (catatan !== undefined) {
      updates.push('catatan = ?');
      params.push(catatan);
    }

    params.push(id);

    await pool.execute(
      `UPDATE kehilangan_aset SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Update asset status based on outcome
    if (jenis_aset && aset_id) {
      const tableName = jenis_aset === 'Harta Modal' ? 'harta_modal' : 'inventory';

      if (status === 'Dijumpai') {
        await pool.execute(
          `UPDATE ${tableName} SET status = 'Sedang Digunakan' WHERE id = ?`,
          [aset_id]
        );
      } else if (status === 'Hapus Kira Diluluskan') {
        await pool.execute(
          `UPDATE ${tableName} SET status = 'Dilupuskan', tarikh_lupus = ?, kaedah_lupus = 'Hapus Kira' WHERE id = ?`,
          [tarikh_lulus_hapus_kira || new Date().toISOString().split('T')[0], aset_id]
        );
      }
    }

    return NextResponse.json({ message: 'Status kehilangan berjaya dikemaskini' });
  } catch (error) {
    console.error('Error updating kehilangan:', error);
    return NextResponse.json(
      { error: 'Failed to update kehilangan' },
      { status: 500 }
    );
  }
}
