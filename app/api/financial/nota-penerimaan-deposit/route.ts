import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface NotaRow extends RowDataPacket {
  id: number;
  tahun: number;
  deposit: string;
  tarikh: string | null;
  jumlah_tahun_semasa: number;
  jumlah_tahun_sebelum: number;
  auto_generated: boolean;
  urutan: number;
}

interface TransactionSumRow extends RowDataPacket {
  deposit_type: string;
  total: number;
}

// GET - Fetch all nota penerimaan deposit for a specific year
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
      'SELECT * FROM nota_penerimaan_deposit WHERE tahun = ? ORDER BY urutan, id',
      [tahun]
    );

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
    console.error('Error fetching nota penerimaan deposit:', error);
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
    const { action, tahun, deposit, tarikh, jumlah_tahun_semasa, jumlah_tahun_sebelum } = body;

    if (action === 'auto_generate') {
      // Auto-generate values from transactions
      const targetYear = tahun || new Date().getFullYear();
      const previousYear = targetYear - 1;

      // Get sums for current year grouped by deposit_type (sub_category_penerimaan for Deposit category)
      const [currentYearSums] = await pool.query<TransactionSumRow[]>(
        `SELECT sub_category_penerimaan as deposit_type, SUM(credit_amount) as total
         FROM financial_transactions
         WHERE category_penerimaan = 'Deposit'
         AND sub_category_penerimaan IS NOT NULL
         AND YEAR(transaction_date) = ?
         GROUP BY sub_category_penerimaan`,
        [targetYear]
      );

      // Get sums for previous year
      const [previousYearSums] = await pool.query<TransactionSumRow[]>(
        `SELECT sub_category_penerimaan as deposit_type, SUM(credit_amount) as total
         FROM financial_transactions
         WHERE category_penerimaan = 'Deposit'
         AND sub_category_penerimaan IS NOT NULL
         AND YEAR(transaction_date) = ?
         GROUP BY sub_category_penerimaan`,
        [previousYear]
      );

      // Create map for previous year lookup
      const previousYearMap = new Map<string, number>();
      previousYearSums.forEach(r => {
        previousYearMap.set(r.deposit_type, parseFloat(r.total?.toString() || '0'));
      });

      // Clear existing auto-generated records for this year
      await pool.query(
        'DELETE FROM nota_penerimaan_deposit WHERE tahun = ? AND auto_generated = TRUE',
        [targetYear]
      );

      // Insert new records from current year transactions
      let urutan = 1;
      for (const row of currentYearSums) {
        const previousAmount = previousYearMap.get(row.deposit_type) || 0;
        const currentAmount = parseFloat(row.total?.toString() || '0');

        await pool.query(
          `INSERT INTO nota_penerimaan_deposit
           (tahun, deposit, tarikh, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated, created_by)
           VALUES (?, ?, NULL, ?, ?, ?, TRUE, ?)
           ON DUPLICATE KEY UPDATE
             jumlah_tahun_semasa = VALUES(jumlah_tahun_semasa),
             jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
             auto_generated = TRUE,
             updated_by = VALUES(created_by)`,
          [targetYear, row.deposit_type, currentAmount, previousAmount, urutan, session.user.id]
        );
        urutan++;
      }

      // Also add records from previous year that don't exist in current year
      for (const row of previousYearSums) {
        const existsInCurrent = currentYearSums.some(c => c.deposit_type === row.deposit_type);

        if (!existsInCurrent) {
          const previousAmount = parseFloat(row.total?.toString() || '0');
          await pool.query(
            `INSERT INTO nota_penerimaan_deposit
             (tahun, deposit, tarikh, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated, created_by)
             VALUES (?, ?, NULL, 0, ?, ?, TRUE, ?)
             ON DUPLICATE KEY UPDATE
               jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
               auto_generated = TRUE,
               updated_by = VALUES(created_by)`,
            [targetYear, row.deposit_type, previousAmount, urutan, session.user.id]
          );
          urutan++;
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Data auto-generated successfully',
        year: targetYear
      });
    }

    // Regular create new entry
    if (!tahun || !deposit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get max urutan
    const [maxUrutan] = await pool.query<RowDataPacket[]>(
      'SELECT MAX(urutan) as max_urutan FROM nota_penerimaan_deposit WHERE tahun = ?',
      [tahun]
    );
    const newUrutan = (maxUrutan[0]?.max_urutan || 0) + 1;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO nota_penerimaan_deposit
       (tahun, deposit, tarikh, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated, created_by)
       VALUES (?, ?, ?, ?, ?, ?, FALSE, ?)`,
      [tahun, deposit, tarikh || null, jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, newUrutan, session.user.id]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating/auto-generating nota penerimaan deposit:', error);
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
    const { id, deposit, tarikh, jumlah_tahun_semasa, jumlah_tahun_sebelum } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    await pool.query(
      `UPDATE nota_penerimaan_deposit
       SET deposit = ?,
           tarikh = ?,
           jumlah_tahun_semasa = ?,
           jumlah_tahun_sebelum = ?,
           auto_generated = FALSE,
           updated_by = ?
       WHERE id = ?`,
      [deposit, tarikh || null, jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, session.user.id, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating nota penerimaan deposit:', error);
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

    await pool.query('DELETE FROM nota_penerimaan_deposit WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting nota penerimaan deposit:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
