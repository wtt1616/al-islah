import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

interface PenyesuaianBank extends RowDataPacket {
  id: number;
  tahun: number;
  bulan: number;
  baki_penyata_bank: number;
  caj_bank: number;
  komisen_bank: number;
  cek_tak_laku: number;
  lain_lain_pendahuluan: number;
  dividen_hibah: number;
  nota: string | null;
  created_by: number;
  updated_by: number;
  created_at: Date;
  updated_at: Date;
}

// GET - Fetch penyesuaian bank data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'bendahari', 'head_imam'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun');
    const bulan = searchParams.get('bulan');

    if (tahun && bulan) {
      // Get specific month data
      const [rows] = await pool.query<PenyesuaianBank[]>(
        'SELECT * FROM penyesuaian_bank WHERE tahun = ? AND bulan = ?',
        [tahun, bulan]
      );

      // Calculate next and previous month
      const nextMonth = parseInt(bulan) === 12 ? 1 : parseInt(bulan) + 1;
      const nextYear = parseInt(bulan) === 12 ? parseInt(tahun) + 1 : parseInt(tahun);
      const prevMonth = parseInt(bulan) === 1 ? 12 : parseInt(bulan) - 1;
      const prevYear = parseInt(bulan) === 1 ? parseInt(tahun) - 1 : parseInt(tahun);

      console.log(`[Penyesuaian Bank] Fetching for tahun=${tahun}, bulan=${bulan}`);
      console.log(`[Penyesuaian Bank] Next: ${nextYear}-${nextMonth}, Prev: ${prevYear}-${prevMonth}`);

      // Get bank statement opening balance and actual bank closing balance
      const [bankStatement] = await pool.query<RowDataPacket[]>(
        'SELECT opening_balance, closing_balance_bank FROM bank_statements WHERE month = ? AND year = ?',
        [bulan, tahun]
      );

      // Calculate total credits and debits for this month (ALL transactions, regardless of bulan_perkiraan)
      const [bankTotals] = await pool.query<RowDataPacket[]>(`
        SELECT
          COALESCE(SUM(credit_amount), 0) as total_credit,
          COALESCE(SUM(debit_amount), 0) as total_debit
        FROM financial_transactions
        WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?
      `, [bulan, tahun]);

      const bankOpeningBalance = bankStatement.length > 0 ? Number(bankStatement[0].opening_balance) : 0;
      const closingBalanceBank = bankStatement.length > 0 ? Number(bankStatement[0].closing_balance_bank) : null;
      const totalBankCredit = Number(bankTotals[0]?.total_credit) || 0;
      const totalBankDebit = Number(bankTotals[0]?.total_debit) || 0;
      const calculatedBankClosing = bankOpeningBalance + totalBankCredit - totalBankDebit;

      // Terimaan belum dimasukkan is now 0 - individual transactions are shown separately in transaksi_perkiraan
      const terimaanBelumDimasukkan = 0;
      // Cek belum dikemukakan is now 0 - individual transactions are shown separately in transaksi_perkiraan
      const cekBelumDikemukakan = 0;

      // === LOGIK PENYESUAIAN BANK ===
      // Tujuan: Menyesuaikan Baki Penyata Bank supaya sama dengan Baki Buku Tunai
      // Formula: Baki Bank + CAMPUR - TOLAK = Baki Buku Tunai
      //
      // CAMPUR (Bank LEBIH RENDAH daripada Buku Tunai):
      //   - Pembayaran bulan semasa dengan bulan_perkiraan (ada dalam bank, tiada dalam buku tunai)
      //   - Terimaan dari bulan lain (tiada dalam bank, ada dalam buku tunai)
      //
      // TOLAK (Bank LEBIH TINGGI daripada Buku Tunai):
      //   - Terimaan bulan semasa dengan bulan_perkiraan (ada dalam bank, tiada dalam buku tunai)
      //   - Pembayaran dari bulan lain (tiada dalam bank, ada dalam buku tunai)

      // (TOLAK) Terimaan bulan semasa dengan bulan_perkiraan = bulan_depan sahaja
      // Terimaan ini ada dalam bank statement bulan ini, tapi TIDAK dikira dalam buku tunai bulan ini
      // Bank lebih TINGGI → TOLAK
      // Nota: bulan_sebelum tidak termasuk
      const [transaksiTerimaanCampurRows] = await pool.query<RowDataPacket[]>(`
        SELECT id, transaction_date, payment_details, customer_eft_no,
               credit_amount, debit_amount, bulan_perkiraan,
               'penerimaan' as jenis_transaksi,
               'bulan_semasa' as sumber_bulan
        FROM financial_transactions
        WHERE YEAR(transaction_date) = ?
          AND MONTH(transaction_date) = ?
          AND bulan_perkiraan = 'bulan_depan'
          AND credit_amount > 0
        ORDER BY transaction_date
      `, [tahun, bulan]);

      // (CAMPUR) Pembayaran bulan semasa dengan bulan_perkiraan = bulan_depan sahaja
      // Pembayaran ini ada dalam bank statement bulan ini, tapi TIDAK dikira dalam buku tunai bulan ini
      // Bank lebih RENDAH → CAMPUR
      // Nota: bulan_sebelum tidak termasuk kerana ia dikira dalam bulan sebelum
      const [transaksiPembayaranTolakRows] = await pool.query<RowDataPacket[]>(`
        SELECT id, transaction_date, payment_details, customer_eft_no,
               credit_amount, debit_amount, bulan_perkiraan,
               'pembayaran' as jenis_transaksi,
               'bulan_semasa' as sumber_bulan
        FROM financial_transactions
        WHERE YEAR(transaction_date) = ?
          AND MONTH(transaction_date) = ?
          AND bulan_perkiraan = 'bulan_depan'
          AND debit_amount > 0
        ORDER BY transaction_date
      `, [tahun, bulan]);

      // Transaksi dari bulan depan yang dikira dalam bulan ini (bulan_perkiraan = bulan_sebelum)
      // Transaksi ini TIADA dalam bank statement bulan ini, tapi ADA dalam buku tunai bulan ini
      // Terimaan dari bulan depan → CAMPUR (bank rendah)
      // Pembayaran dari bulan depan → TOLAK (bank tinggi)
      const [transaksiDariBulanLainRows] = await pool.query<RowDataPacket[]>(`
        SELECT id, transaction_date, payment_details, customer_eft_no,
               credit_amount, debit_amount, bulan_perkiraan,
               CASE WHEN credit_amount > 0 THEN 'penerimaan' ELSE 'pembayaran' END as jenis_transaksi,
               'bulan_hadapan' as sumber_bulan
        FROM financial_transactions
        WHERE YEAR(transaction_date) = ?
          AND MONTH(transaction_date) = ?
          AND bulan_perkiraan = 'bulan_sebelum'
          AND (credit_amount > 0 OR debit_amount > 0)
        ORDER BY transaction_date
      `, [nextYear, nextMonth]);

      if (rows.length > 0) {
        return NextResponse.json({
          ...rows[0],
          terimaan_belum_dimasukkan: terimaanBelumDimasukkan,
          cek_belum_dikemukakan: cekBelumDikemukakan,
          // CAMPUR: Terimaan bulan semasa dengan bulan_perkiraan (ada dalam bank, tiada dalam buku tunai)
          transaksi_terimaan_campur: transaksiTerimaanCampurRows,
          // TOLAK: Pembayaran bulan semasa dengan bulan_perkiraan (ada dalam bank, tiada dalam buku tunai)
          transaksi_pembayaran_tolak: transaksiPembayaranTolakRows,
          // TOLAK: Transaksi dari bulan lain (tiada dalam bank, ada dalam buku tunai)
          transaksi_dari_bulan_lain: transaksiDariBulanLainRows,
          // Auto-calculated bank closing balance (from Buku Tunai opening)
          calculated_bank_closing: calculatedBankClosing,
          bank_opening_balance: bankOpeningBalance,
          total_bank_credit: totalBankCredit,
          total_bank_debit: totalBankDebit,
          // Actual bank statement closing balance
          closing_balance_bank: closingBalanceBank
        });
      } else {
        // Return empty data with calculated values
        return NextResponse.json({
          id: null,
          tahun: parseInt(tahun),
          bulan: parseInt(bulan),
          baki_penyata_bank: calculatedBankClosing,
          caj_bank: 0,
          komisen_bank: 0,
          cek_tak_laku: 0,
          dividen_hibah: 0,
          nota: null,
          terimaan_belum_dimasukkan: terimaanBelumDimasukkan,
          cek_belum_dikemukakan: cekBelumDikemukakan,
          transaksi_terimaan_campur: transaksiTerimaanCampurRows,
          transaksi_pembayaran_tolak: transaksiPembayaranTolakRows,
          transaksi_dari_bulan_lain: transaksiDariBulanLainRows,
          // Auto-calculated bank closing balance (from Buku Tunai opening)
          calculated_bank_closing: calculatedBankClosing,
          bank_opening_balance: bankOpeningBalance,
          total_bank_credit: totalBankCredit,
          total_bank_debit: totalBankDebit,
          // Actual bank statement closing balance
          closing_balance_bank: closingBalanceBank
        });
      }
    }

    // Get all records for a year
    if (tahun) {
      const [rows] = await pool.query<PenyesuaianBank[]>(
        'SELECT * FROM penyesuaian_bank WHERE tahun = ? ORDER BY bulan',
        [tahun]
      );
      return NextResponse.json(rows);
    }

    // Get all records
    const [rows] = await pool.query<PenyesuaianBank[]>(
      'SELECT * FROM penyesuaian_bank ORDER BY tahun DESC, bulan DESC'
    );
    return NextResponse.json(rows);

  } catch (error) {
    console.error('Error fetching penyesuaian bank:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Create or update penyesuaian bank
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tahun,
      bulan,
      baki_penyata_bank,
      caj_bank,
      komisen_bank,
      cek_tak_laku,
      lain_lain_pendahuluan,
      dividen_hibah,
      nota,
      closing_balance_bank
    } = body;

    if (!tahun || !bulan) {
      return NextResponse.json({ error: 'Tahun dan bulan diperlukan' }, { status: 400 });
    }

    // Check if record exists
    const [existing] = await pool.query<PenyesuaianBank[]>(
      'SELECT id FROM penyesuaian_bank WHERE tahun = ? AND bulan = ?',
      [tahun, bulan]
    );

    if (existing.length > 0) {
      // Update existing record
      await pool.query(
        `UPDATE penyesuaian_bank SET
          baki_penyata_bank = ?,
          caj_bank = ?,
          komisen_bank = ?,
          cek_tak_laku = ?,
          lain_lain_pendahuluan = ?,
          dividen_hibah = ?,
          nota = ?,
          updated_by = ?
        WHERE tahun = ? AND bulan = ?`,
        [
          baki_penyata_bank || 0,
          caj_bank || 0,
          komisen_bank || 0,
          cek_tak_laku || 0,
          lain_lain_pendahuluan || 0,
          dividen_hibah || 0,
          nota || null,
          session.user.id,
          tahun,
          bulan
        ]
      );

      // Update closing_balance_bank in bank_statements if provided
      if (closing_balance_bank !== undefined && closing_balance_bank !== null) {
        await pool.query(
          'UPDATE bank_statements SET closing_balance_bank = ? WHERE month = ? AND year = ?',
          [closing_balance_bank, bulan, tahun]
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Data penyesuaian bank dikemaskini'
      });
    } else {
      // Insert new record
      await pool.query<ResultSetHeader>(
        `INSERT INTO penyesuaian_bank
          (tahun, bulan, baki_penyata_bank, caj_bank, komisen_bank, cek_tak_laku, lain_lain_pendahuluan, dividen_hibah, nota, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tahun,
          bulan,
          baki_penyata_bank || 0,
          caj_bank || 0,
          komisen_bank || 0,
          cek_tak_laku || 0,
          lain_lain_pendahuluan || 0,
          dividen_hibah || 0,
          nota || null,
          session.user.id
        ]
      );

      // Update closing_balance_bank in bank_statements if provided
      if (closing_balance_bank !== undefined && closing_balance_bank !== null) {
        await pool.query(
          'UPDATE bank_statements SET closing_balance_bank = ? WHERE month = ? AND year = ?',
          [closing_balance_bank, bulan, tahun]
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Data penyesuaian bank disimpan'
      });
    }

  } catch (error) {
    console.error('Error saving penyesuaian bank:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
