import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface NotaRow extends RowDataPacket {
  id: number;
  tahun: number;
  perkara: string;
  jumlah_tahun_semasa: number;
  jumlah_tahun_sebelum: number;
  auto_generated: boolean;
  urutan: number;
}

interface TransactionSumRow extends RowDataPacket {
  perkara: string;
  total: number;
}

// Predefined perkara options
const PERKARA_OPTIONS = [
  'Anak Yatim',
  'Khairat Kematian',
  'Pendidikan',
  'Asnaf',
  'Kebajikan',
  'Pemulihan Akidah',
  'Program Agensi / Korporat',
  'Program Lapangan',
];

// GET - Fetch all nota pembayaran khidmat sosial for a specific year
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

    // Fetch existing records ordered by urutan
    const [existingRecords] = await pool.query<NotaRow[]>(
      `SELECT * FROM nota_pembayaran_khidmat_sosial
       WHERE tahun = ?
       ORDER BY urutan, id`,
      [tahun]
    );

    // Calculate grand total
    const grandTotal = {
      semasa: existingRecords.reduce((sum, r) => sum + parseFloat(r.jumlah_tahun_semasa?.toString() || '0'), 0),
      sebelum: existingRecords.reduce((sum, r) => sum + parseFloat(r.jumlah_tahun_sebelum?.toString() || '0'), 0)
    };

    return NextResponse.json({
      tahun,
      data: existingRecords,
      grandTotal,
      perkaraOptions: PERKARA_OPTIONS
    });
  } catch (error) {
    console.error('Error fetching nota pembayaran khidmat sosial:', error);
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
    const { action, tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum } = body;

    if (action === 'auto_generate') {
      // Auto-generate values from transactions
      const targetYear = tahun || new Date().getFullYear();
      const previousYear = targetYear - 1;

      // Helper function to get yearly pembayaran with bulan_perkiraan logic
      const getYearlyPembayaranKhidmatSosial = async (year: number) => {
        const results: TransactionSumRow[] = [];

        for (let month = 1; month <= 12; month++) {
          const prevMonth = month === 1 ? 12 : month - 1;
          const prevYear = month === 1 ? year - 1 : year;
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextYear = month === 12 ? year + 1 : year;

          const [rows] = await pool.query<TransactionSumRow[]>(
            `SELECT
               COALESCE(sub_category1_pembayaran, 'Lain-lain') as perkara,
               SUM(debit_amount) as total
             FROM financial_transactions
             WHERE category_pembayaran = 'Khidmat Sosial dan Kemasyarakatan'
             AND transaction_type = 'pembayaran'
             AND (
               (MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?
                AND (bulan_perkiraan = 'bulan_semasa' OR bulan_perkiraan IS NULL))
               OR
               (MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?
                AND bulan_perkiraan = 'bulan_depan')
               OR
               (MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?
                AND bulan_perkiraan = 'bulan_sebelum')
             )
             GROUP BY COALESCE(sub_category1_pembayaran, 'Lain-lain')`,
            [month, year, prevMonth, prevYear, nextMonth, nextYear]
          );

          results.push(...rows);
        }

        // Aggregate results by perkara
        const aggregated = new Map<string, number>();
        for (const row of results) {
          const current = aggregated.get(row.perkara) || 0;
          aggregated.set(row.perkara, current + parseFloat(row.total?.toString() || '0'));
        }

        return Array.from(aggregated.entries()).map(([perkara, total]) => ({ perkara, total } as TransactionSumRow));
      };

      // Get sums for current and previous year using bulan_perkiraan logic
      const currentYearSums = await getYearlyPembayaranKhidmatSosial(targetYear);
      const previousYearSums = await getYearlyPembayaranKhidmatSosial(previousYear);

      // Create map for previous year lookup
      const previousYearMap = new Map<string, number>();
      previousYearSums.forEach(r => {
        previousYearMap.set(r.perkara, parseFloat(r.total?.toString() || '0'));
      });

      // Clear existing auto-generated records for this year
      await pool.query(
        'DELETE FROM nota_pembayaran_khidmat_sosial WHERE tahun = ? AND auto_generated = TRUE',
        [targetYear]
      );

      // Insert new records from current year transactions
      let urutan = 1;
      for (const row of currentYearSums) {
        const previousAmount = previousYearMap.get(row.perkara) || 0;
        const currentAmount = parseFloat(row.total?.toString() || '0');

        await pool.query(
          `INSERT INTO nota_pembayaran_khidmat_sosial
           (tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated)
           VALUES (?, ?, ?, ?, ?, TRUE)
           ON DUPLICATE KEY UPDATE
             jumlah_tahun_semasa = VALUES(jumlah_tahun_semasa),
             jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
             auto_generated = TRUE`,
          [targetYear, row.perkara, currentAmount, previousAmount, urutan]
        );
        urutan++;
      }

      // Also add records from previous year that don't exist in current year
      for (const row of previousYearSums) {
        const existsInCurrent = currentYearSums.some(c => c.perkara === row.perkara);

        if (!existsInCurrent) {
          const previousAmount = parseFloat(row.total?.toString() || '0');

          await pool.query(
            `INSERT INTO nota_pembayaran_khidmat_sosial
             (tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated)
             VALUES (?, ?, 0, ?, ?, TRUE)
             ON DUPLICATE KEY UPDATE
               jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
               auto_generated = TRUE`,
            [targetYear, row.perkara, previousAmount, urutan]
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
    if (!tahun || !perkara) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get max urutan
    const [maxUrutan] = await pool.query<RowDataPacket[]>(
      'SELECT MAX(urutan) as max_urutan FROM nota_pembayaran_khidmat_sosial WHERE tahun = ?',
      [tahun]
    );
    const newUrutan = (maxUrutan[0]?.max_urutan || 0) + 1;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO nota_pembayaran_khidmat_sosial
       (tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [tahun, perkara, jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, newUrutan]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating/auto-generating nota pembayaran khidmat sosial:', error);
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
    const { id, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    await pool.query(
      `UPDATE nota_pembayaran_khidmat_sosial
       SET perkara = ?,
           jumlah_tahun_semasa = ?,
           jumlah_tahun_sebelum = ?,
           auto_generated = FALSE
       WHERE id = ?`,
      [perkara, jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating nota pembayaran khidmat sosial:', error);
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

    await pool.query('DELETE FROM nota_pembayaran_khidmat_sosial WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting nota pembayaran khidmat sosial:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
