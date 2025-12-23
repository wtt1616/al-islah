// app/api/notifications/daily/route.ts
// API endpoint for daily automated notifications via cron job
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { sendBatchReminders, isWhatsAppConfigured } from '@/lib/whatsapp';

// Secret key for cron job authentication - REQUIRED, no fallback for security
const CRON_SECRET = process.env.CRON_SECRET;

// Validate CRON_SECRET is configured
if (!CRON_SECRET) {
  console.error('CRITICAL: CRON_SECRET environment variable is not set');
}

// GET /api/notifications/daily - Send daily reminders (called by cron job)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret from query parameter or header
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get('secret');
    const secretHeader = request.headers.get('x-cron-secret');

    if (secretParam !== CRON_SECRET && secretHeader !== CRON_SECRET) {
      console.log('Unauthorized cron request - invalid secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      console.log('WhatsApp not configured for daily notifications');
      return NextResponse.json({
        error: 'WhatsApp not configured',
        date: new Date().toISOString()
      }, { status: 500 });
    }

    // Get tomorrow's date in Malaysia timezone (UTC+8)
    // Cron runs at 10pm, so we send reminders for tomorrow's schedules
    const now = new Date();
    const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));

    // Add 1 day to get tomorrow's date
    malaysiaTime.setDate(malaysiaTime.getDate() + 1);
    const tomorrow = malaysiaTime.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`[Daily Notification] Running for tomorrow's date: ${tomorrow}`);

    // Fetch tomorrow's schedules with Imam and Bilal details
    const sql = `
      SELECT
        s.id,
        s.date,
        s.prayer_time,
        imam.id as imam_id,
        imam.name as imam_name,
        imam.phone as imam_phone,
        bilal.id as bilal_id,
        bilal.name as bilal_name,
        bilal.phone as bilal_phone
      FROM schedules s
      LEFT JOIN users imam ON s.imam_id = imam.id
      LEFT JOIN users bilal ON s.bilal_id = bilal.id
      WHERE DATE(s.date) = ?
      ORDER BY s.prayer_time
    `;

    const [schedules] = await pool.execute<RowDataPacket[]>(sql, [tomorrow]);

    if (schedules.length === 0) {
      console.log(`[Daily Notification] No schedules found for ${tomorrow}`);
      return NextResponse.json({
        success: true,
        message: 'No schedules found for tomorrow',
        date: tomorrow,
        sent: 0,
        failed: 0
      });
    }

    // Build reminders list (avoid duplicates for same person)
    const sentTo = new Set<string>(); // Track phone numbers already notified
    const reminders = [];

    for (const schedule of schedules) {
      // Add Imam reminder if phone exists and not already sent
      if (schedule.imam_phone && !sentTo.has(schedule.imam_phone)) {
        reminders.push({
          name: schedule.imam_name,
          role: 'Imam' as const,
          date: schedule.date,
          prayerTime: schedule.prayer_time,
          phone: schedule.imam_phone
        });
        sentTo.add(schedule.imam_phone);
      }

      // Add Bilal reminder if phone exists and not already sent
      if (schedule.bilal_phone && !sentTo.has(schedule.bilal_phone)) {
        reminders.push({
          name: schedule.bilal_name,
          role: 'Bilal' as const,
          date: schedule.date,
          prayerTime: schedule.prayer_time,
          phone: schedule.bilal_phone
        });
        sentTo.add(schedule.bilal_phone);
      }
    }

    if (reminders.length === 0) {
      console.log(`[Daily Notification] No phone numbers found for ${tomorrow}`);
      return NextResponse.json({
        success: true,
        message: 'No phone numbers found for tomorrow\'s schedules',
        date: tomorrow,
        schedules: schedules.length,
        sent: 0,
        failed: 0
      });
    }

    // Send batch reminders
    console.log(`[Daily Notification] Sending ${reminders.length} reminder(s)...`);
    const result = await sendBatchReminders(reminders);

    console.log(`[Daily Notification] Completed - Sent: ${result.sent}, Failed: ${result.failed}`);

    return NextResponse.json({
      success: true,
      message: `Reminder notifications sent for tomorrow (${tomorrow})`,
      date: tomorrow,
      schedules: schedules.length,
      sent: result.sent,
      failed: result.failed,
      results: result.results
    });

  } catch (error: any) {
    console.error('[Daily Notification] Error:', error);
    return NextResponse.json({
      error: error.message,
      date: new Date().toISOString()
    }, { status: 500 });
  }
}
