import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Fetch financial reports
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
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const reportType = searchParams.get('type'); // summary, detailed, by_category

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    const response: any = {};

    // Summary Report
    if (!reportType || reportType === 'summary') {
      const [summary] = await pool.query<RowDataPacket[]>(
        `SELECT
          SUM(CASE WHEN transaction_type = 'penerimaan' THEN credit_amount ELSE 0 END) as total_penerimaan,
          SUM(CASE WHEN transaction_type = 'pembayaran' THEN debit_amount ELSE 0 END) as total_pembayaran,
          COUNT(CASE WHEN transaction_type = 'uncategorized' THEN 1 END) as uncategorized_count,
          COUNT(*) as total_transactions
        FROM financial_transactions
        WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
        [month, year]
      );

      response.summary = summary[0];
    }

    // By Category Report - Penerimaan
    if (!reportType || reportType === 'by_category') {
      const [penerimaanByCategory] = await pool.query<RowDataPacket[]>(
        `SELECT
          category_penerimaan as category,
          SUM(credit_amount) as total,
          COUNT(*) as count
        FROM financial_transactions
        WHERE transaction_type = 'penerimaan'
        AND MONTH(transaction_date) = ?
        AND YEAR(transaction_date) = ?
        AND category_penerimaan IS NOT NULL
        GROUP BY category_penerimaan
        ORDER BY total DESC`,
        [month, year]
      );

      const [pembayaranByCategory] = await pool.query<RowDataPacket[]>(
        `SELECT
          category_pembayaran as category,
          SUM(debit_amount) as total,
          COUNT(*) as count
        FROM financial_transactions
        WHERE transaction_type = 'pembayaran'
        AND MONTH(transaction_date) = ?
        AND YEAR(transaction_date) = ?
        AND category_pembayaran IS NOT NULL
        GROUP BY category_pembayaran
        ORDER BY total DESC`,
        [month, year]
      );

      response.penerimaan_by_category = penerimaanByCategory;
      response.pembayaran_by_category = pembayaranByCategory;
    }

    // Detailed Transactions
    if (reportType === 'detailed') {
      const [transactions] = await pool.query<RowDataPacket[]>(
        `SELECT *
        FROM financial_transactions
        WHERE MONTH(transaction_date) = ?
        AND YEAR(transaction_date) = ?
        ORDER BY transaction_date DESC`,
        [month, year]
      );

      response.transactions = transactions;
    }

    // Monthly comparison (last 12 months)
    if (reportType === 'comparison') {
      const [monthlyData] = await pool.query<RowDataPacket[]>(
        `SELECT
          YEAR(transaction_date) as year,
          MONTH(transaction_date) as month,
          SUM(CASE WHEN transaction_type = 'penerimaan' THEN credit_amount ELSE 0 END) as total_penerimaan,
          SUM(CASE WHEN transaction_type = 'pembayaran' THEN debit_amount ELSE 0 END) as total_pembayaran
        FROM financial_transactions
        WHERE transaction_date >= DATE_SUB(?, 1)
        GROUP BY YEAR(transaction_date), MONTH(transaction_date)
        ORDER BY year DESC, month DESC
        LIMIT 12`,
        [`${year}-${month}-01`]
      );

      response.monthly_comparison = monthlyData;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
