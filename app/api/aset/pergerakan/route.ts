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
    ['PG', tahun]
  );

  let nextNumber = 1;
  if (seqRows.length > 0) {
    nextNumber = seqRows[0].last_number + 1;
    await pool.execute(
      'UPDATE aset_sequence SET last_number = ? WHERE jenis = ? AND tahun = ?',
      [nextNumber, 'PG', tahun]
    );
  } else {
    await pool.execute(
      'INSERT INTO aset_sequence (jenis, tahun, last_number) VALUES (?, ?, ?)',
      ['PG', tahun, nextNumber]
    );
  }

  return `SAR/PG/${tahun}/${String(nextNumber).padStart(3, '0')}`;
}

// GET all pergerakan records
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const tahun = searchParams.get('tahun');
    const jenisPergerakan = searchParams.get('jenis_pergerakan');
    const status = searchParams.get('status');

    let query = `
      SELECT
        p.*,
        pemohon.name as nama_pemohon,
        pelulus.name as nama_pelulus,
        la.nama_lokasi as lokasi_asal_nama,
        lt.nama_lokasi as lokasi_tujuan_nama
      FROM pergerakan_aset p
      LEFT JOIN users pemohon ON p.dimohon_oleh = pemohon.id
      LEFT JOIN users pelulus ON p.diluluskan_oleh = pelulus.id
      LEFT JOIN lokasi_aset la ON p.lokasi_asal_id = la.id
      LEFT JOIN lokasi_aset lt ON p.lokasi_tujuan_id = lt.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tahun) {
      query += ' AND YEAR(p.tarikh_permohonan) = ?';
      params.push(tahun);
    }

    if (jenisPergerakan) {
      query += ' AND p.jenis_pergerakan = ?';
      params.push(jenisPergerakan);
    }

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.tarikh_permohonan DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    // Get summary
    const [summary] = await pool.execute<RowDataPacket[]>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN jenis_pergerakan = 'Pindahan' THEN 1 ELSE 0 END) as pindahan,
        SUM(CASE WHEN jenis_pergerakan = 'Pinjaman' THEN 1 ELSE 0 END) as pinjaman,
        SUM(CASE WHEN status = 'Dalam Pergerakan' THEN 1 ELSE 0 END) as aktif,
        SUM(CASE WHEN jenis_pergerakan = 'Pinjaman' AND status = 'Tidak Dipulangkan' THEN 1 ELSE 0 END) as tidak_dipulangkan
      FROM pergerakan_aset
      WHERE YEAR(tarikh_permohonan) = YEAR(CURDATE())
    `);

    return NextResponse.json({
      data: rows,
      summary: summary[0]
    });
  } catch (error) {
    console.error('Error fetching pergerakan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pergerakan' },
      { status: 500 }
    );
  }
}

// POST - Create pergerakan request
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
      jenis_pergerakan,
      jenis_aset,
      aset_id,
      no_siri_pendaftaran,
      keterangan_aset,
      lokasi_asal_id,
      lokasi_tujuan_id,
      lokasi_asal_text,
      lokasi_tujuan_text,
      nama_peminjam,
      no_tel_peminjam,
      tujuan_pinjaman,
      tarikh_mula,
      tarikh_dijangka_pulang,
      keadaan_semasa_keluar,
      catatan
    } = body;

    if (!jenis_pergerakan || !jenis_aset || !aset_id || !tarikh_mula) {
      return NextResponse.json(
        { error: 'Maklumat wajib tidak lengkap' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const noRujukan = await generateNoRujukan();
    const tarikhPermohonan = new Date().toISOString().split('T')[0];

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO pergerakan_aset
       (no_rujukan, jenis_pergerakan, jenis_aset, aset_id, no_siri_pendaftaran,
        keterangan_aset, lokasi_asal_id, lokasi_tujuan_id, lokasi_asal_text,
        lokasi_tujuan_text, nama_peminjam, no_tel_peminjam, tujuan_pinjaman,
        tarikh_permohonan, tarikh_mula, tarikh_dijangka_pulang, keadaan_semasa_keluar,
        catatan, status, dimohon_oleh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Permohonan', ?)`,
      [noRujukan, jenis_pergerakan, jenis_aset, aset_id, no_siri_pendaftaran,
       keterangan_aset, lokasi_asal_id || null, lokasi_tujuan_id || null,
       lokasi_asal_text || null, lokasi_tujuan_text || null, nama_peminjam || null,
       no_tel_peminjam || null, tujuan_pinjaman || null, tarikhPermohonan,
       tarikh_mula, tarikh_dijangka_pulang || null, keadaan_semasa_keluar || 'Baik',
       catatan || null, userId]
    );

    return NextResponse.json({
      message: 'Permohonan pergerakan berjaya dihantar',
      id: result.insertId,
      no_rujukan: noRujukan
    });
  } catch (error) {
    console.error('Error creating pergerakan:', error);
    return NextResponse.json(
      { error: 'Failed to create pergerakan' },
      { status: 500 }
    );
  }
}

// PUT - Update pergerakan (approve/reject/return)
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
      tarikh_kelulusan,
      diterima_oleh,
      tarikh_terima,
      tarikh_sebenar_pulang,
      keadaan_semasa_pulang,
      catatan,
      jenis_aset,
      aset_id,
      lokasi_tujuan_id
    } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID dan status diperlukan' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    await pool.execute(
      `UPDATE pergerakan_aset
       SET status = ?, tarikh_kelulusan = ?, diluluskan_oleh = ?,
           diterima_oleh = ?, tarikh_terima = ?, tarikh_sebenar_pulang = ?,
           keadaan_semasa_pulang = ?, catatan = ?
       WHERE id = ?`,
      [status, tarikh_kelulusan || null, userId, diterima_oleh || null,
       tarikh_terima || null, tarikh_sebenar_pulang || null,
       keadaan_semasa_pulang || null, catatan || null, id]
    );

    // If approved and it's a transfer, update asset location
    if (status === 'Dalam Pergerakan' && lokasi_tujuan_id && jenis_aset && aset_id) {
      const tableName = jenis_aset === 'Harta Modal' ? 'harta_modal' : 'inventory';
      await pool.execute(
        `UPDATE ${tableName} SET lokasi_id = ? WHERE id = ?`,
        [lokasi_tujuan_id, aset_id]
      );
    }

    // If loan returned with damage, update asset status
    if (status === 'Dipulangkan' && keadaan_semasa_pulang && keadaan_semasa_pulang !== 'Baik') {
      const tableName = jenis_aset === 'Harta Modal' ? 'harta_modal' : 'inventory';
      const newStatus = keadaan_semasa_pulang === 'Hilang' ? 'Hilang' : 'Rosak';
      await pool.execute(
        `UPDATE ${tableName} SET status = ? WHERE id = ?`,
        [newStatus, aset_id]
      );
    }

    return NextResponse.json({ message: 'Status pergerakan berjaya dikemaskini' });
  } catch (error) {
    console.error('Error updating pergerakan:', error);
    return NextResponse.json(
      { error: 'Failed to update pergerakan' },
      { status: 500 }
    );
  }
}
