import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface AsetRow extends RowDataPacket {
  id: number;
  tahun: number;
  senarai_aset: string;
  baki_awal: number;
  terimaan: number;
  belanja: number;
  auto_generated: boolean;
  urutan: number;
}

interface SummaryRow extends RowDataPacket {
  id: number;
  tahun: number;
  perkara: string;
  jumlah_tahun_semasa: number;
  jumlah_tahun_sebelum: number;
  auto_generated: boolean;
  urutan: number;
}

interface TransactionSumRow extends RowDataPacket {
  sub_category: string;
  total: number;
}

// GET - Fetch all nota pembayaran aset for a specific year
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

    // Fetch asset records
    const [asetRecords] = await pool.query<AsetRow[]>(
      `SELECT * FROM nota_pembayaran_aset
       WHERE tahun = ?
       ORDER BY urutan, id`,
      [tahun]
    );

    // Calculate baki for each record and totals
    const asetData = asetRecords.map(r => ({
      ...r,
      baki_awal: parseFloat(r.baki_awal?.toString() || '0'),
      terimaan: parseFloat(r.terimaan?.toString() || '0'),
      belanja: parseFloat(r.belanja?.toString() || '0'),
      baki: parseFloat(r.baki_awal?.toString() || '0') +
            parseFloat(r.terimaan?.toString() || '0') -
            parseFloat(r.belanja?.toString() || '0')
    }));

    // Calculate grand totals
    const grandTotal = {
      baki_awal: asetData.reduce((sum, r) => sum + r.baki_awal, 0),
      terimaan: asetData.reduce((sum, r) => sum + r.terimaan, 0),
      belanja: asetData.reduce((sum, r) => sum + r.belanja, 0),
      baki: asetData.reduce((sum, r) => sum + r.baki, 0)
    };

    // Fetch summary records (Tahun Semasa vs Tahun Sebelum)
    const [summaryRecords] = await pool.query<SummaryRow[]>(
      `SELECT * FROM nota_pembayaran_aset_summary
       WHERE tahun = ?
       ORDER BY urutan, id`,
      [tahun]
    );

    const summaryData = summaryRecords.map(r => ({
      ...r,
      jumlah_tahun_semasa: parseFloat(r.jumlah_tahun_semasa?.toString() || '0'),
      jumlah_tahun_sebelum: parseFloat(r.jumlah_tahun_sebelum?.toString() || '0')
    }));

    // Calculate summary grand totals
    const summaryGrandTotal = {
      semasa: summaryData.reduce((sum, r) => sum + r.jumlah_tahun_semasa, 0),
      sebelum: summaryData.reduce((sum, r) => sum + r.jumlah_tahun_sebelum, 0)
    };

    return NextResponse.json({
      tahun,
      asetData,
      grandTotal,
      summaryData,
      summaryGrandTotal
    });
  } catch (error) {
    console.error('Error fetching nota pembayaran aset:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Create new entry OR auto-generate summary OR auto-generate aset from transactions
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
    const { action, tahun, senarai_aset, baki_awal, terimaan, belanja } = body;

    if (action === 'auto_generate_aset') {
      // Auto-generate aset list from financial transactions (buku tunai)
      const targetYear = tahun || new Date().getFullYear();

      // Helper function to get yearly belanja with bulan_perkiraan logic
      const getYearlyBelanjaAset = async (year: number) => {
        const results: Map<string, number> = new Map();

        for (let month = 1; month <= 12; month++) {
          const prevMonth = month === 1 ? 12 : month - 1;
          const prevYear = month === 1 ? year - 1 : year;
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextYear = month === 12 ? year + 1 : year;

          const [rows] = await pool.query<TransactionSumRow[]>(
            `SELECT COALESCE(NULLIF(sub_category2_pembayaran, ''), sub_category1_pembayaran, 'Lain-lain') as sub_category,
                    SUM(debit_amount) as total
             FROM financial_transactions
             WHERE category_pembayaran = 'Aset'
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
             GROUP BY COALESCE(NULLIF(sub_category2_pembayaran, ''), sub_category1_pembayaran, 'Lain-lain')`,
            [month, year, prevMonth, prevYear, nextMonth, nextYear]
          );

          for (const row of rows) {
            const current = results.get(row.sub_category) || 0;
            results.set(row.sub_category, current + parseFloat(row.total?.toString() || '0'));
          }
        }
        return results;
      };

      // Get current year belanja
      const currentBelanja = await getYearlyBelanjaAset(targetYear);

      // Get existing aset records to preserve baki_awal and terimaan
      const [existingRecords] = await pool.query<AsetRow[]>(
        'SELECT * FROM nota_pembayaran_aset WHERE tahun = ?',
        [targetYear]
      );
      const existingMap = new Map(existingRecords.map(r => [r.senarai_aset, r]));

      // Update or insert for each asset found in transactions
      let urutan = 1;
      for (const [asetName, belanjaAmount] of currentBelanja) {
        const existing = existingMap.get(asetName);
        const bakiAwal = existing ? parseFloat(existing.baki_awal?.toString() || '0') : 0;
        const terimaan = existing ? parseFloat(existing.terimaan?.toString() || '0') : 0;

        await pool.query(
          `INSERT INTO nota_pembayaran_aset
           (tahun, senarai_aset, baki_awal, terimaan, belanja, urutan, auto_generated)
           VALUES (?, ?, ?, ?, ?, ?, TRUE)
           ON DUPLICATE KEY UPDATE
             belanja = VALUES(belanja),
             urutan = VALUES(urutan),
             auto_generated = TRUE`,
          [targetYear, asetName, bakiAwal, terimaan, belanjaAmount, urutan]
        );
        urutan++;
      }

      return NextResponse.json({
        success: true,
        message: 'Senarai aset berjaya dijana dari buku tunai',
        year: targetYear,
        count: currentBelanja.size
      });
    }

    if (action === 'auto_generate_summary') {
      // Auto-generate summary from current year's aset data
      const targetYear = tahun || new Date().getFullYear();
      const previousYear = targetYear - 1;

      // Get totals from current year's aset records
      const [currentYearTotals] = await pool.query<RowDataPacket[]>(
        `SELECT
           SUM(baki_awal) as total_baki_awal,
           SUM(terimaan) as total_terimaan,
           SUM(belanja) as total_belanja
         FROM nota_pembayaran_aset
         WHERE tahun = ?`,
        [targetYear]
      );

      // Get totals from previous year's aset records
      const [previousYearTotals] = await pool.query<RowDataPacket[]>(
        `SELECT
           SUM(baki_awal) as total_baki_awal,
           SUM(terimaan) as total_terimaan,
           SUM(belanja) as total_belanja
         FROM nota_pembayaran_aset
         WHERE tahun = ?`,
        [previousYear]
      );

      const current = currentYearTotals[0] || { total_baki_awal: 0, total_terimaan: 0, total_belanja: 0 };
      const previous = previousYearTotals[0] || { total_baki_awal: 0, total_terimaan: 0, total_belanja: 0 };

      // Calculate baki
      const currentBakiAwal = parseFloat(current.total_baki_awal?.toString() || '0');
      const currentTerimaan = parseFloat(current.total_terimaan?.toString() || '0');
      const currentBelanja = parseFloat(current.total_belanja?.toString() || '0');
      const currentBaki = currentBakiAwal + currentTerimaan - currentBelanja;

      const previousBakiAwal = parseFloat(previous.total_baki_awal?.toString() || '0');
      const previousTerimaan = parseFloat(previous.total_terimaan?.toString() || '0');
      const previousBelanja = parseFloat(previous.total_belanja?.toString() || '0');
      const previousBaki = previousBakiAwal + previousTerimaan - previousBelanja;

      // Clear existing auto-generated summary records for this year
      await pool.query(
        'DELETE FROM nota_pembayaran_aset_summary WHERE tahun = ? AND auto_generated = TRUE',
        [targetYear]
      );

      // Insert summary records
      const summaryItems = [
        { perkara: 'Baki awal', semasa: currentBakiAwal, sebelum: previousBakiAwal, urutan: 1 },
        { perkara: 'Terimaan', semasa: currentTerimaan, sebelum: previousTerimaan, urutan: 2 },
        { perkara: 'Perbelanjaan', semasa: currentBelanja, sebelum: previousBelanja, urutan: 3 },
        { perkara: 'Baki', semasa: currentBaki, sebelum: previousBaki, urutan: 4 }
      ];

      for (const item of summaryItems) {
        await pool.query(
          `INSERT INTO nota_pembayaran_aset_summary
           (tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated)
           VALUES (?, ?, ?, ?, ?, TRUE)
           ON DUPLICATE KEY UPDATE
             jumlah_tahun_semasa = VALUES(jumlah_tahun_semasa),
             jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
             auto_generated = TRUE`,
          [targetYear, item.perkara, item.semasa, item.sebelum, item.urutan]
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Summary auto-generated successfully',
        year: targetYear
      });
    }

    // Regular create new aset entry
    if (!tahun || !senarai_aset) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get max urutan
    const [maxUrutan] = await pool.query<RowDataPacket[]>(
      'SELECT MAX(urutan) as max_urutan FROM nota_pembayaran_aset WHERE tahun = ?',
      [tahun]
    );
    const newUrutan = (maxUrutan[0]?.max_urutan || 0) + 1;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO nota_pembayaran_aset
       (tahun, senarai_aset, baki_awal, terimaan, belanja, urutan, auto_generated)
       VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
      [tahun, senarai_aset, baki_awal || 0, terimaan || 0, belanja || 0, newUrutan]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating nota pembayaran aset:', error);
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
    const { id, type, senarai_aset, baki_awal, terimaan, belanja, jumlah_tahun_semasa, jumlah_tahun_sebelum } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    if (type === 'summary') {
      // Update summary record
      await pool.query(
        `UPDATE nota_pembayaran_aset_summary
         SET jumlah_tahun_semasa = ?,
             jumlah_tahun_sebelum = ?,
             auto_generated = FALSE
         WHERE id = ?`,
        [jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, id]
      );
    } else {
      // Update aset record
      await pool.query(
        `UPDATE nota_pembayaran_aset
         SET senarai_aset = ?,
             baki_awal = ?,
             terimaan = ?,
             belanja = ?,
             auto_generated = FALSE
         WHERE id = ?`,
        [senarai_aset, baki_awal || 0, terimaan || 0, belanja || 0, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating nota pembayaran aset:', error);
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
    const type = searchParams.get('type');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    if (type === 'summary') {
      await pool.query('DELETE FROM nota_pembayaran_aset_summary WHERE id = ?', [id]);
    } else {
      await pool.query('DELETE FROM nota_pembayaran_aset WHERE id = ?', [id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting nota pembayaran aset:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
