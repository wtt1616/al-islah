import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Fetch activities (public for calendar, admin for management)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get('bulan'); // Format: YYYY-MM
    const tahun = searchParams.get('tahun');
    const status = searchParams.get('status');
    const forAdmin = searchParams.get('admin') === 'true';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // For public view, only show active activities
    if (!forAdmin) {
      whereClause += ' AND a.status = ?';
      params.push('aktif');
    } else {
      // Admin view - check authorization
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (status && status !== 'all') {
        whereClause += ' AND a.status = ?';
        params.push(status);
      }
    }

    // Filter by month (for calendar view)
    if (bulan) {
      // Get activities that fall within the month
      // An activity falls in a month if:
      // - tarikh_mula is in this month, OR
      // - tarikh_tamat is in this month, OR
      // - the month is between tarikh_mula and tarikh_tamat
      const [year, month] = bulan.split('-');
      const startOfMonth = `${year}-${month}-01`;
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

      whereClause += ` AND (
        (a.tarikh_mula BETWEEN ? AND ?) OR
        (a.tarikh_tamat BETWEEN ? AND ?) OR
        (a.tarikh_mula <= ? AND (a.tarikh_tamat >= ? OR a.tarikh_tamat IS NULL))
      )`;
      params.push(startOfMonth, endOfMonth, startOfMonth, endOfMonth, startOfMonth, startOfMonth);
    }

    // Filter by year
    if (tahun && !bulan) {
      whereClause += ' AND YEAR(a.tarikh_mula) = ?';
      params.push(tahun);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        a.id,
        a.tajuk,
        a.keterangan,
        DATE_FORMAT(a.tarikh_mula, '%Y-%m-%d') as tarikh_mula,
        DATE_FORMAT(a.tarikh_tamat, '%Y-%m-%d') as tarikh_tamat,
        a.masa_mula,
        a.masa_tamat,
        a.lokasi,
        a.kategori,
        a.penganjur,
        a.no_handphone,
        a.anggaran_jemputan,
        a.peralatan,
        a.peralatan_lain,
        a.image_file,
        a.status,
        a.created_by,
        a.created_at,
        a.updated_at,
        u.name as created_by_name
       FROM aktiviti_surau a
       LEFT JOIN users u ON a.created_by = u.id
       ${whereClause}
       ORDER BY a.tarikh_mula ASC, a.masa_mula ASC`,
      params
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching aktiviti:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new activity (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tajuk,
      keterangan,
      tarikh_mula,
      tarikh_tamat,
      masa_mula,
      masa_tamat,
      lokasi,
      kategori,
      penganjur,
      no_handphone,
      anggaran_jemputan,
      peralatan,
      peralatan_lain,
      image_file,
      status
    } = body;

    if (!tajuk || !tarikh_mula) {
      return NextResponse.json({ error: 'Tajuk dan tarikh mula diperlukan' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO aktiviti_surau (
        tajuk, keterangan, tarikh_mula, tarikh_tamat, masa_mula, masa_tamat,
        lokasi, kategori, penganjur, no_handphone, anggaran_jemputan, peralatan, peralatan_lain, image_file, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tajuk,
        keterangan || null,
        tarikh_mula,
        tarikh_tamat || null,
        masa_mula || null,
        masa_tamat || null,
        lokasi || 'Surau Al-Islah',
        kategori || 'lain_lain',
        penganjur || null,
        no_handphone || null,
        anggaran_jemputan || null,
        peralatan ? JSON.stringify(peralatan) : null,
        peralatan_lain || null,
        image_file || null,
        status || 'aktif',
        session.user.id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Aktiviti berjaya ditambah',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating aktiviti:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update activity (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      tajuk,
      keterangan,
      tarikh_mula,
      tarikh_tamat,
      masa_mula,
      masa_tamat,
      lokasi,
      kategori,
      penganjur,
      no_handphone,
      anggaran_jemputan,
      peralatan,
      peralatan_lain,
      image_file,
      status
    } = body;

    if (!id || !tajuk || !tarikh_mula) {
      return NextResponse.json({ error: 'ID, tajuk dan tarikh mula diperlukan' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE aktiviti_surau SET
        tajuk = ?, keterangan = ?, tarikh_mula = ?, tarikh_tamat = ?,
        masa_mula = ?, masa_tamat = ?, lokasi = ?, kategori = ?,
        penganjur = ?, no_handphone = ?, anggaran_jemputan = ?, peralatan = ?, peralatan_lain = ?, image_file = ?, status = ?
       WHERE id = ?`,
      [
        tajuk,
        keterangan || null,
        tarikh_mula,
        tarikh_tamat || null,
        masa_mula || null,
        masa_tamat || null,
        lokasi || 'Surau Al-Islah',
        kategori || 'lain_lain',
        penganjur || null,
        no_handphone || null,
        anggaran_jemputan || null,
        peralatan ? JSON.stringify(peralatan) : null,
        peralatan_lain || null,
        image_file || null,
        status || 'aktif',
        id
      ]
    );

    return NextResponse.json({ success: true, message: 'Aktiviti berjaya dikemaskini' });
  } catch (error) {
    console.error('Error updating aktiviti:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete activity (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    await pool.execute('DELETE FROM aktiviti_surau WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Aktiviti berjaya dipadam' });
  } catch (error) {
    console.error('Error deleting aktiviti:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
