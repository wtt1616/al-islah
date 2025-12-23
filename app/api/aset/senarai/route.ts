import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Helper function to generate asset registration number
async function generateNoSiri(jenisAset: 'HM' | 'I'): Promise<string> {
  const tahun = new Date().getFullYear();
  const tahunShort = tahun.toString().slice(-2);

  // Get and update sequence
  const [seqRows] = await pool.execute<RowDataPacket[]>(
    'SELECT last_number FROM aset_sequence WHERE jenis = ? AND tahun = ? FOR UPDATE',
    [jenisAset, tahun]
  );

  let nextNumber = 1;
  if (seqRows.length > 0) {
    nextNumber = seqRows[0].last_number + 1;
    await pool.execute(
      'UPDATE aset_sequence SET last_number = ? WHERE jenis = ? AND tahun = ?',
      [nextNumber, jenisAset, tahun]
    );
  } else {
    await pool.execute(
      'INSERT INTO aset_sequence (jenis, tahun, last_number) VALUES (?, ?, ?)',
      [jenisAset, tahun, nextNumber]
    );
  }

  // Format: SAR/HM/25/001 or SAR/I/25/001
  return `SAR/${jenisAset}/${tahunShort}/${String(nextNumber).padStart(3, '0')}`;
}

// GET all assets (combined view)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const jenisAset = searchParams.get('jenis_aset');
    const status = searchParams.get('status');
    const lokasi = searchParams.get('lokasi');
    const kategori = searchParams.get('kategori');
    const search = searchParams.get('search');

    let conditions: string[] = [];
    let params: any[] = [];

    // Build combined query
    let query = `
      SELECT
        'Harta Modal' AS jenis_aset,
        h.id,
        h.no_siri_pendaftaran,
        h.keterangan,
        h.kategori,
        h.sub_kategori,
        h.jenama,
        h.model,
        h.no_siri_pembuat,
        h.tarikh_terima,
        h.harga_asal,
        h.cara_diperolehi,
        h.status,
        h.catatan,
        h.gambar,
        h.created_at,
        l.nama_lokasi
      FROM harta_modal h
      LEFT JOIN lokasi_aset l ON h.lokasi_id = l.id
    `;

    if (jenisAset !== 'Inventori') {
      // Add Harta Modal conditions
      let hmConditions: string[] = [];
      if (status) {
        hmConditions.push('h.status = ?');
        params.push(status);
      }
      if (lokasi) {
        hmConditions.push('h.lokasi_id = ?');
        params.push(lokasi);
      }
      if (kategori) {
        hmConditions.push('h.kategori = ?');
        params.push(kategori);
      }
      if (search) {
        hmConditions.push('(h.no_siri_pendaftaran LIKE ? OR h.keterangan LIKE ? OR h.jenama LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (hmConditions.length > 0) {
        query += ' WHERE ' + hmConditions.join(' AND ');
      }
    }

    if (jenisAset !== 'Harta Modal') {
      // Add UNION for Inventori
      query += `
        UNION ALL
        SELECT
          'Inventori' AS jenis_aset,
          i.id,
          i.no_siri_pendaftaran,
          i.keterangan,
          i.kategori,
          i.sub_kategori,
          i.jenama,
          i.model,
          i.no_siri_pembuat,
          i.tarikh_terima,
          i.harga_asal,
          i.cara_diperolehi,
          i.status,
          i.catatan,
          i.gambar,
          i.created_at,
          l.nama_lokasi
        FROM inventory i
        LEFT JOIN lokasi_aset l ON i.lokasi_id = l.id
      `;

      // Add Inventori conditions
      let invConditions: string[] = [];
      if (status) {
        invConditions.push('i.status = ?');
        params.push(status);
      }
      if (lokasi) {
        invConditions.push('i.lokasi_id = ?');
        params.push(lokasi);
      }
      if (kategori) {
        invConditions.push('i.kategori = ?');
        params.push(kategori);
      }
      if (search) {
        invConditions.push('(i.no_siri_pendaftaran LIKE ? OR i.keterangan LIKE ? OR i.jenama LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (invConditions.length > 0) {
        query += ' WHERE ' + invConditions.join(' AND ');
      }
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    // Get summary statistics
    const [stats] = await pool.execute<RowDataPacket[]>(`
      SELECT
        (SELECT COUNT(*) FROM harta_modal WHERE status != 'Dilupuskan') as total_harta_modal,
        (SELECT COUNT(*) FROM inventory WHERE status != 'Dilupuskan') as total_inventori,
        (SELECT COALESCE(SUM(harga_asal), 0) FROM harta_modal WHERE status != 'Dilupuskan') as nilai_harta_modal,
        (SELECT COALESCE(SUM(harga_asal), 0) FROM inventory WHERE status != 'Dilupuskan') as nilai_inventori,
        (SELECT COUNT(*) FROM harta_modal WHERE status = 'Rosak') as rosak_harta_modal,
        (SELECT COUNT(*) FROM inventory WHERE status = 'Rosak') as rosak_inventori
    `);

    return NextResponse.json({
      data: rows,
      stats: stats[0]
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// POST - Create new asset
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
      keterangan,
      kategori,
      sub_kategori,
      jenama,
      model,
      no_siri_pembuat,
      tarikh_terima,
      harga_asal,
      cara_diperolehi,
      lokasi_id,
      catatan
    } = body;

    if (!keterangan || !cara_diperolehi) {
      return NextResponse.json(
        { error: 'Keterangan dan cara diperolehi diperlukan' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const jenisCode = jenis_aset === 'Harta Modal' ? 'HM' : 'I';
    const tableName = jenis_aset === 'Harta Modal' ? 'harta_modal' : 'inventory';

    // Generate registration number
    const noSiri = await generateNoSiri(jenisCode);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO ${tableName}
       (no_siri_pendaftaran, keterangan, kategori, sub_kategori, jenama, model,
        no_siri_pembuat, tarikh_terima, harga_asal, cara_diperolehi, lokasi_id,
        catatan, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Sedang Digunakan', ?)`,
      [noSiri, keterangan, kategori || null, sub_kategori || null, jenama || null,
       model || null, no_siri_pembuat || null, tarikh_terima || null, harga_asal || 0,
       cara_diperolehi, lokasi_id || null, catatan || null, userId]
    );

    return NextResponse.json({
      message: 'Aset berjaya didaftarkan',
      id: result.insertId,
      no_siri_pendaftaran: noSiri
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}

// PUT - Update asset
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
      jenis_aset,
      keterangan,
      kategori,
      sub_kategori,
      jenama,
      model,
      no_siri_pembuat,
      tarikh_terima,
      harga_asal,
      cara_diperolehi,
      lokasi_id,
      status,
      catatan
    } = body;

    if (!id || !jenis_aset) {
      return NextResponse.json({ error: 'ID dan jenis aset diperlukan' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const tableName = jenis_aset === 'Harta Modal' ? 'harta_modal' : 'inventory';

    await pool.execute(
      `UPDATE ${tableName}
       SET keterangan = ?, kategori = ?, sub_kategori = ?, jenama = ?, model = ?,
           no_siri_pembuat = ?, tarikh_terima = ?, harga_asal = ?, cara_diperolehi = ?,
           lokasi_id = ?, status = ?, catatan = ?, modified_by = ?
       WHERE id = ?`,
      [keterangan, kategori || null, sub_kategori || null, jenama || null, model || null,
       no_siri_pembuat || null, tarikh_terima || null, harga_asal || 0, cara_diperolehi,
       lokasi_id || null, status || 'Sedang Digunakan', catatan || null, userId, id]
    );

    return NextResponse.json({ message: 'Aset berjaya dikemaskini' });
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}
