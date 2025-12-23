import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Fetch pembeli for a tender (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenderId = searchParams.get('tender_id');
    const id = searchParams.get('id');

    // Get specific pembeli
    if (id) {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          p.id,
          p.tender_id,
          p.nama_syarikat,
          p.no_tel,
          p.nama_pembeli,
          p.no_resit,
          DATE_FORMAT(p.tarikh_beli, '%Y-%m-%d') as tarikh_beli,
          p.keterangan,
          p.created_by,
          p.created_at,
          p.updated_at,
          u.name as created_by_name,
          t.tajuk as tender_tajuk
         FROM tender_pembeli p
         LEFT JOIN users u ON p.created_by = u.id
         LEFT JOIN tenders t ON p.tender_id = t.id
         WHERE p.id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Pembeli tidak dijumpai' }, { status: 404 });
      }

      return NextResponse.json({ data: rows[0] });
    }

    // Get all pembeli for a tender
    if (!tenderId) {
      return NextResponse.json({ error: 'tender_id diperlukan' }, { status: 400 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        p.id,
        p.tender_id,
        p.nama_syarikat,
        p.no_tel,
        p.nama_pembeli,
        p.no_resit,
        DATE_FORMAT(p.tarikh_beli, '%Y-%m-%d') as tarikh_beli,
        p.keterangan,
        p.created_by,
        p.created_at,
        p.updated_at,
        u.name as created_by_name
       FROM tender_pembeli p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.tender_id = ?
       ORDER BY p.tarikh_beli DESC, p.id DESC`,
      [tenderId]
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching tender pembeli:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new pembeli record (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tender_id,
      nama_syarikat,
      no_tel,
      nama_pembeli,
      no_resit,
      tarikh_beli,
      keterangan
    } = body;

    if (!tender_id || !nama_syarikat || !no_tel || !nama_pembeli || !tarikh_beli) {
      return NextResponse.json({
        error: 'Tender ID, nama syarikat, no. telefon, nama pembeli dan tarikh beli diperlukan'
      }, { status: 400 });
    }

    // Verify tender exists
    const [tender] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM tenders WHERE id = ?',
      [tender_id]
    );

    if ((tender as any[]).length === 0) {
      return NextResponse.json({ error: 'Tender tidak dijumpai' }, { status: 404 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO tender_pembeli (
        tender_id, nama_syarikat, no_tel, nama_pembeli, no_resit, tarikh_beli, keterangan, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tender_id,
        nama_syarikat,
        no_tel,
        nama_pembeli,
        no_resit || null,
        tarikh_beli,
        keterangan || null,
        session.user.id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Maklumat pembeli berjaya ditambah',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating tender pembeli:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update pembeli record (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      nama_syarikat,
      no_tel,
      nama_pembeli,
      no_resit,
      tarikh_beli,
      keterangan
    } = body;

    if (!id || !nama_syarikat || !no_tel || !nama_pembeli || !tarikh_beli) {
      return NextResponse.json({
        error: 'ID, nama syarikat, no. telefon, nama pembeli dan tarikh beli diperlukan'
      }, { status: 400 });
    }

    await pool.execute(
      `UPDATE tender_pembeli SET
        nama_syarikat = ?, no_tel = ?, nama_pembeli = ?,
        no_resit = ?, tarikh_beli = ?, keterangan = ?
       WHERE id = ?`,
      [
        nama_syarikat,
        no_tel,
        nama_pembeli,
        no_resit || null,
        tarikh_beli,
        keterangan || null,
        id
      ]
    );

    return NextResponse.json({ success: true, message: 'Maklumat pembeli berjaya dikemaskini' });
  } catch (error) {
    console.error('Error updating tender pembeli:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete pembeli record (admin only)
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

    await pool.execute('DELETE FROM tender_pembeli WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Maklumat pembeli berjaya dipadam' });
  } catch (error) {
    console.error('Error deleting tender pembeli:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
