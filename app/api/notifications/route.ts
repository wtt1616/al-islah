// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { sendDutyReminder, sendBatchReminders, sendTestMessage, isWhatsAppConfigured } from '@/lib/whatsapp';

// POST /api/notifications - Send WhatsApp reminders
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    console.log('User role attempting to send notification:', userRole);

    if (userRole !== 'head_imam' && userRole !== 'admin') {
      console.log('Access denied for role:', userRole);
      return NextResponse.json({
        error: `Forbidden - Only Head Imam or Admin can send notifications. Your role: ${userRole}`
      }, { status: 403 });
    }

    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      return NextResponse.json({ 
        error: 'WhatsApp not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { action, date, scheduleIds, phoneNumber, name } = body;

    // Test message
    if (action === 'test') {
      if (!phoneNumber || !name) {
        return NextResponse.json({ error: 'Phone number and name required for test message' }, { status: 400 });
      }

      const success = await sendTestMessage(phoneNumber, name);
      
      if (success) {
        return NextResponse.json({ 
          message: 'Test message sent successfully!',
          sent: 1,
          failed: 0
        });
      } else {
        return NextResponse.json({ error: 'Failed to send test message' }, { status: 500 });
      }
    }

    // Send reminders for specific schedules
    if (action === 'send_for_schedules' && scheduleIds && scheduleIds.length > 0) {
      const placeholders = scheduleIds.map(() => '?').join(',');
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
        WHERE s.id IN (${placeholders})
      `;

      const [schedules] = await pool.execute<RowDataPacket[]>(sql, scheduleIds);
      
      const reminders = [];
      
      for (const schedule of schedules) {
        // Add Imam reminder if phone exists
        if (schedule.imam_phone) {
          reminders.push({
            name: schedule.imam_name,
            role: 'Imam' as const,
            date: schedule.date,
            prayerTime: schedule.prayer_time,
            phone: schedule.imam_phone
          });
        }
        
        // Add Bilal reminder if phone exists
        if (schedule.bilal_phone) {
          reminders.push({
            name: schedule.bilal_name,
            role: 'Bilal' as const,
            date: schedule.date,
            prayerTime: schedule.prayer_time,
            phone: schedule.bilal_phone
          });
        }
      }

      if (reminders.length === 0) {
        return NextResponse.json({ error: 'No phone numbers found for selected schedules' }, { status: 400 });
      }

      const result = await sendBatchReminders(reminders);
      
      return NextResponse.json({
        message: `Sent ${result.sent} reminder(s) successfully, ${result.failed} failed`,
        sent: result.sent,
        failed: result.failed,
        results: result.results
      });
    }

    // Send reminders for a specific date
    if (action === 'send_for_date' && date) {
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
      `;

      const [schedules] = await pool.execute<RowDataPacket[]>(sql, [date]);
      
      const reminders = [];
      
      for (const schedule of schedules) {
        if (schedule.imam_phone) {
          reminders.push({
            name: schedule.imam_name,
            role: 'Imam' as const,
            date: schedule.date,
            prayerTime: schedule.prayer_time,
            phone: schedule.imam_phone
          });
        }
        
        if (schedule.bilal_phone) {
          reminders.push({
            name: schedule.bilal_name,
            role: 'Bilal' as const,
            date: schedule.date,
            prayerTime: schedule.prayer_time,
            phone: schedule.bilal_phone
          });
        }
      }

      if (reminders.length === 0) {
        return NextResponse.json({ error: 'No schedules or phone numbers found for this date' }, { status: 400 });
      }

      const result = await sendBatchReminders(reminders);
      
      return NextResponse.json({
        message: `Sent ${result.sent} reminder(s) successfully, ${result.failed} failed`,
        sent: result.sent,
        failed: result.failed,
        results: result.results
      });
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });

  } catch (error: any) {
    console.error('Error sending notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/notifications - Check WhatsApp configuration status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configured = isWhatsAppConfigured();
    
    return NextResponse.json({
      configured,
      message: configured 
        ? 'WhatsApp notifications are configured and ready' 
        : 'WhatsApp not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN'
    });

  } catch (error: any) {
    console.error('Error checking configuration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
