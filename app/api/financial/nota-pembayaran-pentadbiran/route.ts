import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface NotaRow extends RowDataPacket {
  id: number;
  tahun: number;
  sub_kategori1: string;
  sub_kategori1_kod: string;
  sub_kategori2: string;
  jumlah_tahun_semasa: number;
  jumlah_tahun_sebelum: number;
  auto_generated: boolean;
  urutan: number;
}

interface TransactionSumRow extends RowDataPacket {
  sub_category1: string;
  sub_category2: string;
  total: number;
}

// Predefined sub-categories structure
const SUB_KATEGORI1_MAP: Record<string, { kod: string; nama: string }> = {
  'Utiliti': { kod: 'a', nama: 'Utiliti' },
  'Perkhidmatan Keselamatan': { kod: 'b', nama: 'Perkhidmatan Keselamatan' },
  'Khidmat Perunding': { kod: 'c', nama: 'Khidmat Perunding' },
  'Perkhidmatan Pembersihan / Landskap': { kod: 'd', nama: 'Perkhidmatan Pembersihan / Landskap' },
  'Pengurusan Pejabat': { kod: 'e', nama: 'Pengurusan Pejabat' },
};

// GET - Fetch all nota pembayaran pentadbiran for a specific year
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

    // Fetch existing records ordered by sub_kategori1_kod and urutan
    const [existingRecords] = await pool.query<NotaRow[]>(
      `SELECT * FROM nota_pembayaran_pentadbiran
       WHERE tahun = ?
       ORDER BY sub_kategori1_kod, urutan, id`,
      [tahun]
    );

    // Group by sub_kategori1
    const groupedData: Record<string, { kod: string; nama: string; items: NotaRow[]; subtotal: { semasa: number; sebelum: number } }> = {};

    // Initialize all sub-categories
    Object.entries(SUB_KATEGORI1_MAP).forEach(([key, value]) => {
      groupedData[key] = {
        kod: value.kod,
        nama: value.nama,
        items: [],
        subtotal: { semasa: 0, sebelum: 0 }
      };
    });

    // Populate with data
    existingRecords.forEach(row => {
      if (groupedData[row.sub_kategori1]) {
        groupedData[row.sub_kategori1].items.push(row);
        groupedData[row.sub_kategori1].subtotal.semasa += parseFloat(row.jumlah_tahun_semasa?.toString() || '0');
        groupedData[row.sub_kategori1].subtotal.sebelum += parseFloat(row.jumlah_tahun_sebelum?.toString() || '0');
      }
    });

    // Calculate grand totals
    const grandTotal = {
      semasa: Object.values(groupedData).reduce((sum, g) => sum + g.subtotal.semasa, 0),
      sebelum: Object.values(groupedData).reduce((sum, g) => sum + g.subtotal.sebelum, 0)
    };

    return NextResponse.json({
      tahun,
      data: groupedData,
      grandTotal,
      subKategori1List: Object.entries(SUB_KATEGORI1_MAP).map(([key, value]) => ({
        nama: key,
        kod: value.kod
      }))
    });
  } catch (error) {
    console.error('Error fetching nota pembayaran pentadbiran:', error);
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
    const { action, tahun, sub_kategori1, sub_kategori2, jumlah_tahun_semasa, jumlah_tahun_sebelum } = body;

    if (action === 'auto_generate') {
      // Auto-generate values from transactions
      const targetYear = tahun || new Date().getFullYear();
      const previousYear = targetYear - 1;

      // Helper function to get yearly pembayaran with bulan_perkiraan logic
      const getYearlyPembayaranPentadbiran = async (year: number) => {
        const results: TransactionSumRow[] = [];

        for (let month = 1; month <= 12; month++) {
          const prevMonth = month === 1 ? 12 : month - 1;
          const prevYear = month === 1 ? year - 1 : year;
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextYear = month === 12 ? year + 1 : year;

          const [rows] = await pool.query<TransactionSumRow[]>(
            `SELECT
               COALESCE(sub_category1_pembayaran, 'Pengurusan Pejabat') as sub_category1,
               COALESCE(NULLIF(sub_category2_pembayaran, ''), 'Lain-lain') as sub_category2,
               SUM(debit_amount) as total
             FROM financial_transactions
             WHERE category_pembayaran = 'Pentadbiran'
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
             GROUP BY COALESCE(sub_category1_pembayaran, 'Pengurusan Pejabat'),
                      COALESCE(NULLIF(sub_category2_pembayaran, ''), 'Lain-lain')`,
            [month, year, prevMonth, prevYear, nextMonth, nextYear]
          );

          results.push(...rows);
        }

        // Aggregate results by sub_category1 and sub_category2
        const aggregated = new Map<string, TransactionSumRow>();
        for (const row of results) {
          const key = `${row.sub_category1}|${row.sub_category2}`;
          const existing = aggregated.get(key);
          if (existing) {
            existing.total = parseFloat(existing.total?.toString() || '0') + parseFloat(row.total?.toString() || '0');
          } else {
            aggregated.set(key, { ...row, total: parseFloat(row.total?.toString() || '0') } as TransactionSumRow);
          }
        }

        return Array.from(aggregated.values());
      };

      // Get sums for current and previous year using bulan_perkiraan logic
      const currentYearSums = await getYearlyPembayaranPentadbiran(targetYear);
      const previousYearSums = await getYearlyPembayaranPentadbiran(previousYear);

      // Create map for previous year lookup
      const previousYearMap = new Map<string, number>();
      previousYearSums.forEach(r => {
        const key = `${r.sub_category1}|${r.sub_category2}`;
        previousYearMap.set(key, parseFloat(r.total?.toString() || '0'));
      });

      // Clear existing auto-generated records for this year
      await pool.query(
        'DELETE FROM nota_pembayaran_pentadbiran WHERE tahun = ? AND auto_generated = TRUE',
        [targetYear]
      );

      // Insert new records from current year transactions
      const urutanMap: Record<string, number> = {};

      for (const row of currentYearSums) {
        const subKat1 = row.sub_category1 || 'Pengurusan Pejabat';
        const subKat1Info = SUB_KATEGORI1_MAP[subKat1] || { kod: 'e', nama: subKat1 };
        const key = `${row.sub_category1}|${row.sub_category2}`;
        const previousAmount = previousYearMap.get(key) || 0;
        const currentAmount = parseFloat(row.total?.toString() || '0');

        // Get next urutan for this sub_kategori1
        if (!urutanMap[subKat1]) {
          urutanMap[subKat1] = 1;
        }

        await pool.query(
          `INSERT INTO nota_pembayaran_pentadbiran
           (tahun, sub_kategori1, sub_kategori1_kod, sub_kategori2, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?)
           ON DUPLICATE KEY UPDATE
             jumlah_tahun_semasa = VALUES(jumlah_tahun_semasa),
             jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
             auto_generated = TRUE,
             updated_by = VALUES(created_by)`,
          [targetYear, subKat1, subKat1Info.kod, row.sub_category2, currentAmount, previousAmount, urutanMap[subKat1], session.user.id]
        );
        urutanMap[subKat1]++;
      }

      // Also add records from previous year that don't exist in current year
      for (const row of previousYearSums) {
        const key = `${row.sub_category1}|${row.sub_category2}`;
        const existsInCurrent = currentYearSums.some(
          c => `${c.sub_category1}|${c.sub_category2}` === key
        );

        if (!existsInCurrent) {
          const subKat1 = row.sub_category1 || 'Pengurusan Pejabat';
          const subKat1Info = SUB_KATEGORI1_MAP[subKat1] || { kod: 'e', nama: subKat1 };
          const previousAmount = parseFloat(row.total?.toString() || '0');

          if (!urutanMap[subKat1]) {
            urutanMap[subKat1] = 1;
          }

          await pool.query(
            `INSERT INTO nota_pembayaran_pentadbiran
             (tahun, sub_kategori1, sub_kategori1_kod, sub_kategori2, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated, created_by)
             VALUES (?, ?, ?, ?, 0, ?, ?, TRUE, ?)
             ON DUPLICATE KEY UPDATE
               jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
               auto_generated = TRUE,
               updated_by = VALUES(created_by)`,
            [targetYear, subKat1, subKat1Info.kod, row.sub_category2, previousAmount, urutanMap[subKat1], session.user.id]
          );
          urutanMap[subKat1]++;
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Data auto-generated successfully',
        year: targetYear
      });
    }

    // Regular create new entry
    if (!tahun || !sub_kategori1 || !sub_kategori2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subKat1Info = SUB_KATEGORI1_MAP[sub_kategori1] || { kod: 'e', nama: sub_kategori1 };

    // Get max urutan for this sub_kategori1
    const [maxUrutan] = await pool.query<RowDataPacket[]>(
      'SELECT MAX(urutan) as max_urutan FROM nota_pembayaran_pentadbiran WHERE tahun = ? AND sub_kategori1 = ?',
      [tahun, sub_kategori1]
    );
    const newUrutan = (maxUrutan[0]?.max_urutan || 0) + 1;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO nota_pembayaran_pentadbiran
       (tahun, sub_kategori1, sub_kategori1_kod, sub_kategori2, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, ?)`,
      [tahun, sub_kategori1, subKat1Info.kod, sub_kategori2, jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, newUrutan, session.user.id]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating/auto-generating nota pembayaran pentadbiran:', error);
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
    const { id, sub_kategori1, sub_kategori2, jumlah_tahun_semasa, jumlah_tahun_sebelum } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const subKat1Info = SUB_KATEGORI1_MAP[sub_kategori1] || { kod: 'e', nama: sub_kategori1 };

    await pool.query(
      `UPDATE nota_pembayaran_pentadbiran
       SET sub_kategori1 = ?,
           sub_kategori1_kod = ?,
           sub_kategori2 = ?,
           jumlah_tahun_semasa = ?,
           jumlah_tahun_sebelum = ?,
           auto_generated = FALSE,
           updated_by = ?
       WHERE id = ?`,
      [sub_kategori1, subKat1Info.kod, sub_kategori2, jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, session.user.id, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating nota pembayaran pentadbiran:', error);
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

    await pool.query('DELETE FROM nota_pembayaran_pentadbiran WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting nota pembayaran pentadbiran:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
