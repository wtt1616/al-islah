import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface MainRow extends RowDataPacket {
  id: number;
  tahun: number;
  perkara: string;
  jumlah_tahun_semasa: number;
  jumlah_tahun_sebelum: number;
  auto_generated: boolean;
  urutan: number;
}

interface YuranRow extends RowDataPacket {
  id: number;
  tahun: number;
  yuran_aktiviti: string;
  baki_awal: number;
  terimaan: number;
  belanja: number;
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

// Predefined perkara options (sub-kategori Hasil Sewaan/Penjanaan Ekonomi)
const PERKARA_OPTIONS = [
  'Telekomunikasi',
  'Tanah/ Bangunan / Tapak',
  'Fasiliti Dan Peralatan',
];

// GET - Fetch all data for a specific year
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

    // Fetch Table 1: Main data
    const [mainRecords] = await pool.query<MainRow[]>(
      `SELECT * FROM nota_penerimaan_hasil_sewaan
       WHERE tahun = ?
       ORDER BY urutan, id`,
      [tahun]
    );

    const mainData = mainRecords.map(r => ({
      ...r,
      jumlah_tahun_semasa: parseFloat(r.jumlah_tahun_semasa?.toString() || '0'),
      jumlah_tahun_sebelum: parseFloat(r.jumlah_tahun_sebelum?.toString() || '0')
    }));

    const mainGrandTotal = {
      semasa: mainData.reduce((sum, r) => sum + r.jumlah_tahun_semasa, 0),
      sebelum: mainData.reduce((sum, r) => sum + r.jumlah_tahun_sebelum, 0)
    };

    // Fetch Table 2: Yuran Penagajian Dan Aktiviti
    const [yuranRecords] = await pool.query<YuranRow[]>(
      `SELECT * FROM nota_penerimaan_hasil_sewaan_yuran
       WHERE tahun = ?
       ORDER BY urutan, id`,
      [tahun]
    );

    const yuranData = yuranRecords.map(r => ({
      ...r,
      baki_awal: parseFloat(r.baki_awal?.toString() || '0'),
      terimaan: parseFloat(r.terimaan?.toString() || '0'),
      belanja: parseFloat(r.belanja?.toString() || '0'),
      baki: parseFloat(r.baki_awal?.toString() || '0') +
            parseFloat(r.terimaan?.toString() || '0') -
            parseFloat(r.belanja?.toString() || '0')
    }));

    const yuranGrandTotal = {
      baki_awal: yuranData.reduce((sum, r) => sum + r.baki_awal, 0),
      terimaan: yuranData.reduce((sum, r) => sum + r.terimaan, 0),
      belanja: yuranData.reduce((sum, r) => sum + r.belanja, 0),
      baki: yuranData.reduce((sum, r) => sum + r.baki, 0)
    };

    // Fetch Table 3: Summary
    const [summaryRecords] = await pool.query<SummaryRow[]>(
      `SELECT * FROM nota_penerimaan_hasil_sewaan_summary
       WHERE tahun = ?
       ORDER BY urutan, id`,
      [tahun]
    );

    const summaryData = summaryRecords.map(r => ({
      ...r,
      jumlah_tahun_semasa: parseFloat(r.jumlah_tahun_semasa?.toString() || '0'),
      jumlah_tahun_sebelum: parseFloat(r.jumlah_tahun_sebelum?.toString() || '0')
    }));

    return NextResponse.json({
      tahun,
      mainData,
      mainGrandTotal,
      yuranData,
      yuranGrandTotal,
      summaryData,
      perkaraOptions: PERKARA_OPTIONS
    });
  } catch (error) {
    console.error('Error fetching nota penerimaan hasil sewaan:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Create new entry OR auto-generate
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
    const { action, tahun, table, perkara, yuran_aktiviti, jumlah_tahun_semasa, jumlah_tahun_sebelum, baki_awal, terimaan, belanja } = body;

    if (action === 'auto_generate_main') {
      // Auto-generate Table 1 from transactions
      const targetYear = tahun || new Date().getFullYear();
      const previousYear = targetYear - 1;

      // Get sums for current year grouped by sub_category_penerimaan
      const [currentYearSums] = await pool.query<TransactionSumRow[]>(
        `SELECT
           COALESCE(sub_category_penerimaan, 'Lain-lain') as sub_category,
           SUM(credit_amount) as total
         FROM financial_transactions
         WHERE category_penerimaan = 'Hasil Sewaan/Penjanaan Ekonomi'
         AND YEAR(transaction_date) = ?
         GROUP BY sub_category_penerimaan`,
        [targetYear]
      );

      // Get sums for previous year
      const [previousYearSums] = await pool.query<TransactionSumRow[]>(
        `SELECT
           COALESCE(sub_category_penerimaan, 'Lain-lain') as sub_category,
           SUM(credit_amount) as total
         FROM financial_transactions
         WHERE category_penerimaan = 'Hasil Sewaan/Penjanaan Ekonomi'
         AND YEAR(transaction_date) = ?
         GROUP BY sub_category_penerimaan`,
        [previousYear]
      );

      const previousYearMap = new Map<string, number>();
      previousYearSums.forEach(r => {
        previousYearMap.set(r.sub_category, parseFloat(r.total?.toString() || '0'));
      });

      // Clear existing auto-generated records
      await pool.query(
        'DELETE FROM nota_penerimaan_hasil_sewaan WHERE tahun = ? AND auto_generated = TRUE',
        [targetYear]
      );

      let urutan = 1;
      for (const row of currentYearSums) {
        const previousAmount = previousYearMap.get(row.sub_category) || 0;
        const currentAmount = parseFloat(row.total?.toString() || '0');

        await pool.query(
          `INSERT INTO nota_penerimaan_hasil_sewaan
           (tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated)
           VALUES (?, ?, ?, ?, ?, TRUE)
           ON DUPLICATE KEY UPDATE
             jumlah_tahun_semasa = VALUES(jumlah_tahun_semasa),
             jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
             auto_generated = TRUE`,
          [targetYear, row.sub_category, currentAmount, previousAmount, urutan]
        );
        urutan++;
      }

      // Add records from previous year that don't exist in current year
      for (const row of previousYearSums) {
        const existsInCurrent = currentYearSums.some(c => c.sub_category === row.sub_category);
        if (!existsInCurrent) {
          await pool.query(
            `INSERT INTO nota_penerimaan_hasil_sewaan
             (tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated)
             VALUES (?, ?, 0, ?, ?, TRUE)
             ON DUPLICATE KEY UPDATE
               jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
               auto_generated = TRUE`,
            [targetYear, row.sub_category, parseFloat(row.total?.toString() || '0'), urutan]
          );
          urutan++;
        }
      }

      return NextResponse.json({ success: true, message: 'Main data auto-generated successfully' });
    }

    if (action === 'auto_generate_summary') {
      // Auto-generate Table 3 from Table 2 (Yuran)
      const targetYear = tahun || new Date().getFullYear();
      const previousYear = targetYear - 1;

      // Get totals from current year's yuran records
      const [currentYearTotals] = await pool.query<RowDataPacket[]>(
        `SELECT
           SUM(baki_awal) as total_baki_awal,
           SUM(terimaan) as total_terimaan,
           SUM(belanja) as total_belanja
         FROM nota_penerimaan_hasil_sewaan_yuran
         WHERE tahun = ?`,
        [targetYear]
      );

      // Get totals from previous year
      const [previousYearTotals] = await pool.query<RowDataPacket[]>(
        `SELECT
           SUM(baki_awal) as total_baki_awal,
           SUM(terimaan) as total_terimaan,
           SUM(belanja) as total_belanja
         FROM nota_penerimaan_hasil_sewaan_yuran
         WHERE tahun = ?`,
        [previousYear]
      );

      const current = currentYearTotals[0] || { total_baki_awal: 0, total_terimaan: 0, total_belanja: 0 };
      const previous = previousYearTotals[0] || { total_baki_awal: 0, total_terimaan: 0, total_belanja: 0 };

      const currentBakiAwal = parseFloat(current.total_baki_awal?.toString() || '0');
      const currentTerimaan = parseFloat(current.total_terimaan?.toString() || '0');
      const currentBelanja = parseFloat(current.total_belanja?.toString() || '0');
      const currentBaki = currentBakiAwal + currentTerimaan - currentBelanja;

      const previousBakiAwal = parseFloat(previous.total_baki_awal?.toString() || '0');
      const previousTerimaan = parseFloat(previous.total_terimaan?.toString() || '0');
      const previousBelanja = parseFloat(previous.total_belanja?.toString() || '0');
      const previousBaki = previousBakiAwal + previousTerimaan - previousBelanja;

      // Clear existing auto-generated summary
      await pool.query(
        'DELETE FROM nota_penerimaan_hasil_sewaan_summary WHERE tahun = ? AND auto_generated = TRUE',
        [targetYear]
      );

      const summaryItems = [
        { perkara: 'Baki awal', semasa: currentBakiAwal, sebelum: previousBakiAwal, urutan: 1 },
        { perkara: 'Terimaan', semasa: currentTerimaan, sebelum: previousTerimaan, urutan: 2 },
        { perkara: 'Perbelanjaan', semasa: currentBelanja, sebelum: previousBelanja, urutan: 3 },
        { perkara: 'Baki', semasa: currentBaki, sebelum: previousBaki, urutan: 4 }
      ];

      for (const item of summaryItems) {
        await pool.query(
          `INSERT INTO nota_penerimaan_hasil_sewaan_summary
           (tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated)
           VALUES (?, ?, ?, ?, ?, TRUE)
           ON DUPLICATE KEY UPDATE
             jumlah_tahun_semasa = VALUES(jumlah_tahun_semasa),
             jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
             auto_generated = TRUE`,
          [targetYear, item.perkara, item.semasa, item.sebelum, item.urutan]
        );
      }

      return NextResponse.json({ success: true, message: 'Summary auto-generated successfully' });
    }

    // Regular create new entry based on table type
    if (table === 'main') {
      if (!tahun || !perkara) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const [maxUrutan] = await pool.query<RowDataPacket[]>(
        'SELECT MAX(urutan) as max_urutan FROM nota_penerimaan_hasil_sewaan WHERE tahun = ?',
        [tahun]
      );
      const newUrutan = (maxUrutan[0]?.max_urutan || 0) + 1;

      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO nota_penerimaan_hasil_sewaan
         (tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum, urutan, auto_generated)
         VALUES (?, ?, ?, ?, ?, FALSE)`,
        [tahun, perkara, jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, newUrutan]
      );

      return NextResponse.json({ success: true, id: result.insertId });
    }

    if (table === 'yuran') {
      if (!tahun || !yuran_aktiviti) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const [maxUrutan] = await pool.query<RowDataPacket[]>(
        'SELECT MAX(urutan) as max_urutan FROM nota_penerimaan_hasil_sewaan_yuran WHERE tahun = ?',
        [tahun]
      );
      const newUrutan = (maxUrutan[0]?.max_urutan || 0) + 1;

      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO nota_penerimaan_hasil_sewaan_yuran
         (tahun, yuran_aktiviti, baki_awal, terimaan, belanja, urutan)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tahun, yuran_aktiviti, baki_awal || 0, terimaan || 0, belanja || 0, newUrutan]
      );

      return NextResponse.json({ success: true, id: result.insertId });
    }

    return NextResponse.json({ error: 'Invalid table type' }, { status: 400 });
  } catch (error) {
    console.error('Error creating nota penerimaan hasil sewaan:', error);
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
    const { id, table, perkara, yuran_aktiviti, jumlah_tahun_semasa, jumlah_tahun_sebelum, baki_awal, terimaan, belanja } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    if (table === 'main') {
      await pool.query(
        `UPDATE nota_penerimaan_hasil_sewaan
         SET perkara = ?,
             jumlah_tahun_semasa = ?,
             jumlah_tahun_sebelum = ?,
             auto_generated = FALSE
         WHERE id = ?`,
        [perkara, jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, id]
      );
    } else if (table === 'yuran') {
      await pool.query(
        `UPDATE nota_penerimaan_hasil_sewaan_yuran
         SET yuran_aktiviti = ?,
             baki_awal = ?,
             terimaan = ?,
             belanja = ?
         WHERE id = ?`,
        [yuran_aktiviti, baki_awal || 0, terimaan || 0, belanja || 0, id]
      );
    } else if (table === 'summary') {
      await pool.query(
        `UPDATE nota_penerimaan_hasil_sewaan_summary
         SET jumlah_tahun_semasa = ?,
             jumlah_tahun_sebelum = ?,
             auto_generated = FALSE
         WHERE id = ?`,
        [jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating nota penerimaan hasil sewaan:', error);
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
    const table = searchParams.get('table');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    if (table === 'main') {
      await pool.query('DELETE FROM nota_penerimaan_hasil_sewaan WHERE id = ?', [id]);
    } else if (table === 'yuran') {
      await pool.query('DELETE FROM nota_penerimaan_hasil_sewaan_yuran WHERE id = ?', [id]);
    } else if (table === 'summary') {
      await pool.query('DELETE FROM nota_penerimaan_hasil_sewaan_summary WHERE id = ?', [id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting nota penerimaan hasil sewaan:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
