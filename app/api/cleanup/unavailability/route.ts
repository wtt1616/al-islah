// app/api/cleanup/unavailability/route.ts
// API endpoint for weekly cleanup of old unavailability records (called by cron job every Wednesday 9pm)
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Secret key for cron job authentication - REQUIRED, no fallback for security
const CRON_SECRET = process.env.CRON_SECRET;

// Validate CRON_SECRET is configured
if (!CRON_SECRET) {
  console.error('CRITICAL: CRON_SECRET environment variable is not set');
}

// GET /api/cleanup/unavailability - Delete old unavailability records (called by cron job)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret from query parameter or header
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get('secret');
    const secretHeader = request.headers.get('x-cron-secret');

    if (secretParam !== CRON_SECRET && secretHeader !== CRON_SECRET) {
      console.log('[Cleanup Unavailability] Unauthorized request - invalid secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date in Malaysia timezone (UTC+8)
    const now = new Date();
    const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));

    // Calculate cutoff date (9 days ago from today)
    // If today is Wednesday 17 Dec 2025, delete records dated 8 Dec 2025 and earlier
    const cutoffDate = new Date(malaysiaTime);
    cutoffDate.setDate(cutoffDate.getDate() - 9);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`[Cleanup Unavailability] Running cleanup for records dated ${cutoffDateStr} and earlier`);
    console.log(`[Cleanup Unavailability] Current Malaysia time: ${malaysiaTime.toISOString()}`);

    // Delete old unavailability records (is_available = 0)
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM availability
       WHERE is_available = 0
       AND date <= ?`,
      [cutoffDateStr]
    );

    const deletedCount = result.affectedRows;

    console.log(`[Cleanup Unavailability] Deleted ${deletedCount} old unavailability record(s)`);

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      cutoffDate: cutoffDateStr,
      deletedRecords: deletedCount,
      executedAt: malaysiaTime.toISOString()
    });

  } catch (error: any) {
    console.error('[Cleanup Unavailability] Error:', error);
    return NextResponse.json({
      error: error.message,
      date: new Date().toISOString()
    }, { status: 500 });
  }
}
