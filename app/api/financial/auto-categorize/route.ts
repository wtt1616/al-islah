import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { PenerimaanCategory, PembayaranCategory } from '@/types';

interface KeywordRow extends RowDataPacket {
  id: number;
  jenis_transaksi: 'penerimaan' | 'pembayaran';
  kategori_nama: string;
  keyword: string;
  aktif: boolean;
}

interface TransactionRow extends RowDataPacket {
  id: number;
  customer_eft_no: string | null;
  payment_details: string | null;
  credit_amount: number | null;
  debit_amount: number | null;
  category_penerimaan: string | null;
  category_pembayaran: string | null;
}

// POST - Auto-categorize transactions based on keywords
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only bendahari, admin, and head_imam can auto-categorize
    if (!['bendahari', 'admin', 'head_imam'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { statement_id, transaction_ids, preview = false } = body;

    if (!statement_id) {
      return NextResponse.json(
        { error: 'Missing statement_id' },
        { status: 400 }
      );
    }

    // Fetch active keywords
    const [keywords] = await pool.query<KeywordRow[]>(
      'SELECT * FROM rujukan_kategori WHERE aktif = TRUE ORDER BY LENGTH(keyword) DESC'
    );

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: 'No active keywords found' },
        { status: 400 }
      );
    }

    // Fetch transactions to categorize
    let transactionQuery = 'SELECT * FROM financial_transactions WHERE statement_id = ?';
    const queryParams: any[] = [statement_id];

    if (transaction_ids && Array.isArray(transaction_ids) && transaction_ids.length > 0) {
      transactionQuery += ' AND id IN (?)';
      queryParams.push(transaction_ids);
    }

    const [transactions] = await pool.query<TransactionRow[]>(
      transactionQuery,
      queryParams
    );

    const updates: Array<{
      id: number;
      category_penerimaan: PenerimaanCategory | null;
      category_pembayaran: PembayaranCategory | null;
      matched_keyword: string | null;
      search_text: string;
    }> = [];

    // Process each transaction
    for (const transaction of transactions) {
      // Concatenate customer_eft_no and payment_details for searching
      const searchText = `${transaction.customer_eft_no || ''} ${transaction.payment_details || ''}`.toLowerCase();

      // Determine transaction type
      const isPenerimaan = transaction.credit_amount && transaction.credit_amount > 0;
      const isPembayaran = transaction.debit_amount && transaction.debit_amount > 0;

      let matchedKeyword: string | null = null;
      let categoryPenerimaan: PenerimaanCategory | null = null;
      let categoryPembayaran: PembayaranCategory | null = null;

      // Try to match keywords (sorted by length DESC for most specific match first)
      for (const keyword of keywords) {
        const keywordLower = keyword.keyword.toLowerCase();

        if (searchText.includes(keywordLower)) {
          // Match found!
          if (isPenerimaan && keyword.jenis_transaksi === 'penerimaan') {
            matchedKeyword = keyword.keyword;
            categoryPenerimaan = keyword.kategori_nama as PenerimaanCategory;
            break;
          } else if (isPembayaran && keyword.jenis_transaksi === 'pembayaran') {
            matchedKeyword = keyword.keyword;
            categoryPembayaran = keyword.kategori_nama as PembayaranCategory;
            break;
          }
        }
      }

      // Only update if a match was found and the transaction is not already categorized
      if (matchedKeyword) {
        // Skip if already has a category (unless user wants to override - future feature)
        if (categoryPenerimaan && !transaction.category_penerimaan) {
          updates.push({
            id: transaction.id,
            category_penerimaan: categoryPenerimaan,
            category_pembayaran: null,
            matched_keyword: matchedKeyword,
            search_text: searchText
          });
        } else if (categoryPembayaran && !transaction.category_pembayaran) {
          updates.push({
            id: transaction.id,
            category_penerimaan: null,
            category_pembayaran: categoryPembayaran,
            matched_keyword: matchedKeyword,
            search_text: searchText
          });
        }
      } else {
        // Business Rule 1: If no keyword match AND special conditions met
        // Categorize as "Sumbangan Am" if:
        // 1. customer_eft_no is NULL
        // 2. payment_details is NOT NULL
        // 3. payment_details contains a positive number
        // 4. Transaction is penerimaan (has credit_amount)
        if (
          isPenerimaan &&
          !transaction.category_penerimaan &&
          !transaction.customer_eft_no &&
          transaction.payment_details
        ) {
          // Try to extract number from payment_details
          const numericValue = parseFloat(transaction.payment_details.replace(/[^0-9.-]/g, ''));

          if (!isNaN(numericValue) && numericValue > 0) {
            updates.push({
              id: transaction.id,
              category_penerimaan: 'Sumbangan Am',
              category_pembayaran: null,
              matched_keyword: 'RULE: Sumbangan Am (payment_details > 0)',
              search_text: searchText
            });
          }
        }

        // Business Rule 2: Sumbangan Am for Fund Transfer/Transfer with no payment_details
        // Categorize as "Sumbangan Am" if:
        // 1. customer_eft_no contains: "Fund Transfer", "Transfer", "Surau Ar-Raudhah", or "SAR"
        // 2. payment_details is NULL or empty
        // 3. Transaction is penerimaan (has credit_amount)
        const customerEftNo = (transaction.customer_eft_no || '').toLowerCase();
        const hasTransferKeyword =
          customerEftNo.includes('fund transfer') ||
          customerEftNo.includes('transfer') ||
          customerEftNo.includes('surau ar-raudhah') ||
          customerEftNo.includes('sar');
        const paymentDetailsEmpty = !transaction.payment_details || transaction.payment_details.trim() === '';

        if (
          isPenerimaan &&
          !transaction.category_penerimaan &&
          hasTransferKeyword &&
          paymentDetailsEmpty
        ) {
          updates.push({
            id: transaction.id,
            category_penerimaan: 'Sumbangan Am',
            category_pembayaran: null,
            matched_keyword: 'RULE: Sumbangan Am (Transfer tanpa payment_details)',
            search_text: searchText
          });
        }
      }
    }

    // If preview mode, just return the matches without updating
    if (preview) {
      return NextResponse.json({
        preview: true,
        total_transactions: transactions.length,
        matches_found: updates.length,
        updates: updates
      });
    }

    // Apply updates
    let updatedCount = 0;
    for (const update of updates) {
      if (update.category_penerimaan) {
        const [result] = await pool.query<ResultSetHeader>(
          `UPDATE financial_transactions
           SET category_penerimaan = ?,
               transaction_type = 'penerimaan',
               categorized_by = ?,
               categorized_at = NOW()
           WHERE id = ?`,
          [update.category_penerimaan, session.user.id, update.id]
        );
        if (result.affectedRows > 0) updatedCount++;
      } else if (update.category_pembayaran) {
        const [result] = await pool.query<ResultSetHeader>(
          `UPDATE financial_transactions
           SET category_pembayaran = ?,
               transaction_type = 'pembayaran',
               categorized_by = ?,
               categorized_at = NOW()
           WHERE id = ?`,
          [update.category_pembayaran, session.user.id, update.id]
        );
        if (result.affectedRows > 0) updatedCount++;
      }
    }

    return NextResponse.json({
      message: 'Auto-categorization completed',
      total_transactions: transactions.length,
      matches_found: updates.length,
      updated_count: updatedCount
    });

  } catch (error) {
    console.error('Error in auto-categorization:', error);
    return NextResponse.json(
      { error: 'Failed to auto-categorize transactions' },
      { status: 500 }
    );
  }
}
