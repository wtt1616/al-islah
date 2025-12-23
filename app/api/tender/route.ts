import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Fetch tenders (public for active tenders, admin for all)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forAdmin = searchParams.get('admin') === 'true';
    const id = searchParams.get('id');

    // If requesting specific tender by ID
    if (id) {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          t.id,
          t.tajuk,
          t.keterangan,
          DATE_FORMAT(t.tarikh_mula, '%Y-%m-%d') as tarikh_mula,
          DATE_FORMAT(t.tarikh_akhir, '%Y-%m-%d') as tarikh_akhir,
          t.dokumen,
          t.harga,
          t.status,
          t.created_by,
          t.created_at,
          t.updated_at,
          u.name as created_by_name,
          (SELECT COUNT(*) FROM tender_pembeli WHERE tender_id = t.id) as jumlah_pembeli
         FROM tenders t
         LEFT JOIN users u ON t.created_by = u.id
         WHERE t.id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Tender tidak dijumpai' }, { status: 404 });
      }

      return NextResponse.json({ data: rows[0] });
    }

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // For public view, only show active tenders within date range
    if (!forAdmin) {
      whereClause += ' AND t.status = ? AND t.tarikh_mula <= CURDATE() AND t.tarikh_akhir >= CURDATE()';
      params.push('aktif');
    } else {
      // Admin view - check authorization
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const status = searchParams.get('status');
      if (status && status !== 'all') {
        whereClause += ' AND t.status = ?';
        params.push(status);
      }
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        t.id,
        t.tajuk,
        t.keterangan,
        DATE_FORMAT(t.tarikh_mula, '%Y-%m-%d') as tarikh_mula,
        DATE_FORMAT(t.tarikh_akhir, '%Y-%m-%d') as tarikh_akhir,
        t.dokumen,
        t.harga,
        t.status,
        t.created_by,
        t.created_at,
        t.updated_at,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM tender_pembeli WHERE tender_id = t.id) as jumlah_pembeli
       FROM tenders t
       LEFT JOIN users u ON t.created_by = u.id
       ${whereClause}
       ORDER BY t.tarikh_akhir DESC, t.tarikh_mula DESC`,
      params
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching tenders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new tender (admin only)
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
      tarikh_akhir,
      dokumen,
      harga,
      status
    } = body;

    if (!tajuk || !tarikh_mula || !tarikh_akhir) {
      return NextResponse.json({ error: 'Tajuk, tarikh mula dan tarikh akhir diperlukan' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO tenders (
        tajuk, keterangan, tarikh_mula, tarikh_akhir, dokumen, harga, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tajuk,
        keterangan || null,
        tarikh_mula,
        tarikh_akhir,
        dokumen || null,
        harga || 0,
        status || 'aktif',
        session.user.id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Tender berjaya ditambah',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating tender:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update tender (admin only)
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
      tarikh_akhir,
      dokumen,
      harga,
      status
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    // If only updating status
    if (status && !tajuk) {
      await pool.execute(
        'UPDATE tenders SET status = ? WHERE id = ?',
        [status, id]
      );
      return NextResponse.json({ success: true, message: 'Status tender berjaya dikemaskini' });
    }

    if (!tajuk || !tarikh_mula || !tarikh_akhir) {
      return NextResponse.json({ error: 'Tajuk, tarikh mula dan tarikh akhir diperlukan' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE tenders SET
        tajuk = ?, keterangan = ?, tarikh_mula = ?, tarikh_akhir = ?,
        dokumen = ?, harga = ?, status = ?
       WHERE id = ?`,
      [
        tajuk,
        keterangan || null,
        tarikh_mula,
        tarikh_akhir,
        dokumen || null,
        harga || 0,
        status || 'aktif',
        id
      ]
    );

    return NextResponse.json({ success: true, message: 'Tender berjaya dikemaskini' });
  } catch (error) {
    console.error('Error updating tender:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete tender (admin only)
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

    // Delete will cascade to tender_pembeli due to foreign key
    await pool.execute('DELETE FROM tenders WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Tender berjaya dipadam' });
  } catch (error) {
    console.error('Error deleting tender:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
