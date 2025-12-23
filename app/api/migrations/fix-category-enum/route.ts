import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Run migration to fix category_pembayaran ENUM to VARCHAR
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only admin can run migrations
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    // Run the migration
    await pool.query(`
      ALTER TABLE financial_transactions
      MODIFY COLUMN category_pembayaran VARCHAR(255) DEFAULT NULL
    `);

    return NextResponse.json({
      success: true,
      message: 'Migration completed: category_pembayaran changed from ENUM to VARCHAR(255)'
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error.message
    }, { status: 500 });
  }
}

// GET - Check current column type
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const [columns] = await pool.query(`
      SHOW COLUMNS FROM financial_transactions WHERE Field = 'category_pembayaran'
    `);

    return NextResponse.json({
      column_info: columns
    });
  } catch (error: any) {
    console.error('Error checking column:', error);
    return NextResponse.json({
      error: 'Failed to check column',
      details: error.message
    }, { status: 500 });
  }
}
