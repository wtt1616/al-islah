import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import Papa from 'papaparse';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Fetch all bank statements OR get suggested opening balance
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
    const action = searchParams.get('action');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Get suggested opening balance from previous month's buku tunai closing balance
    if (action === 'get_opening_balance' && month && year) {
      const currentMonth = parseInt(month);
      const currentYear = parseInt(year);

      // Calculate previous month
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = currentYear - 1;
      }

      // Get previous month's statement
      const [prevStatement] = await pool.query<RowDataPacket[]>(
        'SELECT opening_balance FROM bank_statements WHERE month = ? AND year = ?',
        [prevMonth, prevYear]
      );

      if (prevStatement.length === 0) {
        return NextResponse.json({ opening_balance: null, message: 'Tiada penyata bulan sebelum' });
      }

      // Calculate closing balance using Buku Tunai logic
      // This takes into account bulan_perkiraan adjustments
      const prevOpeningBalance = parseFloat(prevStatement[0].opening_balance) || 0;

      // Calculate prev-prev month and next month (relative to prevMonth)
      const prevPrevMonth = prevMonth === 1 ? 12 : prevMonth - 1;
      const prevPrevYear = prevMonth === 1 ? prevYear - 1 : prevYear;
      const nextOfPrevMonth = prevMonth === 12 ? 1 : prevMonth + 1;
      const nextOfPrevYear = prevMonth === 12 ? prevYear + 1 : prevYear;

      // Get transactions for previous month using Buku Tunai logic:
      // 1. Transactions from prevMonth with bulan_semasa or NULL
      // 2. Transactions from prevPrevMonth with bulan_depan (carried forward)
      // 3. Transactions from nextOfPrevMonth with bulan_sebelum (carried back)
      const [transactions] = await pool.query<RowDataPacket[]>(
        `SELECT
          COALESCE(SUM(CASE WHEN ft.transaction_type = 'penerimaan' THEN ft.credit_amount ELSE 0 END), 0) as total_penerimaan,
          COALESCE(SUM(CASE WHEN ft.transaction_type = 'pembayaran' THEN ft.debit_amount ELSE 0 END), 0) as total_pembayaran
        FROM financial_transactions ft
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
        )`,
        [prevMonth, prevYear, prevPrevMonth, prevPrevYear, nextOfPrevMonth, nextOfPrevYear]
      );

      const totalPenerimaan = parseFloat(transactions[0]?.total_penerimaan) || 0;
      const totalPembayaran = parseFloat(transactions[0]?.total_pembayaran) || 0;
      const closingBalance = prevOpeningBalance + totalPenerimaan - totalPembayaran;

      return NextResponse.json({
        opening_balance: closingBalance,
        message: `Baki akhir Buku Tunai ${prevMonth}/${prevYear}`,
        previous_month: prevMonth,
        previous_year: prevYear,
        details: {
          opening_balance: prevOpeningBalance,
          total_penerimaan: totalPenerimaan,
          total_pembayaran: totalPembayaran
        }
      });
    }

    // Default: Fetch all statements
    const [statements] = await pool.query<RowDataPacket[]>(
      `SELECT
        bs.*,
        u.name as uploader_name
      FROM bank_statements bs
      LEFT JOIN users u ON bs.uploaded_by = u.id
      ORDER BY bs.year DESC, bs.month DESC, bs.upload_date DESC`
    );

    return NextResponse.json(statements);
  } catch (error) {
    console.error('Error fetching bank statements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank statements' },
      { status: 500 }
    );
  }
}

// POST - Upload new bank statement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only bendahari and admin can upload
    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const month = parseInt(formData.get('month') as string);
    const year = parseInt(formData.get('year') as string);
    const openingBalanceStr = formData.get('opening_balance') as string;
    const openingBalance = openingBalanceStr ? parseFloat(openingBalanceStr) : null;

    if (!file || !month || !year) {
      return NextResponse.json(
        { error: 'File, month, and year are required' },
        { status: 400 }
      );
    }

    if (openingBalance === null || isNaN(openingBalance)) {
      return NextResponse.json(
        { error: 'Baki awal (opening balance) is required' },
        { status: 400 }
      );
    }

    // Check if statement for this month/year already exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM bank_statements WHERE month = ? AND year = ?',
      [month, year]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Penyata bank untuk ${month}/${year} sudah wujud` },
        { status: 400 }
      );
    }

    // Read and parse CSV file
    const fileText = await file.text();
    const parseResult = Papa.parse(fileText, {
      header: false,
      skipEmptyLines: true,
    });

    const rows = parseResult.data as string[][];

    // Find the header row (row with "Transaction Date")
    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].some(cell => cell && cell.includes('Transaction Date'))) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json(
        { error: 'Invalid CSV format: Header row not found' },
        { status: 400 }
      );
    }

    // Extract transaction rows (start from header + 1)
    const transactionRows = rows.slice(headerRowIndex + 1);

    // Insert bank statement record
    const [statementResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO bank_statements
        (filename, month, year, uploaded_by, total_transactions, opening_balance)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [file.name, month, year, session.user.id, transactionRows.length, openingBalance]
    );

    const statementId = statementResult.insertId;

    // Insert transactions
    let insertedCount = 0;
    for (const row of transactionRows) {
      // Skip if row doesn't have enough data
      if (row.length < 10) continue;

      try {
        const transactionDate = parseTransactionDate(row[1]);
        if (!transactionDate) continue; // Skip invalid dates

        const debitAmount = parseAmount(row[7]);
        const creditAmount = parseAmount(row[8]);
        const balance = parseAmount(row[9]);

        // Determine transaction type based on credit/debit
        // But leave category as NULL (uncategorized) for manual categorization
        let transactionType = 'penerimaan';
        if (debitAmount && debitAmount > 0) {
          transactionType = 'pembayaran';
        } else if (creditAmount && creditAmount > 0) {
          transactionType = 'penerimaan';
        }

        await pool.query(
          `INSERT INTO financial_transactions
            (statement_id, transaction_date, customer_eft_no, transaction_code,
             transaction_description, ref_cheque_no, servicing_branch,
             debit_amount, credit_amount, balance, sender_recipient_name,
             payment_details, transaction_type, category_penerimaan, category_pembayaran)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            statementId,
            transactionDate,
            row[2] || null,
            row[3] || null,
            row[4] || null,
            row[5] || null,
            row[6] || null,
            debitAmount,
            creditAmount,
            balance,
            row[10] || null,
            row[11] || null,
            transactionType,
            null, // category_penerimaan - NULL = uncategorized
            null, // category_pembayaran - NULL = uncategorized
          ]
        );

        insertedCount++;
      } catch (err) {
        console.error('Error inserting transaction:', err, row);
        // Continue with next row
      }
    }

    // Update total transactions count
    await pool.query(
      'UPDATE bank_statements SET total_transactions = ? WHERE id = ?',
      [insertedCount, statementId]
    );

    return NextResponse.json({
      success: true,
      statement_id: statementId,
      total_transactions: insertedCount,
      message: `Berjaya dimuat naik ${insertedCount} transaksi`,
    });
  } catch (error) {
    console.error('Error uploading bank statement:', error);
    return NextResponse.json(
      { error: 'Failed to upload bank statement' },
      { status: 500 }
    );
  }
}

// Helper function to parse transaction date
function parseTransactionDate(dateStr: string): string | null {
  if (!dateStr) return null;

  try {
    // Format: "1/6/2025 6:15" or "1/6/2025"
    const parts = dateStr.trim().split(' ');
    const dateParts = parts[0].split('/');

    if (dateParts.length !== 3) return null;

    const day = dateParts[0].padStart(2, '0');
    const month = dateParts[1].padStart(2, '0');
    const year = dateParts[2];

    let time = '00:00:00';
    if (parts.length > 1) {
      time = parts[1] + ':00';
    }

    return `${year}-${month}-${day} ${time}`;
  } catch (error) {
    return null;
  }
}

// PUT - Update bank statement (e.g., opening balance)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only bendahari and admin can update
    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, opening_balance } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Statement ID is required' },
        { status: 400 }
      );
    }

    if (opening_balance === undefined || opening_balance === null) {
      return NextResponse.json(
        { error: 'Baki awal diperlukan' },
        { status: 400 }
      );
    }

    // Check if statement exists
    const [statement] = await pool.query<RowDataPacket[]>(
      'SELECT id, month, year FROM bank_statements WHERE id = ?',
      [id]
    );

    if (statement.length === 0) {
      return NextResponse.json(
        { error: 'Penyata bank tidak dijumpai' },
        { status: 404 }
      );
    }

    // Update opening balance
    await pool.query(
      'UPDATE bank_statements SET opening_balance = ? WHERE id = ?',
      [opening_balance, id]
    );

    return NextResponse.json({
      success: true,
      message: `Baki awal berjaya dikemaskini`,
    });
  } catch (error) {
    console.error('Error updating bank statement:', error);
    return NextResponse.json(
      { error: 'Gagal mengemaskini penyata bank' },
      { status: 500 }
    );
  }
}

// DELETE - Remove bank statement and its transactions
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only bendahari and admin can delete
    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('id');

    if (!statementId) {
      return NextResponse.json(
        { error: 'Statement ID is required' },
        { status: 400 }
      );
    }

    // Check if statement exists
    const [statement] = await pool.query<RowDataPacket[]>(
      'SELECT id, filename, month, year FROM bank_statements WHERE id = ?',
      [statementId]
    );

    if (statement.length === 0) {
      return NextResponse.json(
        { error: 'Penyata bank tidak dijumpai' },
        { status: 404 }
      );
    }

    // Delete transactions first (due to foreign key constraint)
    await pool.query(
      'DELETE FROM financial_transactions WHERE statement_id = ?',
      [statementId]
    );

    // Delete bank statement
    await pool.query(
      'DELETE FROM bank_statements WHERE id = ?',
      [statementId]
    );

    return NextResponse.json({
      success: true,
      message: `Penyata bank ${statement[0].filename} berjaya dipadam`,
    });
  } catch (error) {
    console.error('Error deleting bank statement:', error);
    return NextResponse.json(
      { error: 'Gagal memadam penyata bank' },
      { status: 500 }
    );
  }
}

// Helper function to parse amount
function parseAmount(amountStr: string): number | null {
  if (!amountStr || amountStr.trim() === '') return null;

  const parsed = parseFloat(amountStr.replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
}
