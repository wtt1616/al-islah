import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface NotaTotal {
  semasa: number;
  sebelum: number;
}

// Helper function to get total from nota tables
async function getNotaTotal(tableName: string, tahun: number): Promise<NotaTotal> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        SUM(jumlah_tahun_semasa) as semasa,
        SUM(jumlah_tahun_sebelum) as sebelum
       FROM ${tableName}
       WHERE tahun = ?`,
      [tahun]
    );
    return {
      semasa: parseFloat(rows[0]?.semasa?.toString() || '0'),
      sebelum: parseFloat(rows[0]?.sebelum?.toString() || '0')
    };
  } catch (error) {
    console.error(`Error fetching from ${tableName}:`, error);
    return { semasa: 0, sebelum: 0 };
  }
}

// Helper function to get total from nota-baki tables (1, 2, 3) - Baki 1 Jan
async function getNotaButiranBakiTotal(tableNumber: number, tahun: number): Promise<NotaTotal> {
  try {
    let tableName = '';
    if (tableNumber === 1) {
      tableName = 'nota_baki_bank';
    } else if (tableNumber === 2) {
      tableName = 'nota_baki_pelaburan';
    } else if (tableNumber === 3) {
      tableName = 'nota_baki_deposit';
    }

    if (!tableName) return { semasa: 0, sebelum: 0 };

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        SUM(baki_tahun_semasa) as semasa,
        SUM(baki_tahun_sebelum) as sebelum
       FROM ${tableName}
       WHERE tahun = ?`,
      [tahun]
    );
    return {
      semasa: parseFloat(rows[0]?.semasa?.toString() || '0'),
      sebelum: parseFloat(rows[0]?.sebelum?.toString() || '0')
    };
  } catch (error) {
    console.error(`Error fetching nota baki table ${tableNumber}:`, error);
    return { semasa: 0, sebelum: 0 };
  }
}

// Helper function to get total from nota-baki-31dis tables - Baki 31 Dis
async function getNotaButiranBaki31DisTotal(tableNumber: number, tahun: number): Promise<NotaTotal> {
  try {
    let tableName = '';
    if (tableNumber === 21) {
      tableName = 'nota_baki_bank_31dis';
    } else if (tableNumber === 22) {
      tableName = 'nota_baki_pelaburan_31dis';
    }

    if (!tableName) return { semasa: 0, sebelum: 0 };

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        SUM(baki_tahun_semasa) as semasa,
        SUM(baki_tahun_sebelum) as sebelum
       FROM ${tableName}
       WHERE tahun = ?`,
      [tahun]
    );
    return {
      semasa: parseFloat(rows[0]?.semasa?.toString() || '0'),
      sebelum: parseFloat(rows[0]?.sebelum?.toString() || '0')
    };
  } catch (error) {
    console.error(`Error fetching nota baki 31dis table ${tableNumber}:`, error);
    return { semasa: 0, sebelum: 0 };
  }
}

// Helper to get nota-penerimaan-hasil-sewaan total (from main table)
async function getNotaPenerimaanHasilSewaanTotal(tahun: number): Promise<NotaTotal> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        SUM(jumlah_tahun_semasa) as semasa,
        SUM(jumlah_tahun_sebelum) as sebelum
       FROM nota_penerimaan_hasil_sewaan
       WHERE tahun = ?`,
      [tahun]
    );
    return {
      semasa: parseFloat(rows[0]?.semasa?.toString() || '0'),
      sebelum: parseFloat(rows[0]?.sebelum?.toString() || '0')
    };
  } catch (error) {
    console.error('Error fetching nota penerimaan hasil sewaan:', error);
    return { semasa: 0, sebelum: 0 };
  }
}

// Helper to get nota-pembayaran-aset total (from summary table)
async function getNotaPembayaranAsetTotal(tahun: number): Promise<NotaTotal> {
  try {
    // Get "Baki" row from summary which represents total expenditure
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        jumlah_tahun_semasa as semasa,
        jumlah_tahun_sebelum as sebelum
       FROM nota_pembayaran_aset_summary
       WHERE tahun = ? AND perkara = 'Perbelanjaan'`,
      [tahun]
    );
    if (rows.length > 0) {
      return {
        semasa: parseFloat(rows[0]?.semasa?.toString() || '0'),
        sebelum: parseFloat(rows[0]?.sebelum?.toString() || '0')
      };
    }
    // Fallback: calculate from aset table
    const [asetRows] = await pool.query<RowDataPacket[]>(
      `SELECT
        SUM(belanja) as semasa
       FROM nota_pembayaran_aset
       WHERE tahun = ?`,
      [tahun]
    );
    const [prevAsetRows] = await pool.query<RowDataPacket[]>(
      `SELECT
        SUM(belanja) as sebelum
       FROM nota_pembayaran_aset
       WHERE tahun = ?`,
      [tahun - 1]
    );
    return {
      semasa: parseFloat(asetRows[0]?.semasa?.toString() || '0'),
      sebelum: parseFloat(prevAsetRows[0]?.sebelum?.toString() || '0')
    };
  } catch (error) {
    console.error('Error fetching nota pembayaran aset:', error);
    return { semasa: 0, sebelum: 0 };
  }
}

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

    // Fetch all nota totals
    const notaTotals: { [key: number]: NotaTotal } = {};

    // Nota 1, 2, 3 - Baki 1 Jan (Bank, Pelaburan, Deposit)
    notaTotals[1] = await getNotaButiranBakiTotal(1, tahun);
    notaTotals[2] = await getNotaButiranBakiTotal(2, tahun);
    notaTotals[3] = await getNotaButiranBakiTotal(3, tahun);

    // Nota 4 - Sumbangan Am
    notaTotals[4] = await getNotaTotal('nota_penerimaan_sumbangan_am', tahun);

    // Nota 5 - Sumbangan Khas
    notaTotals[5] = await getNotaTotal('nota_penerimaan_sumbangan_khas', tahun);

    // Nota 6 - Hasil Sewaan / Penjanaan Ekonomi
    notaTotals[6] = await getNotaPenerimaanHasilSewaanTotal(tahun);

    // Nota 7 - Elaun
    notaTotals[7] = await getNotaTotal('nota_penerimaan_elaun', tahun);

    // Nota 8 - Pelaburan
    notaTotals[8] = await getNotaTotal('nota_penerimaan_pelaburan', tahun);

    // Nota 9 - Deposit
    notaTotals[9] = await getNotaTotal('nota_penerimaan_deposit', tahun);

    // Nota 10 - Lain-lain
    notaTotals[10] = await getNotaTotal('nota_penerimaan_lain', tahun);

    // Nota 11 - Pentadbiran
    notaTotals[11] = await getNotaTotal('nota_pembayaran_pentadbiran', tahun);

    // Nota 12 - Sumber Manusia
    notaTotals[12] = await getNotaTotal('nota_pembayaran_sumber_manusia', tahun);

    // Nota 13 - Pembangunan
    notaTotals[13] = await getNotaTotal('nota_pembayaran_pembangunan', tahun);

    // Nota 14 - Dakwah
    notaTotals[14] = await getNotaTotal('nota_pembayaran_dakwah', tahun);

    // Nota 15 - Khidmat Sosial
    notaTotals[15] = await getNotaTotal('nota_pembayaran_khidmat_sosial', tahun);

    // Nota 16 - Aset
    notaTotals[16] = await getNotaPembayaranAsetTotal(tahun);

    // Nota 21, 22 - Baki 31 Dis (Bank, Pelaburan)
    notaTotals[21] = await getNotaButiranBaki31DisTotal(21, tahun);
    notaTotals[22] = await getNotaButiranBaki31DisTotal(22, tahun);

    // Build report data structure
    const reportData = {
      tahun,
      sections: [
        {
          title: 'PENYATA PENERIMAAN DAN PEMBAYARAN UNTUK TAHUN BERAKHIR 31 DISEMBER',
          rows: [
            { perkara: 'BAKI SEMUA WANG DI BANK PADA 1 JANUARI', nota: 1, ...notaTotals[1] },
            { perkara: 'BAKI TUNAI DI TANGAN PADA 1 JANUARI', nota: null, semasa: 0, sebelum: 0 },
            { perkara: 'BAKI PELABURAN PADA 1 JANUARI', nota: 2, ...notaTotals[2] },
            { perkara: 'BAKI DEPOSIT DIBAYAR PADA 1 JAN', nota: 3, ...notaTotals[3] },
            { perkara: 'BAKI AKAUN AMANAH PADA 1 JAN', nota: 5, ...notaTotals[5] },
          ]
        },
        {
          title: 'PENERIMAAN',
          rows: [
            { perkara: 'Sumbangan Am', nota: 4, ...notaTotals[4] },
            { perkara: 'Sumbangan Khas (Amanah)', nota: 5, ...notaTotals[5] },
            { perkara: 'Hasil Sewaan / Penjanaan Ekonomi', nota: 6, ...notaTotals[6] },
            { perkara: 'Terimaan Sumbangan Elaun', nota: 7, ...notaTotals[7] },
            { perkara: 'Hibah Pelaburan', nota: 8, ...notaTotals[8] },
            { perkara: 'Deposit Diterima', nota: 9, ...notaTotals[9] },
            { perkara: 'Hibah Bank', nota: null, semasa: 0, sebelum: 0 },
            { perkara: 'Lain-Lain Terimaan', nota: 10, ...notaTotals[10] },
          ]
        },
        {
          title: 'PEMBAYARAN',
          rows: [
            { perkara: 'Pentadbiran', nota: 11, ...notaTotals[11] },
            { perkara: 'Pengurusan Sumber Manusia', nota: 12, ...notaTotals[12] },
            { perkara: 'Pembangunan Dan Penyelenggaraan', nota: 13, ...notaTotals[13] },
            { perkara: 'Dakwah dan Pengimarahan', nota: 14, ...notaTotals[14] },
            { perkara: 'Khidmat Sosial Dan Kemasyarakatan', nota: 15, ...notaTotals[15] },
            { perkara: 'Pembelian Aset', nota: 16, ...notaTotals[16] },
            { perkara: 'Perbelanjaan Khas (Amanah)', nota: 5, ...notaTotals[5] },
            { perkara: 'Pelbagai', nota: null, semasa: 0, sebelum: 0 },
          ]
        },
        {
          title: 'BAKI AKHIR',
          rows: [
            { perkara: 'BAKI WANG DI BANK PADA 31 DISEMBER', nota: null, semasa: 0, sebelum: 0 },
            { perkara: 'BAKI TUNAI DI TANGAN PADA 31 DISEMBER', nota: null, semasa: 0, sebelum: 0 },
            { perkara: 'BAKI PELABURAN DI BANK PADA 31 DISEMBER', nota: 21, ...notaTotals[21] },
            { perkara: 'BAKI DEPOSIT PADA 31 DISEMBER', nota: 22, ...notaTotals[22] },
            { perkara: 'BAKI AKAUN AMANAH PADA 31 DISEMBER', nota: 5, ...notaTotals[5] },
          ]
        }
      ],
      // Calculate totals
      totals: {
        bakiAwal: {
          semasa: (notaTotals[1]?.semasa || 0) + (notaTotals[2]?.semasa || 0) + (notaTotals[3]?.semasa || 0) + (notaTotals[5]?.semasa || 0),
          sebelum: (notaTotals[1]?.sebelum || 0) + (notaTotals[2]?.sebelum || 0) + (notaTotals[3]?.sebelum || 0) + (notaTotals[5]?.sebelum || 0)
        },
        jumlahPenerimaan: {
          semasa: (notaTotals[4]?.semasa || 0) + (notaTotals[5]?.semasa || 0) + (notaTotals[6]?.semasa || 0) +
                  (notaTotals[7]?.semasa || 0) + (notaTotals[8]?.semasa || 0) + (notaTotals[9]?.semasa || 0) + (notaTotals[10]?.semasa || 0),
          sebelum: (notaTotals[4]?.sebelum || 0) + (notaTotals[5]?.sebelum || 0) + (notaTotals[6]?.sebelum || 0) +
                   (notaTotals[7]?.sebelum || 0) + (notaTotals[8]?.sebelum || 0) + (notaTotals[9]?.sebelum || 0) + (notaTotals[10]?.sebelum || 0)
        },
        jumlahPembayaran: {
          semasa: (notaTotals[11]?.semasa || 0) + (notaTotals[12]?.semasa || 0) + (notaTotals[13]?.semasa || 0) +
                  (notaTotals[14]?.semasa || 0) + (notaTotals[15]?.semasa || 0) + (notaTotals[16]?.semasa || 0) + (notaTotals[5]?.semasa || 0),
          sebelum: (notaTotals[11]?.sebelum || 0) + (notaTotals[12]?.sebelum || 0) + (notaTotals[13]?.sebelum || 0) +
                   (notaTotals[14]?.sebelum || 0) + (notaTotals[15]?.sebelum || 0) + (notaTotals[16]?.sebelum || 0) + (notaTotals[5]?.sebelum || 0)
        },
        bakiAkhir: {
          semasa: (notaTotals[21]?.semasa || 0) + (notaTotals[22]?.semasa || 0) + (notaTotals[5]?.semasa || 0),
          sebelum: (notaTotals[21]?.sebelum || 0) + (notaTotals[22]?.sebelum || 0) + (notaTotals[5]?.sebelum || 0)
        }
      },
      notaTotals
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating penyata kewangan tahunan:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
