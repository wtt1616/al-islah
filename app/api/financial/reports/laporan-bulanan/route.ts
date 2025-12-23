import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

// GET - Generate BR-KMS-018 Laporan Kewangan Bulanan Dan Berkala
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

    // Initialize monthly data structure
    const months = ['JAN', 'FEB', 'MAC', 'APR', 'MEI', 'JUN', 'JUL', 'OGS', 'SEPT', 'OKT', 'NOV', 'DIS'];

    // Fetch active penerimaan categories from database
    const [penerimaanCats] = await pool.query<RowDataPacket[]>(
      `SELECT nama_kategori FROM kategori_penerimaan WHERE aktif = TRUE ORDER BY urutan ASC, nama_kategori ASC`
    );
    const TERIMAAN_CATEGORIES = penerimaanCats.map(c => c.nama_kategori);

    // Fetch active pembayaran categories from database
    const [pembayaranCats] = await pool.query<RowDataPacket[]>(
      `SELECT nama_kategori FROM kategori_pembayaran WHERE aktif = TRUE ORDER BY urutan ASC, nama_kategori ASC`
    );
    const PERBELANJAAN_CATEGORIES = pembayaranCats.map(c => c.nama_kategori);

    // Initialize terimaan data with dynamic categories
    const terimaanData: { [category: string]: { [month: number]: number; jumlah: number } } = {};
    TERIMAAN_CATEGORIES.forEach(cat => {
      terimaanData[cat] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, jumlah: 0 };
    });

    // Initialize perbelanjaan data with dynamic categories
    const perbelanjaanData: { [category: string]: { [month: number]: number; jumlah: number } } = {};
    PERBELANJAAN_CATEGORIES.forEach(cat => {
      perbelanjaanData[cat] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, jumlah: 0 };
    });

    // Process each month with bulan_perkiraan logic (same as buku-tunai)
    for (let month = 1; month <= 12; month++) {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      // Fetch transactions for this month using bulan_perkiraan logic
      // Same logic as buku-tunai:
      // 1. Current month with bulan_semasa or NULL
      // 2. Previous month with bulan_depan (carried forward)
      // 3. Next month with bulan_sebelum (carried back)
      const [transactions] = await pool.query<RowDataPacket[]>(
        `SELECT
          ft.transaction_type,
          ft.category_penerimaan,
          ft.category_pembayaran,
          COALESCE(ft.credit_amount, 0) as credit_amount,
          COALESCE(ft.debit_amount, 0) as debit_amount
        FROM financial_transactions ft
        JOIN bank_statements bs ON ft.statement_id = bs.id
        WHERE ft.transaction_type IN ('penerimaan', 'pembayaran')
        AND (
          -- Current month transactions with bulan_semasa or NULL
          (MONTH(ft.transaction_date) = ? AND YEAR(ft.transaction_date) = ?
           AND (ft.bulan_perkiraan = 'bulan_semasa' OR ft.bulan_perkiraan IS NULL))
          OR
          -- Previous month transactions carried forward to this month
          (MONTH(ft.transaction_date) = ? AND YEAR(ft.transaction_date) = ?
           AND ft.bulan_perkiraan = 'bulan_depan')
          OR
          -- Next month transactions carried back to this month
          (MONTH(ft.transaction_date) = ? AND YEAR(ft.transaction_date) = ?
           AND ft.bulan_perkiraan = 'bulan_sebelum')
        )`,
        [month, year, prevMonth, prevYear, nextMonth, nextYear]
      );

      // Process transactions for this month
      for (const txn of transactions) {
        if (txn.transaction_type === 'penerimaan' && txn.category_penerimaan) {
          const category = txn.category_penerimaan;
          const amount = parseFloat(txn.credit_amount) || 0;

          // Only add if category exists in our list
          if (terimaanData[category]) {
            terimaanData[category][month] += amount;
            terimaanData[category].jumlah += amount;
          }
        } else if (txn.transaction_type === 'pembayaran' && txn.category_pembayaran) {
          const category = txn.category_pembayaran;
          const amount = parseFloat(txn.debit_amount) || 0;

          // Only add if category exists in our list
          if (perbelanjaanData[category]) {
            perbelanjaanData[category][month] += amount;
            perbelanjaanData[category].jumlah += amount;
          }
        }
      }
    }

    // Calculate monthly totals
    const jumlahTerimaan: { [month: number]: number; jumlah: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, jumlah: 0 };
    const jumlahPerbelanjaan: { [month: number]: number; jumlah: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, jumlah: 0 };

    TERIMAAN_CATEGORIES.forEach(cat => {
      for (let m = 1; m <= 12; m++) {
        jumlahTerimaan[m] += terimaanData[cat][m];
      }
      jumlahTerimaan.jumlah += terimaanData[cat].jumlah;
    });

    PERBELANJAAN_CATEGORIES.forEach(cat => {
      for (let m = 1; m <= 12; m++) {
        jumlahPerbelanjaan[m] += perbelanjaanData[cat][m];
      }
      jumlahPerbelanjaan.jumlah += perbelanjaanData[cat].jumlah;
    });

    // Calculate Lebih/Kurang (Surplus/Deficit)
    const lebihKurang: { [month: number]: number; jumlah: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, jumlah: 0 };
    for (let m = 1; m <= 12; m++) {
      lebihKurang[m] = jumlahTerimaan[m] - jumlahPerbelanjaan[m];
    }
    lebihKurang.jumlah = jumlahTerimaan.jumlah - jumlahPerbelanjaan.jumlah;

    // Get opening balance for the year (from January or earliest statement)
    const [openingBalanceData] = await pool.query<RowDataPacket[]>(
      `SELECT opening_balance FROM bank_statements
       WHERE year = ? AND month = 1 AND opening_balance IS NOT NULL
       ORDER BY id ASC LIMIT 1`,
      [year]
    );

    // If no January opening balance, calculate from previous year's closing
    let yearOpeningBalance = 0;
    if (openingBalanceData.length > 0 && openingBalanceData[0].opening_balance) {
      yearOpeningBalance = parseFloat(openingBalanceData[0].opening_balance);
    } else {
      // Calculate from all transactions before this year (using bulan_perkiraan logic)
      const [prevYearBalance] = await pool.query<RowDataPacket[]>(
        `SELECT
          COALESCE(SUM(ft.credit_amount), 0) - COALESCE(SUM(ft.debit_amount), 0) as balance
        FROM financial_transactions ft
        JOIN bank_statements bs ON ft.statement_id = bs.id
        WHERE bs.year < ?
        AND (ft.bulan_perkiraan = 'bulan_semasa' OR ft.bulan_perkiraan IS NULL)`,
        [year]
      );

      // Also get earliest opening balance
      const [earliestOpening] = await pool.query<RowDataPacket[]>(
        `SELECT opening_balance FROM bank_statements
         WHERE opening_balance IS NOT NULL AND opening_balance != 0
         ORDER BY year ASC, month ASC LIMIT 1`
      );

      const prevBalance = prevYearBalance.length > 0 ? parseFloat(prevYearBalance[0].balance || 0) : 0;
      const earliestOpeningBal = earliestOpening.length > 0 ? parseFloat(earliestOpening[0].opening_balance || 0) : 0;
      yearOpeningBalance = earliestOpeningBal + prevBalance;
    }

    // Calculate monthly opening and closing balances
    const bakiAwalBulan: { [month: number]: number; jumlah: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, jumlah: 0 };
    const bakiAkhir: { [month: number]: number; jumlah: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, jumlah: 0 };

    let runningBalance = yearOpeningBalance;
    for (let m = 1; m <= 12; m++) {
      bakiAwalBulan[m] = runningBalance;
      bakiAkhir[m] = runningBalance + lebihKurang[m];
      runningBalance = bakiAkhir[m];
    }
    bakiAwalBulan.jumlah = yearOpeningBalance;
    bakiAkhir.jumlah = runningBalance;

    return NextResponse.json({
      year,
      months,
      terimaan: {
        categories: TERIMAAN_CATEGORIES,
        data: terimaanData,
        jumlah: jumlahTerimaan,
      },
      perbelanjaan: {
        categories: PERBELANJAAN_CATEGORIES,
        data: perbelanjaanData,
        jumlah: jumlahPerbelanjaan,
      },
      lebihKurang,
      bakiAwalBulan,
      bakiAkhir,
    });
  } catch (error) {
    console.error('Error generating laporan bulanan:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
