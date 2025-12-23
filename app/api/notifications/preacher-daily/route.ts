// app/api/notifications/preacher-daily/route.ts
// API endpoint for daily automated notifications to preachers via cron job
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { sendPreacherReminder, isWhatsAppConfigured } from '@/lib/whatsapp';

// Secret key for cron job authentication - REQUIRED, no fallback for security
const CRON_SECRET = process.env.CRON_SECRET;

// Validate CRON_SECRET is configured
if (!CRON_SECRET) {
  console.error('CRITICAL: CRON_SECRET environment variable is not set');
}

interface PreacherSchedule {
  schedule_date: string;
  subuh_preacher_id: number | null;
  subuh_preacher_name: string | null;
  subuh_preacher_phone: string | null;
  dhuha_preacher_id: number | null;
  dhuha_preacher_name: string | null;
  dhuha_preacher_phone: string | null;
  maghrib_preacher_id: number | null;
  maghrib_preacher_name: string | null;
  maghrib_preacher_phone: string | null;
  friday_preacher_id: number | null;
  friday_preacher_name: string | null;
  friday_preacher_phone: string | null;
  friday_dhuha_preacher_id: number | null;
  friday_dhuha_preacher_name: string | null;
  friday_dhuha_preacher_phone: string | null;
}

// Format date for display in Malay
function formatDateMalay(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Sleep function for rate limiting
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// GET /api/notifications/preacher-daily - Send daily reminders to preachers (called by cron job)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret from query parameter or header
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get('secret');
    const secretHeader = request.headers.get('x-cron-secret');

    if (secretParam !== CRON_SECRET && secretHeader !== CRON_SECRET) {
      console.log('[Preacher Notification] Unauthorized cron request - invalid secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      console.log('[Preacher Notification] WhatsApp not configured');
      return NextResponse.json({
        error: 'WhatsApp not configured',
        date: new Date().toISOString()
      }, { status: 500 });
    }

    // Get tomorrow's date in Malaysia timezone (UTC+8)
    const now = new Date();
    const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));

    // Add 1 day to get tomorrow's date
    malaysiaTime.setDate(malaysiaTime.getDate() + 1);
    const tomorrow = malaysiaTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    const tomorrowDate = new Date(tomorrow);
    const dayOfWeek = tomorrowDate.getDay(); // 0=Sunday, 5=Friday

    console.log(`[Preacher Notification] Running for tomorrow's date: ${tomorrow} (Day: ${dayOfWeek})`);

    // Fetch tomorrow's preacher schedule
    const sql = `
      SELECT
        ps.schedule_date,
        ps.subuh_preacher_id,
        subuh.name as subuh_preacher_name,
        subuh.phone as subuh_preacher_phone,
        ps.dhuha_preacher_id,
        dhuha.name as dhuha_preacher_name,
        dhuha.phone as dhuha_preacher_phone,
        ps.maghrib_preacher_id,
        maghrib.name as maghrib_preacher_name,
        maghrib.phone as maghrib_preacher_phone,
        ps.friday_preacher_id,
        friday.name as friday_preacher_name,
        friday.phone as friday_preacher_phone,
        ps.friday_dhuha_preacher_id,
        friday_dhuha.name as friday_dhuha_preacher_name,
        friday_dhuha.phone as friday_dhuha_preacher_phone
      FROM preacher_schedules ps
      LEFT JOIN preachers subuh ON ps.subuh_preacher_id = subuh.id
      LEFT JOIN preachers dhuha ON ps.dhuha_preacher_id = dhuha.id
      LEFT JOIN preachers maghrib ON ps.maghrib_preacher_id = maghrib.id
      LEFT JOIN preachers friday ON ps.friday_preacher_id = friday.id
      LEFT JOIN preachers friday_dhuha ON ps.friday_dhuha_preacher_id = friday_dhuha.id
      WHERE ps.schedule_date = ?
    `;

    const [schedules] = await pool.execute<(PreacherSchedule & RowDataPacket)[]>(sql, [tomorrow]);

    if (schedules.length === 0) {
      console.log(`[Preacher Notification] No preacher schedules found for ${tomorrow}`);
      return NextResponse.json({
        success: true,
        message: 'No preacher schedules found for tomorrow',
        date: tomorrow,
        sent: 0,
        failed: 0
      });
    }

    const schedule = schedules[0];
    const formattedDate = formatDateMalay(tomorrow);

    // Build reminders list based on day of week
    interface PreacherReminder {
      name: string;
      phone: string;
      slot: string;
    }

    const reminders: PreacherReminder[] = [];
    const sentTo = new Set<string>(); // Track phone numbers to avoid duplicates

    // Monday (1) and Thursday (4) - No preaching
    if (dayOfWeek === 1 || dayOfWeek === 4) {
      console.log(`[Preacher Notification] No preaching on ${dayOfWeek === 1 ? 'Monday' : 'Thursday'}`);
      return NextResponse.json({
        success: true,
        message: `No preaching scheduled for ${dayOfWeek === 1 ? 'Monday' : 'Thursday'}`,
        date: tomorrow,
        sent: 0,
        failed: 0
      });
    }

    // Friday (5) - Kuliah Dhuha and Tazkirah Jumaat only
    if (dayOfWeek === 5) {
      if (schedule.friday_dhuha_preacher_phone && !sentTo.has(schedule.friday_dhuha_preacher_phone)) {
        reminders.push({
          name: schedule.friday_dhuha_preacher_name!,
          phone: schedule.friday_dhuha_preacher_phone,
          slot: 'Kuliah Dhuha'
        });
        sentTo.add(schedule.friday_dhuha_preacher_phone);
      }
      if (schedule.friday_preacher_phone && !sentTo.has(schedule.friday_preacher_phone)) {
        reminders.push({
          name: schedule.friday_preacher_name!,
          phone: schedule.friday_preacher_phone,
          slot: 'Tazkirah Jumaat'
        });
        sentTo.add(schedule.friday_preacher_phone);
      }
    } else {
      // Other days - Kuliah Subuh and Kuliah Maghrib
      // Weekend (Saturday=6, Sunday=0) also has Dhuha

      if (schedule.subuh_preacher_phone && !sentTo.has(schedule.subuh_preacher_phone)) {
        reminders.push({
          name: schedule.subuh_preacher_name!,
          phone: schedule.subuh_preacher_phone,
          slot: 'Kuliah Subuh'
        });
        sentTo.add(schedule.subuh_preacher_phone);
      }

      // Dhuha only on weekends
      if ((dayOfWeek === 0 || dayOfWeek === 6) && schedule.dhuha_preacher_phone && !sentTo.has(schedule.dhuha_preacher_phone)) {
        reminders.push({
          name: schedule.dhuha_preacher_name!,
          phone: schedule.dhuha_preacher_phone,
          slot: 'Kuliah Dhuha'
        });
        sentTo.add(schedule.dhuha_preacher_phone);
      }

      if (schedule.maghrib_preacher_phone && !sentTo.has(schedule.maghrib_preacher_phone)) {
        reminders.push({
          name: schedule.maghrib_preacher_name!,
          phone: schedule.maghrib_preacher_phone,
          slot: 'Kuliah Maghrib'
        });
        sentTo.add(schedule.maghrib_preacher_phone);
      }
    }

    if (reminders.length === 0) {
      console.log(`[Preacher Notification] No preachers with phone numbers found for ${tomorrow}`);
      return NextResponse.json({
        success: true,
        message: 'No preachers with phone numbers found for tomorrow',
        date: tomorrow,
        sent: 0,
        failed: 0
      });
    }

    // Send reminders using template
    console.log(`[Preacher Notification] Sending ${reminders.length} reminder(s) using template...`);

    let sent = 0;
    let failed = 0;
    const results: Array<{ name: string; slot: string; success: boolean; error?: string }> = [];

    for (const reminder of reminders) {
      try {
        const success = await sendPreacherReminder({
          name: reminder.name,
          date: formattedDate,
          slot: reminder.slot,
          phone: reminder.phone
        });

        if (success) {
          sent++;
          results.push({ name: reminder.name, slot: reminder.slot, success: true });
          console.log(`[Preacher Notification] Sent to ${reminder.name} (${reminder.slot})`);
        } else {
          failed++;
          results.push({ name: reminder.name, slot: reminder.slot, success: false, error: 'Failed to send' });
          console.log(`[Preacher Notification] Failed to send to ${reminder.name}`);
        }
      } catch (error: any) {
        failed++;
        results.push({ name: reminder.name, slot: reminder.slot, success: false, error: error.message });
        console.error(`[Preacher Notification] Error sending to ${reminder.name}:`, error.message);
      }

      // Rate limiting - wait 10 seconds between messages
      if (reminders.indexOf(reminder) < reminders.length - 1) {
        await sleep(10000);
      }
    }

    console.log(`[Preacher Notification] Completed - Sent: ${sent}, Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      message: `Preacher reminder notifications sent for tomorrow (${tomorrow})`,
      date: tomorrow,
      dayOfWeek,
      sent,
      failed,
      results
    });

  } catch (error: any) {
    console.error('[Preacher Notification] Error:', error);
    return NextResponse.json({
      error: error.message,
      date: new Date().toISOString()
    }, { status: 500 });
  }
}
