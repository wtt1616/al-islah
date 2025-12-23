import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      transaction_ids,
      transaction_type,
      category_penerimaan,
      sub_category_penerimaan,
      investment_type,
      investment_institution,
      category_pembayaran,
      sub_category1_pembayaran,
      sub_category2_pembayaran,
      notes,
      bulan_perkiraan
    } = body;

    if (!transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      return NextResponse.json({ error: 'Tiada transaksi dipilih' }, { status: 400 });
    }

    if (!transaction_type || !['penerimaan', 'pembayaran'].includes(transaction_type)) {
      return NextResponse.json({ error: 'Jenis transaksi tidak sah' }, { status: 400 });
    }

    if (transaction_type === 'penerimaan' && !category_penerimaan) {
      return NextResponse.json({ error: 'Kategori penerimaan diperlukan' }, { status: 400 });
    }

    if (transaction_type === 'pembayaran' && !category_pembayaran) {
      return NextResponse.json({ error: 'Kategori pembayaran diperlukan' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get the statement_id from the first transaction to update categorized_count later
      const [transactionRows] = await connection.query<RowDataPacket[]>(
        'SELECT DISTINCT statement_id FROM financial_transactions WHERE id IN (?)',
        [transaction_ids]
      );

      const statementIds = transactionRows.map(row => row.statement_id);

      // Build update query based on transaction type
      let updateQuery: string;
      let updateParams: any[];

      if (transaction_type === 'penerimaan') {
        updateQuery = `
          UPDATE financial_transactions
          SET
            transaction_type = 'penerimaan',
            category_penerimaan = ?,
            sub_category_penerimaan = ?,
            investment_type = ?,
            investment_institution = ?,
            category_pembayaran = NULL,
            sub_category1_pembayaran = NULL,
            sub_category2_pembayaran = NULL,
            notes = ?,
            bulan_perkiraan = ?,
            categorized_by = ?,
            categorized_at = NOW()
          WHERE id IN (?)
        `;
        updateParams = [
          category_penerimaan,
          sub_category_penerimaan || null,
          investment_type || null,
          investment_institution || null,
          notes || null,
          bulan_perkiraan || 'bulan_semasa',
          session.user.id,
          transaction_ids
        ];
      } else {
        updateQuery = `
          UPDATE financial_transactions
          SET
            transaction_type = 'pembayaran',
            category_pembayaran = ?,
            sub_category1_pembayaran = ?,
            sub_category2_pembayaran = ?,
            category_penerimaan = NULL,
            sub_category_penerimaan = NULL,
            investment_type = NULL,
            investment_institution = NULL,
            notes = ?,
            bulan_perkiraan = ?,
            categorized_by = ?,
            categorized_at = NOW()
          WHERE id IN (?)
        `;
        updateParams = [
          category_pembayaran,
          sub_category1_pembayaran || null,
          sub_category2_pembayaran || null,
          notes || null,
          bulan_perkiraan || 'bulan_semasa',
          session.user.id,
          transaction_ids
        ];
      }

      const [result] = await connection.query<ResultSetHeader>(updateQuery, updateParams);

      // Update categorized_count for affected statements
      for (const statementId of statementIds) {
        await connection.query(
          `UPDATE bank_statements
           SET categorized_count = (
             SELECT COUNT(*) FROM financial_transactions
             WHERE statement_id = ? AND (category_penerimaan IS NOT NULL OR category_pembayaran IS NOT NULL)
           )
           WHERE id = ?`,
          [statementId, statementId]
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        updated_count: result.affectedRows,
        message: `${result.affectedRows} transaksi telah dikategorikan`
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error: any) {
    console.error('Error bulk categorizing transactions:', error);
    return NextResponse.json(
      { error: 'Gagal mengkategorikan transaksi: ' + error.message },
      { status: 500 }
    );
  }
}
