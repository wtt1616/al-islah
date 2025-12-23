import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface NotaRow extends RowDataPacket {
  id: number;
  tahun: number;
  jawatan: string;
  nama_pegawai: string | null;
  jumlah_tahun_semasa: number;
  jumlah_tahun_sebelum: number;
  auto_generated: boolean;
  urutan: number;
}

interface TransactionSumRow extends RowDataPacket {
  sub_category_penerimaan: string;
  total: number;
}

// Default positions for Sumbangan Elaun
const DEFAULT_POSITIONS = [
  { jawatan: 'Nazir', urutan: 1 },
  { jawatan: 'Imam 1', urutan: 2 },
  { jawatan: 'Imam II', urutan: 3 },
  { jawatan: 'Bilal 1', urutan: 4 },
  { jawatan: 'Bilal II', urutan: 5 },
  { jawatan: 'Siak I', urutan: 6 },
  { jawatan: 'Siak II', urutan: 7 },
  { jawatan: 'Timbalan Nazir', urutan: 8 },
  { jawatan: 'Setiausaha', urutan: 9 },
  { jawatan: 'Penolong Setiausaha', urutan: 10 },
  { jawatan: 'Bendahari', urutan: 11 }
];

// GET - Fetch all nota penerimaan elaun for a specific year
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'head_imam', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear().toString());

    // Fetch existing records
    const [existingRecords] = await pool.query<NotaRow[]>(
      'SELECT * FROM nota_penerimaan_elaun WHERE tahun = ? ORDER BY urutan, id',
      [tahun]
    );

    // If no records exist, create default ones
    if (existingRecords.length === 0) {
      for (const pos of DEFAULT_POSITIONS) {
        await pool.query(
          `INSERT INTO nota_penerimaan_elaun (tahun, jawatan, urutan)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE id = id`,
          [tahun, pos.jawatan, pos.urutan]
        );
      }
      // Re-fetch after creation
      const [newRecords] = await pool.query<NotaRow[]>(
        'SELECT * FROM nota_penerimaan_elaun WHERE tahun = ? ORDER BY urutan, id',
        [tahun]
      );
      existingRecords.push(...newRecords);
    }

    // Calculate totals
    const jumlahSemasa = existingRecords.reduce((sum, row) => sum + parseFloat(row.jumlah_tahun_semasa?.toString() || '0'), 0);
    const jumlahSebelum = existingRecords.reduce((sum, row) => sum + parseFloat(row.jumlah_tahun_sebelum?.toString() || '0'), 0);

    return NextResponse.json({
      tahun,
      data: existingRecords,
      jumlah: {
        semasa: jumlahSemasa,
        sebelum: jumlahSebelum
      }
    });
  } catch (error) {
    console.error('Error fetching nota penerimaan elaun:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Auto-generate values from transactions OR create new entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, tahun, jawatan, nama_pegawai, jumlah_tahun_semasa, jumlah_tahun_sebelum } = body;

    if (action === 'auto_generate') {
      // Auto-generate values from transactions
      const targetYear = tahun || new Date().getFullYear();
      const previousYear = targetYear - 1;

      // Get sums for current year grouped by sub_category_penerimaan
      const [currentYearSums] = await pool.query<TransactionSumRow[]>(
        `SELECT sub_category_penerimaan, SUM(credit_amount) as total
         FROM financial_transactions
         WHERE category_penerimaan = 'Sumbangan Elaun'
         AND sub_category_penerimaan IS NOT NULL
         AND YEAR(transaction_date) = ?
         GROUP BY sub_category_penerimaan`,
        [targetYear]
      );

      // Get sums for previous year
      const [previousYearSums] = await pool.query<TransactionSumRow[]>(
        `SELECT sub_category_penerimaan, SUM(credit_amount) as total
         FROM financial_transactions
         WHERE category_penerimaan = 'Sumbangan Elaun'
         AND sub_category_penerimaan IS NOT NULL
         AND YEAR(transaction_date) = ?
         GROUP BY sub_category_penerimaan`,
        [previousYear]
      );

      // Create maps for easy lookup
      const currentYearMap = new Map(currentYearSums.map(r => [r.sub_category_penerimaan, parseFloat(r.total?.toString() || '0')]));
      const previousYearMap = new Map(previousYearSums.map(r => [r.sub_category_penerimaan, parseFloat(r.total?.toString() || '0')]));

      // Update or insert for each default position
      for (const pos of DEFAULT_POSITIONS) {
        const currentAmount = currentYearMap.get(pos.jawatan) || 0;
        const previousAmount = previousYearMap.get(pos.jawatan) || 0;

        // Get existing record to preserve nama_pegawai
        const [existing] = await pool.query<NotaRow[]>(
          'SELECT nama_pegawai FROM nota_penerimaan_elaun WHERE tahun = ? AND jawatan = ?',
          [targetYear, pos.jawatan]
        );

        const namaPegawai = existing.length > 0 ? existing[0].nama_pegawai : null;

        await pool.query(
          `INSERT INTO nota_penerimaan_elaun (tahun, jawatan, nama_pegawai, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated, created_by)
           VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)
           ON DUPLICATE KEY UPDATE
             jumlah_tahun_semasa = VALUES(jumlah_tahun_semasa),
             jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
             auto_generated = TRUE,
             updated_by = VALUES(created_by)`,
          [targetYear, pos.jawatan, namaPegawai, currentAmount, previousAmount, pos.urutan, session.user.id]
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Data auto-generated successfully',
        year: targetYear
      });
    }

    // Regular create new entry
    if (!tahun || !jawatan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO nota_penerimaan_elaun (tahun, jawatan, nama_pegawai, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated, created_by)
       VALUES (?, ?, ?, ?, ?, 99, FALSE, ?)
       ON DUPLICATE KEY UPDATE
         nama_pegawai = VALUES(nama_pegawai),
         jumlah_tahun_semasa = VALUES(jumlah_tahun_semasa),
         jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
         auto_generated = FALSE,
         updated_by = VALUES(created_by)`,
      [tahun, jawatan, nama_pegawai || null, jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, session.user.id]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating/auto-generating nota penerimaan elaun:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// PUT - Update entry
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, jawatan, nama_pegawai, jumlah_tahun_semasa, jumlah_tahun_sebelum } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    await pool.query(
      `UPDATE nota_penerimaan_elaun
       SET jawatan = ?,
           nama_pegawai = ?,
           jumlah_tahun_semasa = ?,
           jumlah_tahun_sebelum = ?,
           auto_generated = FALSE,
           updated_by = ?
       WHERE id = ?`,
      [jawatan, nama_pegawai || null, jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, session.user.id, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating nota penerimaan elaun:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

// DELETE - Delete entry
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    await pool.query('DELETE FROM nota_penerimaan_elaun WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting nota penerimaan elaun:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
