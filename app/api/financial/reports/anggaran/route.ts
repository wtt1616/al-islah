import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Get BR-KMS-001 Laporan Penerimaan dan Pembayaran (from actual transactions)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin, head_imam, and bendahari can access
    if (!['admin', 'head_imam', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Get PENERIMAAN data from actual transactions, grouped by category
    const [penerimaanData] = await pool.query<RowDataPacket[]>(
      `SELECT
        category_penerimaan as category,
        SUM(credit_amount) as total
      FROM financial_transactions
      WHERE transaction_type = 'penerimaan'
      AND YEAR(transaction_date) = ?
      AND category_penerimaan IS NOT NULL
      GROUP BY category_penerimaan
      ORDER BY category_penerimaan`,
      [year]
    );

    // Get PEMBAYARAN data from actual transactions, grouped by category
    const [pembayaranData] = await pool.query<RowDataPacket[]>(
      `SELECT
        category_pembayaran as category,
        SUM(debit_amount) as total
      FROM financial_transactions
      WHERE transaction_type = 'pembayaran'
      AND YEAR(transaction_date) = ?
      AND category_pembayaran IS NOT NULL
      GROUP BY category_pembayaran
      ORDER BY category_pembayaran`,
      [year]
    );

    // Convert to object format for easier access
    const penerimaanMap: { [key: string]: number } = {};
    penerimaanData.forEach((item) => {
      penerimaanMap[item.category] = parseFloat(item.total || 0);
    });

    const pembayaranMap: { [key: string]: number } = {};
    pembayaranData.forEach((item) => {
      pembayaranMap[item.category] = parseFloat(item.total || 0);
    });

    // Calculate totals
    const totalPenerimaan = Object.values(penerimaanMap).reduce((sum, val) => sum + val, 0);
    const totalPembayaran = Object.values(pembayaranMap).reduce((sum, val) => sum + val, 0);
    const lebihan = totalPenerimaan - totalPembayaran;

    return NextResponse.json({
      year,
      masjid_name: 'MASJID/SURAU',
      penerimaan: penerimaanMap,
      pembayaran: pembayaranMap,
      totalPenerimaan,
      totalPembayaran,
      lebihan,
      exists: true
    });
  } catch (error) {
    console.error('Error fetching anggaran report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

// POST - Create or Update BR-KMS-001 Budget
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and bendahari can create/update budgets
    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { year, masjid_name, budget, status } = body;

    if (!year || !budget) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if budget exists for this year
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM budgets WHERE year = ?',
      [year]
    );

    if (existing.length > 0) {
      // Update existing budget
      await pool.query(
        `UPDATE budgets SET
          masjid_name = ?,
          sumbangan_am_1 = ?, sumbangan_am_2 = ?,
          sumbangan_khas_amanah_1 = ?, sumbangan_khas_amanah_2 = ?,
          hasil_sewaan_ekonomi_1 = ?, hasil_sewaan_ekonomi_2 = ?,
          tahlil_1 = ?, tahlil_2 = ?,
          sumbangan_elaun_1 = ?, sumbangan_elaun_2 = ?,
          hibah_pelaburan_1 = ?, hibah_pelaburan_2 = ?,
          deposit_1 = ?, deposit_2 = ?,
          hibah_bank_1 = ?, hibah_bank_2 = ?,
          lain_terimaan_1 = ?, lain_terimaan_2 = ?,
          pentadbiran_1 = ?, pentadbiran_2 = ?,
          pengurusan_sumber_manusia_1 = ?, pengurusan_sumber_manusia_2 = ?,
          pembangunan_penyelenggaraan_1 = ?, pembangunan_penyelenggaraan_2 = ?,
          dakwah_pengimarahan_1 = ?, dakwah_pengimarahan_2 = ?,
          khidmat_sosial_1 = ?, khidmat_sosial_2 = ?,
          pembelian_aset_1 = ?, pembelian_aset_2 = ?,
          perbelanjaan_khas_amanah_1 = ?, perbelanjaan_khas_amanah_2 = ?,
          pelbagai_1 = ?, pelbagai_2 = ?,
          prepared_by = ?,
          status = ?,
          updated_at = NOW()
        WHERE year = ?`,
        [
          masjid_name,
          budget.sumbangan_am_1, budget.sumbangan_am_2,
          budget.sumbangan_khas_amanah_1, budget.sumbangan_khas_amanah_2,
          budget.hasil_sewaan_ekonomi_1, budget.hasil_sewaan_ekonomi_2,
          budget.tahlil_1, budget.tahlil_2,
          budget.sumbangan_elaun_1, budget.sumbangan_elaun_2,
          budget.hibah_pelaburan_1, budget.hibah_pelaburan_2,
          budget.deposit_1, budget.deposit_2,
          budget.hibah_bank_1, budget.hibah_bank_2,
          budget.lain_terimaan_1, budget.lain_terimaan_2,
          budget.pentadbiran_1, budget.pentadbiran_2,
          budget.pengurusan_sumber_manusia_1, budget.pengurusan_sumber_manusia_2,
          budget.pembangunan_penyelenggaraan_1, budget.pembangunan_penyelenggaraan_2,
          budget.dakwah_pengimarahan_1, budget.dakwah_pengimarahan_2,
          budget.khidmat_sosial_1, budget.khidmat_sosial_2,
          budget.pembelian_aset_1, budget.pembelian_aset_2,
          budget.perbelanjaan_khas_amanah_1, budget.perbelanjaan_khas_amanah_2,
          budget.pelbagai_1, budget.pelbagai_2,
          session.user.id,
          status || 'draft',
          year
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Budget updated successfully',
        id: existing[0].id
      });
    } else {
      // Insert new budget
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO budgets (
          year, masjid_name,
          sumbangan_am_1, sumbangan_am_2,
          sumbangan_khas_amanah_1, sumbangan_khas_amanah_2,
          hasil_sewaan_ekonomi_1, hasil_sewaan_ekonomi_2,
          tahlil_1, tahlil_2,
          sumbangan_elaun_1, sumbangan_elaun_2,
          hibah_pelaburan_1, hibah_pelaburan_2,
          deposit_1, deposit_2,
          hibah_bank_1, hibah_bank_2,
          lain_terimaan_1, lain_terimaan_2,
          pentadbiran_1, pentadbiran_2,
          pengurusan_sumber_manusia_1, pengurusan_sumber_manusia_2,
          pembangunan_penyelenggaraan_1, pembangunan_penyelenggaraan_2,
          dakwah_pengimarahan_1, dakwah_pengimarahan_2,
          khidmat_sosial_1, khidmat_sosial_2,
          pembelian_aset_1, pembelian_aset_2,
          perbelanjaan_khas_amanah_1, perbelanjaan_khas_amanah_2,
          pelbagai_1, pelbagai_2,
          prepared_by, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          year, masjid_name,
          budget.sumbangan_am_1, budget.sumbangan_am_2,
          budget.sumbangan_khas_amanah_1, budget.sumbangan_khas_amanah_2,
          budget.hasil_sewaan_ekonomi_1, budget.hasil_sewaan_ekonomi_2,
          budget.tahlil_1, budget.tahlil_2,
          budget.sumbangan_elaun_1, budget.sumbangan_elaun_2,
          budget.hibah_pelaburan_1, budget.hibah_pelaburan_2,
          budget.deposit_1, budget.deposit_2,
          budget.hibah_bank_1, budget.hibah_bank_2,
          budget.lain_terimaan_1, budget.lain_terimaan_2,
          budget.pentadbiran_1, budget.pentadbiran_2,
          budget.pengurusan_sumber_manusia_1, budget.pengurusan_sumber_manusia_2,
          budget.pembangunan_penyelenggaraan_1, budget.pembangunan_penyelenggaraan_2,
          budget.dakwah_pengimarahan_1, budget.dakwah_pengimarahan_2,
          budget.khidmat_sosial_1, budget.khidmat_sosial_2,
          budget.pembelian_aset_1, budget.pembelian_aset_2,
          budget.perbelanjaan_khas_amanah_1, budget.perbelanjaan_khas_amanah_2,
          budget.pelbagai_1, budget.pelbagai_2,
          session.user.id,
          status || 'draft'
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Budget created successfully',
        id: result.insertId
      });
    }
  } catch (error) {
    console.error('Error saving budget:', error);
    return NextResponse.json(
      { error: 'Failed to save budget' },
      { status: 500 }
    );
  }
}
