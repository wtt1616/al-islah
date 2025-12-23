import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Fetch transactions for a specific statement
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
    const statementId = searchParams.get('statement_id');
    const transactionType = searchParams.get('type'); // penerimaan, pembayaran, uncategorized
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query = `
      SELECT
        ft.*,
        u.name as categorized_by_name
      FROM financial_transactions ft
      LEFT JOIN users u ON ft.categorized_by = u.id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (statementId) {
      conditions.push('ft.statement_id = ?');
      params.push(statementId);
    }

    if (transactionType) {
      conditions.push('ft.transaction_type = ?');
      params.push(transactionType);
    }

    if (month && year) {
      conditions.push('MONTH(ft.transaction_date) = ? AND YEAR(ft.transaction_date) = ?');
      params.push(month, year);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ft.transaction_date DESC, ft.id DESC';

    const [transactions] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// PUT - Update transaction categorization
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only bendahari and admin can categorize
    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      transaction_id,
      transaction_type,
      category_penerimaan,
      sub_category_penerimaan,
      investment_type,
      investment_institution,
      category_pembayaran,
      sub_category1_pembayaran,
      sub_category2_pembayaran,
      notes,
      bulan_perkiraan,
    } = body;

    if (!transaction_id || !transaction_type) {
      return NextResponse.json(
        { error: 'Transaction ID and type are required' },
        { status: 400 }
      );
    }

    // Validate category based on transaction type
    if (transaction_type === 'penerimaan' && !category_penerimaan) {
      return NextResponse.json(
        { error: 'Category penerimaan is required for penerimaan transaction' },
        { status: 400 }
      );
    }

    if (transaction_type === 'pembayaran' && !category_pembayaran) {
      return NextResponse.json(
        { error: 'Category pembayaran is required for pembayaran transaction' },
        { status: 400 }
      );
    }

    // Update transaction
    await pool.query(
      `UPDATE financial_transactions
       SET transaction_type = ?,
           category_penerimaan = ?,
           sub_category_penerimaan = ?,
           investment_type = ?,
           investment_institution = ?,
           category_pembayaran = ?,
           sub_category1_pembayaran = ?,
           sub_category2_pembayaran = ?,
           notes = ?,
           bulan_perkiraan = ?,
           categorized_by = ?,
           categorized_at = NOW()
       WHERE id = ?`,
      [
        transaction_type,
        transaction_type === 'penerimaan' ? category_penerimaan : null,
        transaction_type === 'penerimaan' ? (sub_category_penerimaan || null) : null,
        transaction_type === 'penerimaan' && category_penerimaan === 'Hibah Pelaburan' ? (investment_type || null) : null,
        transaction_type === 'penerimaan' && category_penerimaan === 'Hibah Pelaburan' ? (investment_institution || null) : null,
        transaction_type === 'pembayaran' ? category_pembayaran : null,
        transaction_type === 'pembayaran' ? (sub_category1_pembayaran || null) : null,
        transaction_type === 'pembayaran' ? (sub_category2_pembayaran || null) : null,
        notes || null,
        bulan_perkiraan || 'bulan_semasa',
        session.user.id,
        transaction_id,
      ]
    );

    // Get statement_id for this transaction
    const [transaction] = await pool.query<RowDataPacket[]>(
      'SELECT statement_id FROM financial_transactions WHERE id = ?',
      [transaction_id]
    );

    if (transaction.length > 0) {
      // Update categorized count for the statement
      // Categorized = has category assigned (either penerimaan OR pembayaran category)
      await pool.query(
        `UPDATE bank_statements
         SET categorized_count = (
           SELECT COUNT(*)
           FROM financial_transactions
           WHERE statement_id = ?
           AND (category_penerimaan IS NOT NULL OR category_pembayaran IS NOT NULL)
         )
         WHERE id = ?`,
        [transaction[0].statement_id, transaction[0].statement_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction categorized successfully',
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}
