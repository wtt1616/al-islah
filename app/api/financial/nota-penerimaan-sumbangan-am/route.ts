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
}

interface TransactionSumRow extends RowDataPacket {
  sub_category_penerimaan: string;
  total: number;
}

// Default sub-categories for Sumbangan Am
const DEFAULT_SUBCATEGORIES = [
  'Kutipan Jumaat',
  'Kutipan Harian',
  'Kutipan Hari Raya',
  'Sumbangan Agensi/Korporat/Syarikat/Yayasan',
  'Tahlil dan Doa Selamat',
  'Aktiviti dan Pengimarahan',
  'Lain-lain (Tanpa Sub-Kategori)'
];

// GET - Fetch all nota penerimaan sumbangan am for a specific year
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
      'SELECT * FROM nota_penerimaan_sumbangan_am WHERE tahun = ? ORDER BY id',
      [tahun]
    );

    // If no records exist, create default ones
    if (existingRecords.length === 0) {
      for (const perkara of DEFAULT_SUBCATEGORIES) {
        await pool.query(
          `INSERT INTO nota_penerimaan_sumbangan_am (tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum, auto_generated)
           VALUES (?, ?, 0, 0, TRUE)
           ON DUPLICATE KEY UPDATE id = id`,
          [tahun, perkara]
        );
      }
      // Re-fetch after creation
      const [newRecords] = await pool.query<NotaRow[]>(
        'SELECT * FROM nota_penerimaan_sumbangan_am WHERE tahun = ? ORDER BY id',
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
    console.error('Error fetching nota penerimaan sumbangan am:', error);
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
      // Auto-generate values from transactions using bulan_perkiraan logic (same as laporan-bulanan)
      const targetYear = tahun || new Date().getFullYear();
      const previousYear = targetYear - 1;

      // Helper function to get yearly total with bulan_perkiraan logic
      // For a given year, we need to sum all 12 months using the proper logic:
      // - Current month transactions with bulan_semasa or NULL
      // - Previous month transactions with bulan_depan (carried forward)
      // - Next month transactions with bulan_sebelum (carried back)
      const getYearlyTerimaanWithPerkiraan = async (year: number) => {
        const results: Map<string, number> = new Map();

        for (let month = 1; month <= 12; month++) {
          const prevMonth = month === 1 ? 12 : month - 1;
          const prevYear = month === 1 ? year - 1 : year;
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextYear = month === 12 ? year + 1 : year;

          const [rows] = await pool.query<TransactionSumRow[]>(
            `SELECT COALESCE(sub_category_penerimaan, 'Lain-lain (Tanpa Sub-Kategori)') as sub_category_penerimaan,
                    SUM(credit_amount) as total
             FROM financial_transactions
             WHERE category_penerimaan = 'Sumbangan Am'
             AND transaction_type = 'penerimaan'
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
             GROUP BY COALESCE(sub_category_penerimaan, 'Lain-lain (Tanpa Sub-Kategori)')`,
            [month, year, prevMonth, prevYear, nextMonth, nextYear]
          );

          for (const row of rows) {
            const current = results.get(row.sub_category_penerimaan) || 0;
            results.set(row.sub_category_penerimaan, current + parseFloat(row.total?.toString() || '0'));
          }
        }
        return results;
      };

      // Get yearly totals with bulan_perkiraan logic
      const currentYearMap = await getYearlyTerimaanWithPerkiraan(targetYear);
      const previousYearMap = await getYearlyTerimaanWithPerkiraan(previousYear);

      // Update or insert for each default subcategory
      for (const subcat of DEFAULT_SUBCATEGORIES) {
        const currentAmount = currentYearMap.get(subcat) || 0;
        const previousAmount = previousYearMap.get(subcat) || 0;

        await pool.query(
          `INSERT INTO nota_penerimaan_sumbangan_am (tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum, auto_generated, created_by)
           VALUES (?, ?, ?, ?, TRUE, ?)
           ON DUPLICATE KEY UPDATE
             jumlah_tahun_semasa = VALUES(jumlah_tahun_semasa),
             jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
             auto_generated = TRUE,
             updated_by = VALUES(created_by)`,
          [targetYear, subcat, currentAmount, previousAmount, session.user.id]
        );
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

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO nota_penerimaan_sumbangan_am (tahun, perkara, jumlah_tahun_semasa, jumlah_tahun_sebelum, auto_generated, created_by)
       VALUES (?, ?, ?, ?, FALSE, ?)
       ON DUPLICATE KEY UPDATE
         jumlah_tahun_semasa = VALUES(jumlah_tahun_semasa),
         jumlah_tahun_sebelum = VALUES(jumlah_tahun_sebelum),
         auto_generated = FALSE,
         updated_by = VALUES(created_by)`,
      [tahun, perkara, jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, session.user.id]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating/auto-generating nota penerimaan sumbangan am:', error);
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
      `UPDATE nota_penerimaan_sumbangan_am
       SET perkara = ?,
           jumlah_tahun_semasa = ?,
           jumlah_tahun_sebelum = ?,
           auto_generated = FALSE,
           updated_by = ?
       WHERE id = ?`,
      [perkara, jumlah_tahun_semasa || 0, jumlah_tahun_sebelum || 0, session.user.id, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating nota penerimaan sumbangan am:', error);
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

    await pool.query('DELETE FROM nota_penerimaan_sumbangan_am WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting nota penerimaan sumbangan am:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
