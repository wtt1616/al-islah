import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

// GET - Fetch dashboard statistics for a given year
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

    // 1. Get opening balance (from January statement or first available statement of the year)
    const [openingBalanceResult] = await pool.query<RowDataPacket[]>(
      `SELECT opening_balance, month FROM bank_statements
       WHERE year = ?
       ORDER BY month ASC
       LIMIT 1`,
      [year]
    );
    const openingBalance = openingBalanceResult[0]?.opening_balance || 0;

    // 2. Get total penerimaan (receipts) for the year
    const [penerimaanResult] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(credit_amount), 0) as total
       FROM financial_transactions ft
       JOIN bank_statements bs ON ft.statement_id = bs.id
       WHERE bs.year = ? AND ft.credit_amount > 0`,
      [year]
    );
    const totalPenerimaan = parseFloat(penerimaanResult[0]?.total || 0);

    // 3. Get total pembayaran (payments) for the year
    const [pembayaranResult] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(debit_amount), 0) as total
       FROM financial_transactions ft
       JOIN bank_statements bs ON ft.statement_id = bs.id
       WHERE bs.year = ? AND ft.debit_amount > 0`,
      [year]
    );
    const totalPembayaran = parseFloat(pembayaranResult[0]?.total || 0);

    // 4. Calculate closing balance
    const closingBalance = openingBalance + totalPenerimaan - totalPembayaran;

    // 5. Get monthly breakdown for charts
    const [monthlyData] = await pool.query<RowDataPacket[]>(
      `SELECT
         bs.month,
         COALESCE(SUM(ft.credit_amount), 0) as penerimaan,
         COALESCE(SUM(ft.debit_amount), 0) as pembayaran
       FROM bank_statements bs
       LEFT JOIN financial_transactions ft ON ft.statement_id = bs.id
       WHERE bs.year = ?
       GROUP BY bs.month
       ORDER BY bs.month ASC`,
      [year]
    );

    // Fill in missing months with 0
    const monthlyBreakdown = [];
    for (let i = 1; i <= 12; i++) {
      const monthData = monthlyData.find((m: any) => m.month === i);
      monthlyBreakdown.push({
        month: i,
        penerimaan: parseFloat(monthData?.penerimaan || 0),
        pembayaran: parseFloat(monthData?.pembayaran || 0)
      });
    }

    // 6. Get penerimaan by category
    const [penerimaanByCategory] = await pool.query<RowDataPacket[]>(
      `SELECT
         COALESCE(ft.category_penerimaan, 'Belum Dikategorikan') as category,
         COALESCE(SUM(ft.credit_amount), 0) as total
       FROM financial_transactions ft
       JOIN bank_statements bs ON ft.statement_id = bs.id
       WHERE bs.year = ? AND ft.credit_amount > 0
       GROUP BY ft.category_penerimaan
       ORDER BY total DESC`,
      [year]
    );

    // 7. Get pembayaran by category
    const [pembayaranByCategory] = await pool.query<RowDataPacket[]>(
      `SELECT
         COALESCE(ft.category_pembayaran, 'Belum Dikategorikan') as category,
         COALESCE(SUM(ft.debit_amount), 0) as total
       FROM financial_transactions ft
       JOIN bank_statements bs ON ft.statement_id = bs.id
       WHERE bs.year = ? AND ft.debit_amount > 0
       GROUP BY ft.category_pembayaran
       ORDER BY total DESC`,
      [year]
    );

    // 8. Get Dana Wakaf total (if exists)
    const [wakafResult] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(ft.credit_amount), 0) as total
       FROM financial_transactions ft
       JOIN bank_statements bs ON ft.statement_id = bs.id
       WHERE bs.year = ?
       AND (ft.category_penerimaan LIKE '%Wakaf%' OR ft.payment_details LIKE '%wakaf%')`,
      [year]
    );
    const danaWakaf = parseFloat(wakafResult[0]?.total || 0);

    // 9. Calculate averages
    const monthsWithData = monthlyBreakdown.filter(m => m.penerimaan > 0 || m.pembayaran > 0).length || 1;
    const avgPenerimaan = totalPenerimaan / monthsWithData;
    const avgPembayaran = totalPembayaran / monthsWithData;

    // 10. Find highest categories
    const highestPenerimaan = penerimaanByCategory[0] || { category: '-', total: 0 };
    const highestPembayaran = pembayaranByCategory[0] || { category: '-', total: 0 };

    return NextResponse.json({
      year,
      summary: {
        openingBalance,
        totalPenerimaan,
        totalPembayaran,
        closingBalance,
        danaWakaf,
        avgPenerimaan,
        avgPembayaran
      },
      monthlyBreakdown,
      penerimaanByCategory: penerimaanByCategory.map((c: any) => ({
        category: c.category || 'Belum Dikategorikan',
        total: parseFloat(c.total),
        percentage: totalPenerimaan > 0 ? (parseFloat(c.total) / totalPenerimaan * 100).toFixed(1) : '0'
      })),
      pembayaranByCategory: pembayaranByCategory.map((c: any) => ({
        category: c.category || 'Belum Dikategorikan',
        total: parseFloat(c.total),
        percentage: totalPembayaran > 0 ? (parseFloat(c.total) / totalPembayaran * 100).toFixed(1) : '0'
      })),
      highlights: {
        highestPenerimaan: {
          category: highestPenerimaan.category || 'Belum Dikategorikan',
          total: parseFloat(highestPenerimaan.total),
          percentage: totalPenerimaan > 0 ? (parseFloat(highestPenerimaan.total) / totalPenerimaan * 100).toFixed(0) : '0'
        },
        highestPembayaran: {
          category: highestPembayaran.category || 'Belum Dikategorikan',
          total: parseFloat(highestPembayaran.total),
          percentage: totalPembayaran > 0 ? (parseFloat(highestPembayaran.total) / totalPembayaran * 100).toFixed(0) : '0'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
