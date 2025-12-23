import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface NotaRow extends RowDataPacket {
  id: number;
  tahun: number;
  subkategori: string;
  baki_awal_jan_sebelum: number;
  terimaan_semasa_sebelum: number;
  belanja_semasa_sebelum: number;
  baki_akhir_dis_sebelum: number;
  baki_awal_jan_semasa: number;
  terimaan_semasa_semasa: number;
  belanja_semasa_semasa: number;
  baki_akhir_dis_semasa: number;
  auto_generated: boolean;
}

interface TransactionSumRow extends RowDataPacket {
  sub_category_penerimaan: string;
  total: number;
}

// Default sub-categories for Sumbangan Khas (Amanah)
const DEFAULT_SUBCATEGORIES = [
  'Khairat Kematian',
  'Pembangunan & Selenggara Wakaf',
  'Yuran Pengajian',
  'Pendidikan',
  'Ihya Ramadhan',
  'Ibadah Qurban',
  'Bantuan Bencana',
  'Anak Yatim',
  'Lain-lain (Tanpa Sub-Kategori)'
];

// GET - Fetch all nota penerimaan sumbangan khas for a specific year
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
      'SELECT * FROM nota_penerimaan_sumbangan_khas WHERE tahun = ? ORDER BY id',
      [tahun]
    );

    // If no records exist, create default ones
    if (existingRecords.length === 0) {
      for (const subkategori of DEFAULT_SUBCATEGORIES) {
        await pool.query(
          `INSERT INTO nota_penerimaan_sumbangan_khas (tahun, subkategori)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE id = id`,
          [tahun, subkategori]
        );
      }
      // Re-fetch after creation
      const [newRecords] = await pool.query<NotaRow[]>(
        'SELECT * FROM nota_penerimaan_sumbangan_khas WHERE tahun = ? ORDER BY id',
        [tahun]
      );
      existingRecords.push(...newRecords);
    }

    // Calculate totals for each row type
    const totals = {
      sebelum: {
        baki_awal_jan: 0,
        terimaan_semasa: 0,
        belanja_semasa: 0,
        baki_akhir_dis: 0
      },
      semasa: {
        baki_awal_jan: 0,
        terimaan_semasa: 0,
        belanja_semasa: 0,
        baki_akhir_dis: 0
      }
    };

    existingRecords.forEach(row => {
      totals.sebelum.baki_awal_jan += parseFloat(row.baki_awal_jan_sebelum?.toString() || '0');
      totals.sebelum.terimaan_semasa += parseFloat(row.terimaan_semasa_sebelum?.toString() || '0');
      totals.sebelum.belanja_semasa += parseFloat(row.belanja_semasa_sebelum?.toString() || '0');
      totals.sebelum.baki_akhir_dis += parseFloat(row.baki_akhir_dis_sebelum?.toString() || '0');
      totals.semasa.baki_awal_jan += parseFloat(row.baki_awal_jan_semasa?.toString() || '0');
      totals.semasa.terimaan_semasa += parseFloat(row.terimaan_semasa_semasa?.toString() || '0');
      totals.semasa.belanja_semasa += parseFloat(row.belanja_semasa_semasa?.toString() || '0');
      totals.semasa.baki_akhir_dis += parseFloat(row.baki_akhir_dis_semasa?.toString() || '0');
    });

    return NextResponse.json({
      tahun,
      data: existingRecords,
      subkategoriList: DEFAULT_SUBCATEGORIES,
      totals
    });
  } catch (error) {
    console.error('Error fetching nota penerimaan sumbangan khas:', error);
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
    const { action, tahun } = body;

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
             WHERE category_penerimaan = 'Sumbangan Khas (Amanah)'
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

      const getYearlyBelanjaWithPerkiraan = async (year: number) => {
        const results: Map<string, number> = new Map();

        for (let month = 1; month <= 12; month++) {
          const prevMonth = month === 1 ? 12 : month - 1;
          const prevYear = month === 1 ? year - 1 : year;
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextYear = month === 12 ? year + 1 : year;

          const [rows] = await pool.query<TransactionSumRow[]>(
            `SELECT COALESCE(sub_category1_pembayaran, 'Lain-lain (Tanpa Sub-Kategori)') as sub_category_penerimaan,
                    SUM(debit_amount) as total
             FROM financial_transactions
             WHERE category_pembayaran = 'Perbelanjaan Khas (Amanah)'
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
             GROUP BY COALESCE(sub_category1_pembayaran, 'Lain-lain (Tanpa Sub-Kategori)')`,
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
      const currentTerimaan = await getYearlyTerimaanWithPerkiraan(targetYear);
      const currentBelanja = await getYearlyBelanjaWithPerkiraan(targetYear);
      const prevTerimaan = await getYearlyTerimaanWithPerkiraan(previousYear);
      const prevBelanja = await getYearlyBelanjaWithPerkiraan(previousYear);

      // Update or insert for each default subcategory
      for (const subcat of DEFAULT_SUBCATEGORIES) {
        const terimaan_semasa = currentTerimaan.get(subcat) || 0;
        const belanja_semasa = currentBelanja.get(subcat) || 0;
        const terimaan_sebelum = prevTerimaan.get(subcat) || 0;
        const belanja_sebelum = prevBelanja.get(subcat) || 0;

        // Get existing record to preserve baki_awal values
        const [existing] = await pool.query<NotaRow[]>(
          'SELECT * FROM nota_penerimaan_sumbangan_khas WHERE tahun = ? AND subkategori = ?',
          [targetYear, subcat]
        );

        const baki_awal_semasa = existing.length > 0 ? parseFloat(existing[0].baki_awal_jan_semasa?.toString() || '0') : 0;
        const baki_awal_sebelum = existing.length > 0 ? parseFloat(existing[0].baki_awal_jan_sebelum?.toString() || '0') : 0;

        // Calculate baki akhir = baki awal + terimaan - belanja
        const baki_akhir_semasa = baki_awal_semasa + terimaan_semasa - belanja_semasa;
        const baki_akhir_sebelum = baki_awal_sebelum + terimaan_sebelum - belanja_sebelum;

        await pool.query(
          `INSERT INTO nota_penerimaan_sumbangan_khas
           (tahun, subkategori, baki_awal_jan_sebelum, terimaan_semasa_sebelum, belanja_semasa_sebelum, baki_akhir_dis_sebelum,
            baki_awal_jan_semasa, terimaan_semasa_semasa, belanja_semasa_semasa, baki_akhir_dis_semasa, auto_generated, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)
           ON DUPLICATE KEY UPDATE
             terimaan_semasa_sebelum = VALUES(terimaan_semasa_sebelum),
             belanja_semasa_sebelum = VALUES(belanja_semasa_sebelum),
             baki_akhir_dis_sebelum = VALUES(baki_akhir_dis_sebelum),
             terimaan_semasa_semasa = VALUES(terimaan_semasa_semasa),
             belanja_semasa_semasa = VALUES(belanja_semasa_semasa),
             baki_akhir_dis_semasa = VALUES(baki_akhir_dis_semasa),
             auto_generated = TRUE,
             updated_by = VALUES(created_by)`,
          [targetYear, subcat, baki_awal_sebelum, terimaan_sebelum, belanja_sebelum, baki_akhir_sebelum,
           baki_awal_semasa, terimaan_semasa, belanja_semasa, baki_akhir_semasa, session.user.id]
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Data auto-generated successfully',
        year: targetYear
      });
    }

    // Regular create new entry
    const { subkategori, ...data } = body;
    if (!tahun || !subkategori) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO nota_penerimaan_sumbangan_khas
       (tahun, subkategori, baki_awal_jan_sebelum, terimaan_semasa_sebelum, belanja_semasa_sebelum, baki_akhir_dis_sebelum,
        baki_awal_jan_semasa, terimaan_semasa_semasa, belanja_semasa_semasa, baki_akhir_dis_semasa, auto_generated, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?)
       ON DUPLICATE KEY UPDATE
         baki_awal_jan_sebelum = VALUES(baki_awal_jan_sebelum),
         terimaan_semasa_sebelum = VALUES(terimaan_semasa_sebelum),
         belanja_semasa_sebelum = VALUES(belanja_semasa_sebelum),
         baki_akhir_dis_sebelum = VALUES(baki_akhir_dis_sebelum),
         baki_awal_jan_semasa = VALUES(baki_awal_jan_semasa),
         terimaan_semasa_semasa = VALUES(terimaan_semasa_semasa),
         belanja_semasa_semasa = VALUES(belanja_semasa_semasa),
         baki_akhir_dis_semasa = VALUES(baki_akhir_dis_semasa),
         auto_generated = FALSE,
         updated_by = VALUES(created_by)`,
      [tahun, subkategori,
       data.baki_awal_jan_sebelum || 0, data.terimaan_semasa_sebelum || 0, data.belanja_semasa_sebelum || 0, data.baki_akhir_dis_sebelum || 0,
       data.baki_awal_jan_semasa || 0, data.terimaan_semasa_semasa || 0, data.belanja_semasa_semasa || 0, data.baki_akhir_dis_semasa || 0,
       session.user.id]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating/auto-generating nota penerimaan sumbangan khas:', error);
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
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    await pool.query(
      `UPDATE nota_penerimaan_sumbangan_khas
       SET subkategori = ?,
           baki_awal_jan_sebelum = ?,
           terimaan_semasa_sebelum = ?,
           belanja_semasa_sebelum = ?,
           baki_akhir_dis_sebelum = ?,
           baki_awal_jan_semasa = ?,
           terimaan_semasa_semasa = ?,
           belanja_semasa_semasa = ?,
           baki_akhir_dis_semasa = ?,
           auto_generated = FALSE,
           updated_by = ?
       WHERE id = ?`,
      [data.subkategori,
       data.baki_awal_jan_sebelum || 0, data.terimaan_semasa_sebelum || 0, data.belanja_semasa_sebelum || 0, data.baki_akhir_dis_sebelum || 0,
       data.baki_awal_jan_semasa || 0, data.terimaan_semasa_semasa || 0, data.belanja_semasa_semasa || 0, data.baki_akhir_dis_semasa || 0,
       session.user.id, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating nota penerimaan sumbangan khas:', error);
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

    await pool.query('DELETE FROM nota_penerimaan_sumbangan_khas WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting nota penerimaan sumbangan khas:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
