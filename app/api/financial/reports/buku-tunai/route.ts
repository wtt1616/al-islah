import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Generate BR-KMS-002 Buku Tunai (Cash Book)
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
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Calculate opening balance from previous month's closing balance
    // First, try to get opening_balance from current month's bank statement
    const [statementData] = await pool.query<RowDataPacket[]>(
      'SELECT opening_balance FROM bank_statements WHERE month = ? AND year = ?',
      [month, year]
    );

    let openingBalance = 0;

    // If current month's statement has opening_balance set, use it
    if (statementData.length > 0 && statementData[0].opening_balance !== null && parseFloat(statementData[0].opening_balance) !== 0) {
      openingBalance = parseFloat(statementData[0].opening_balance);
    } else {
      // Calculate from all previous transactions (before current month)
      // This calculates: sum of all credits - sum of all debits for all months before current month
      // Only include transactions with bulan_perkiraan = 'bulan_semasa' or NULL
      // Exclude transactions marked for other months
      const [previousBalanceData] = await pool.query<RowDataPacket[]>(
        `SELECT
          COALESCE(SUM(ft.credit_amount), 0) - COALESCE(SUM(ft.debit_amount), 0) as calculated_balance
        FROM financial_transactions ft
        JOIN bank_statements bs ON ft.statement_id = bs.id
        WHERE (bs.year < ? OR (bs.year = ? AND bs.month < ?))
        AND (ft.bulan_perkiraan = 'bulan_semasa' OR ft.bulan_perkiraan IS NULL)`,
        [year, year, month]
      );

      // Also add opening balance from the earliest month if exists
      const [earliestStatement] = await pool.query<RowDataPacket[]>(
        `SELECT opening_balance, month, year
        FROM bank_statements
        WHERE opening_balance IS NOT NULL AND opening_balance != 0
        ORDER BY year ASC, month ASC
        LIMIT 1`
      );

      const calculatedBalance = previousBalanceData.length > 0 ? parseFloat(previousBalanceData[0].calculated_balance || 0) : 0;
      const earliestOpeningBalance = earliestStatement.length > 0 ? parseFloat(earliestStatement[0].opening_balance || 0) : 0;

      // Check if earliest statement is before or equal to current month
      if (earliestStatement.length > 0) {
        const earliestYear = earliestStatement[0].year;
        const earliestMonth = earliestStatement[0].month;
        if (earliestYear < year || (earliestYear === year && earliestMonth < month)) {
          openingBalance = earliestOpeningBalance + calculatedBalance;
        } else if (earliestYear === year && earliestMonth === month) {
          // Current month is the earliest, use its opening balance
          openingBalance = earliestOpeningBalance;
        }
      } else {
        openingBalance = calculatedBalance;
      }
    }

    // Get all transactions for the specified month and year
    // Include:
    // 1. Transactions from current month with bulan_perkiraan = 'bulan_semasa' (or NULL for backward compatibility)
    // 2. Transactions from previous month with bulan_perkiraan = 'bulan_depan' (carried forward)
    // 3. Transactions from next month with bulan_perkiraan = 'bulan_sebelum' (carried back)
    // Exclude:
    // - Transactions from current month with bulan_perkiraan = 'bulan_depan' (will appear next month)
    // - Transactions from current month with bulan_perkiraan = 'bulan_sebelum' (will appear previous month)

    // Calculate previous month and next month
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    const [transactions] = await pool.query<RowDataPacket[]>(
      `SELECT
        ft.*,
        bs.month as statement_month,
        bs.year as statement_year
      FROM financial_transactions ft
      LEFT JOIN bank_statements bs ON ft.statement_id = bs.id
      WHERE ft.transaction_type != 'uncategorized'
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
      )
      ORDER BY ft.transaction_date ASC, ft.id ASC`,
      [month, year, prevMonth, prevYear, nextMonth, nextYear]
    );

    // Group by category for summary
    const penerimaanByCategory: { [key: string]: number } = {};
    const pembayaranByCategory: { [key: string]: number } = {};
    let runningBalance = openingBalance; // Start with opening balance

    // Add running balance to each transaction
    const transactionsWithBalance = transactions.map((txn) => {
      const creditAmount = parseFloat(txn.credit_amount || 0);
      const debitAmount = parseFloat(txn.debit_amount || 0);

      // Update running balance
      runningBalance += creditAmount - debitAmount;

      // Group by category
      if (txn.transaction_type === 'penerimaan' && txn.category_penerimaan) {
        penerimaanByCategory[txn.category_penerimaan] =
          (penerimaanByCategory[txn.category_penerimaan] || 0) + creditAmount;
      } else if (txn.transaction_type === 'pembayaran' && txn.category_pembayaran) {
        pembayaranByCategory[txn.category_pembayaran] =
          (pembayaranByCategory[txn.category_pembayaran] || 0) + debitAmount;
      }

      return {
        ...txn,
        running_balance: runningBalance,
        amount: txn.transaction_type === 'penerimaan' ? creditAmount : debitAmount
      };
    });

    const totalPenerimaan = Object.values(penerimaanByCategory).reduce((sum, val) => sum + val, 0);
    const totalPembayaran = Object.values(pembayaranByCategory).reduce((sum, val) => sum + val, 0);
    const closingBalance = openingBalance + totalPenerimaan - totalPembayaran;

    return NextResponse.json({
      month,
      year,
      openingBalance,
      transactions: transactionsWithBalance,
      penerimaanByCategory,
      pembayaranByCategory,
      totalPenerimaan,
      totalPembayaran,
      closingBalance,
      balance: runningBalance, // For backward compatibility
    });
  } catch (error) {
    console.error('Error generating buku tunai report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
