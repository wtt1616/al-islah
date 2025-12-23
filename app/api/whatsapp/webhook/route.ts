// app/api/whatsapp/webhook/route.ts
// Twilio WhatsApp Webhook - Receive incoming messages and process unavailability requests

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// Prayer times mapping
const PRAYER_TIMES = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
const PRAYER_ALIASES: { [key: string]: string } = {
  'subuh': 'Subuh',
  'zohor': 'Zohor',
  'zuhur': 'Zohor',
  'asar': 'Asar',
  'maghrib': 'Maghrib',
  'isyak': 'Isyak',
  'isya': 'Isyak',
};

// Format phone number to match database format
function normalizePhoneNumber(phone: string): string[] {
  // Remove whatsapp: prefix and any non-digit characters except +
  let number = phone.replace('whatsapp:', '').replace(/[^\d+]/g, '').trim();

  // Generate possible formats to match in database
  const formats: string[] = [];

  // Original format
  formats.push(number);

  // If starts with +60, also check 0 format
  if (number.startsWith('+60')) {
    formats.push('0' + number.substring(3));
    formats.push(number.substring(1)); // without +
  }

  // If starts with 60, also check 0 format
  if (number.startsWith('60') && !number.startsWith('+')) {
    formats.push('0' + number.substring(2));
    formats.push('+' + number);
  }

  // If starts with 0, also check +60 format
  if (number.startsWith('0')) {
    formats.push('+60' + number.substring(1));
    formats.push('60' + number.substring(1));
  }

  return formats;
}

// Parse date from various formats
function parseDate(dateStr: string): Date | null {
  // Try YYYY-MM-DD format
  let match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }

  // Try DD/MM/YYYY format
  match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }

  // Try DD-MM-YYYY format
  match = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }

  return null;
}

// Format date for display
function formatDateMalay(date: Date): string {
  const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Format phone number for Twilio WhatsApp
function formatPhoneForTwilio(phone: string): string {
  let formatted = phone.trim().replace(/[\s\-\(\)]/g, '');

  // Remove whatsapp: prefix if present
  if (formatted.startsWith('whatsapp:')) {
    formatted = formatted.replace('whatsapp:', '');
  }

  // Remove + prefix for processing
  if (formatted.startsWith('+')) {
    formatted = formatted.substring(1);
  }

  // If starts with 0, replace with 60
  if (formatted.startsWith('0')) {
    formatted = '60' + formatted.substring(1);
  }

  // If doesn't start with 60, add it
  if (!formatted.startsWith('60')) {
    formatted = '60' + formatted;
  }

  return '+' + formatted;
}

// Send WhatsApp reply using Twilio
async function sendReply(to: string, message: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.error('Twilio credentials not configured');
    return false;
  }

  try {
    const formattedTo = formatPhoneForTwilio(to);
    const formattedFrom = TWILIO_WHATSAPP_NUMBER.startsWith('+')
      ? TWILIO_WHATSAPP_NUMBER
      : '+' + TWILIO_WHATSAPP_NUMBER;

    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    // Create form data
    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${formattedFrom}`);
    formData.append('To', `whatsapp:${formattedTo}`);
    formData.append('Body', message);

    // Base64 encode credentials
    const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const result = await response.json();

    if (response.ok && result.sid) {
      console.log(`[WhatsApp Webhook] Reply sent successfully to ${to}: ${result.sid}`);
      return true;
    } else {
      console.error(`[WhatsApp Webhook] Reply failed: ${result.message || result.error_message}`);
      return false;
    }
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error sending reply:', error.message);
    return false;
  }
}

// POST - Receive incoming WhatsApp messages from Twilio webhook
export async function POST(request: NextRequest) {
  try {
    // Twilio sends form data (application/x-www-form-urlencoded)
    const formData = await request.formData();

    // Extract Twilio webhook data
    const from = formData.get('From')?.toString() || ''; // Format: whatsapp:+60123456789
    const body = (formData.get('Body')?.toString() || '').trim();
    const profileName = formData.get('ProfileName')?.toString() || '';
    const messageSid = formData.get('MessageSid')?.toString() || '';

    console.log(`[WhatsApp Webhook] Received message from ${from} (${profileName}): "${body}" [SID: ${messageSid}]`);

    if (!from || !body) {
      // Return TwiML empty response
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Find user by phone number
    const phoneFormats = normalizePhoneNumber(from);
    const placeholders = phoneFormats.map(() => '?').join(' OR phone = ');

    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, role, phone FROM users WHERE phone = ${placeholders} AND is_active = 1`,
      phoneFormats
    );

    if (users.length === 0) {
      console.log(`[WhatsApp Webhook] User not found for phone: ${from}`);
      await sendReply(from, `❌ Maaf, nombor telefon anda tidak berdaftar dalam sistem iSAR.

Sila hubungi Head Imam untuk mendaftarkan nombor telefon anda.`);
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    const user = users[0];
    console.log(`[WhatsApp Webhook] User identified: ${user.name} (ID: ${user.id}, Role: ${user.role})`);

    // Check if user is imam or bilal
    if (!['imam', 'bilal'].includes(user.role)) {
      await sendReply(from, `❌ Maaf, fungsi ini hanya untuk Imam dan Bilal sahaja.`);
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Parse message
    const upperBody = body.toUpperCase();

    // Check for TUGAS/DUTY command - show upcoming duties
    if (upperBody === 'TUGAS' || upperBody === 'DUTY' || upperBody === 'JADUAL') {
      const today = new Date().toISOString().split('T')[0];

      // Get upcoming duties for this user
      const [duties] = await pool.query<RowDataPacket[]>(
        `SELECT date,
                CASE
                  WHEN imam_subuh_id = ? THEN 'Imam Subuh'
                  WHEN imam_zohor_id = ? THEN 'Imam Zohor'
                  WHEN imam_asar_id = ? THEN 'Imam Asar'
                  WHEN imam_maghrib_id = ? THEN 'Imam Maghrib'
                  WHEN imam_isyak_id = ? THEN 'Imam Isyak'
                  WHEN bilal_subuh_id = ? THEN 'Bilal Subuh'
                  WHEN bilal_zohor_id = ? THEN 'Bilal Zohor'
                  WHEN bilal_asar_id = ? THEN 'Bilal Asar'
                  WHEN bilal_maghrib_id = ? THEN 'Bilal Maghrib'
                  WHEN bilal_isyak_id = ? THEN 'Bilal Isyak'
                END as duty
         FROM schedules
         WHERE date >= ?
           AND (imam_subuh_id = ? OR imam_zohor_id = ? OR imam_asar_id = ? OR imam_maghrib_id = ? OR imam_isyak_id = ?
                OR bilal_subuh_id = ? OR bilal_zohor_id = ? OR bilal_asar_id = ? OR bilal_maghrib_id = ? OR bilal_isyak_id = ?)
         ORDER BY date ASC
         LIMIT 14`,
        [user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id,
         today, user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id]
      );

      if (duties.length === 0) {
        await sendReply(from, `📋 *Jadual Tugas Anda*

Tiada tugas yang dijadualkan untuk 2 minggu akan datang.

💡 Hubungi Head Imam untuk maklumat lanjut.`);
      } else {
        let dutyMessage = `📋 *Jadual Tugas Anda*\n\n`;

        let currentDate = '';
        for (const duty of duties) {
          const dutyDate = new Date(duty.date);
          const dateStr = formatDateMalay(dutyDate);

          if (dateStr !== currentDate) {
            if (currentDate) dutyMessage += '\n';
            dutyMessage += `📅 *${dateStr}*\n`;
            currentDate = dateStr;
          }
          dutyMessage += `   • ${duty.duty}\n`;
        }

        dutyMessage += `\n💡 Untuk rekod cuti, hantar:
CUTI [tarikh] [waktu solat]`;

        await sendReply(from, dutyMessage);
      }

      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Check for CUTI/TIDAK HADIR command
    if (upperBody.startsWith('CUTI') || upperBody.startsWith('TIDAK HADIR') || upperBody.startsWith('TIDAKHADIR')) {
      const parts = body.split(/\s+/).filter((p: string) => p.length > 0);

      if (parts.length < 2) {
        await sendReply(from, `❌ Format tidak betul.

📝 *Format yang betul:*
CUTI [tarikh] [waktu solat]

📅 *Contoh:*
• CUTI 2024-12-01 Subuh
• CUTI 01/12/2024 Maghrib
• CUTI 2024-12-01 semua

💡 *Waktu solat:* Subuh, Zohor, Asar, Maghrib, Isyak
💡 *Guna "semua"* untuk semua waktu solat`);
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }

      // Find date in the message
      let dateStr = '';
      let prayerStr = '';

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (part.match(/^\d{4}-\d{1,2}-\d{1,2}$/) || part.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/)) {
          dateStr = part;
        } else if (part.toLowerCase() !== 'cuti' && part.toLowerCase() !== 'tidak' && part.toLowerCase() !== 'hadir') {
          prayerStr = part;
        }
      }

      if (!dateStr) {
        await sendReply(from, `❌ Tarikh tidak dijumpai dalam mesej.

📝 *Format yang betul:*
CUTI [tarikh] [waktu solat]

📅 *Format tarikh:*
• 2024-12-01
• 01/12/2024
• 01-12-2024`);
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }

      const date = parseDate(dateStr);
      if (!date || isNaN(date.getTime())) {
        await sendReply(from, `❌ Format tarikh tidak sah: ${dateStr}

📅 *Format tarikh yang diterima:*
• 2024-12-01
• 01/12/2024
• 01-12-2024`);
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }

      // Determine prayer times to mark as unavailable
      let prayerTimes: string[] = [];

      if (!prayerStr || prayerStr.toLowerCase() === 'semua' || prayerStr.toLowerCase() === 'all') {
        prayerTimes = [...PRAYER_TIMES];
      } else {
        const normalizedPrayer = PRAYER_ALIASES[prayerStr.toLowerCase()];
        if (normalizedPrayer) {
          prayerTimes = [normalizedPrayer];
        } else if (PRAYER_TIMES.includes(prayerStr)) {
          prayerTimes = [prayerStr];
        } else {
          await sendReply(from, `❌ Waktu solat tidak sah: ${prayerStr}

💡 *Waktu solat yang diterima:*
Subuh, Zohor, Asar, Maghrib, Isyak

💡 *Atau guna "semua"* untuk semua waktu solat`);
          return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            { headers: { 'Content-Type': 'text/xml' } }
          );
        }
      }

      // Format date for database (YYYY-MM-DD)
      const dbDate = date.toISOString().split('T')[0];

      // Insert unavailability records
      const insertedTimes: string[] = [];

      for (const prayerTime of prayerTimes) {
        try {
          // Check if already exists
          const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM availability WHERE user_id = ? AND date = ? AND prayer_time = ?',
            [user.id, dbDate, prayerTime]
          );

          if (existing.length > 0) {
            // Update existing record
            await pool.execute(
              'UPDATE availability SET is_available = 0, reason = ? WHERE user_id = ? AND date = ? AND prayer_time = ?',
              ['Melalui WhatsApp', user.id, dbDate, prayerTime]
            );
            insertedTimes.push(prayerTime);
          } else {
            // Insert new record
            await pool.execute(
              'INSERT INTO availability (user_id, date, prayer_time, is_available, reason) VALUES (?, ?, ?, 0, ?)',
              [user.id, dbDate, prayerTime, 'Melalui WhatsApp']
            );
            insertedTimes.push(prayerTime);
          }
        } catch (error: any) {
          console.error(`Error inserting unavailability for ${prayerTime}:`, error.message);
        }
      }

      // Send confirmation
      if (insertedTimes.length > 0) {
        const confirmMessage = `✅ *Cuti Berjaya Direkodkan*

👤 *Nama:* ${user.name}
📅 *Tarikh:* ${formatDateMalay(date)}
🕌 *Waktu:* ${insertedTimes.join(', ')}

Head Imam telah dimaklumkan.

_Terima kasih kerana memberitahu lebih awal._`;

        await sendReply(from, confirmMessage);
        console.log(`[WhatsApp Webhook] Unavailability recorded for ${user.name}: ${dbDate} - ${insertedTimes.join(', ')}`);
      } else {
        await sendReply(from, `❌ Gagal merekodkan cuti. Sila cuba lagi atau hubungi Head Imam.`);
      }

      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Check for SENARAI/LIST command
    if (upperBody.startsWith('SENARAI') || upperBody.startsWith('LIST') || upperBody === 'STATUS') {
      const today = new Date().toISOString().split('T')[0];

      const [records] = await pool.query<RowDataPacket[]>(
        `SELECT date, prayer_time FROM availability
         WHERE user_id = ? AND date >= ? AND is_available = 0
         ORDER BY date ASC, FIELD(prayer_time, 'Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak')
         LIMIT 20`,
        [user.id, today]
      );

      if (records.length === 0) {
        await sendReply(from, `📋 *Senarai Cuti Anda*

Tiada rekod cuti yang akan datang.

💡 Untuk rekod cuti baru, hantar:
CUTI [tarikh] [waktu solat]`);
      } else {
        let listMessage = `📋 *Senarai Cuti Anda*\n\n`;

        let currentDate = '';
        for (const record of records) {
          const recordDate = new Date(record.date);
          const dateStr = formatDateMalay(recordDate);

          if (dateStr !== currentDate) {
            if (currentDate) listMessage += '\n';
            listMessage += `📅 *${dateStr}*\n`;
            currentDate = dateStr;
          }
          listMessage += `   • ${record.prayer_time}\n`;
        }

        listMessage += `\n💡 Untuk rekod cuti baru, hantar:
CUTI [tarikh] [waktu solat]`;

        await sendReply(from, listMessage);
      }

      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Check for BATAL/CANCEL command
    if (upperBody.startsWith('BATAL') || upperBody.startsWith('CANCEL')) {
      const parts = body.split(/\s+/).filter((p: string) => p.length > 0);

      if (parts.length < 2) {
        await sendReply(from, `❌ Format tidak betul.

📝 *Format yang betul:*
BATAL [tarikh] [waktu solat]

📅 *Contoh:*
• BATAL 2024-12-01 Subuh
• BATAL 2024-12-01 semua`);
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }

      // Find date in the message
      let dateStr = '';
      let prayerStr = '';

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (part.match(/^\d{4}-\d{1,2}-\d{1,2}$/) || part.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/)) {
          dateStr = part;
        } else if (part.toLowerCase() !== 'batal' && part.toLowerCase() !== 'cancel') {
          prayerStr = part;
        }
      }

      if (!dateStr) {
        await sendReply(from, `❌ Tarikh tidak dijumpai dalam mesej.`);
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }

      const date = parseDate(dateStr);
      if (!date || isNaN(date.getTime())) {
        await sendReply(from, `❌ Format tarikh tidak sah: ${dateStr}`);
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }

      const dbDate = date.toISOString().split('T')[0];

      // Determine prayer times to cancel
      let prayerTimes: string[] = [];

      if (!prayerStr || prayerStr.toLowerCase() === 'semua' || prayerStr.toLowerCase() === 'all') {
        prayerTimes = [...PRAYER_TIMES];
      } else {
        const normalizedPrayer = PRAYER_ALIASES[prayerStr.toLowerCase()];
        if (normalizedPrayer) {
          prayerTimes = [normalizedPrayer];
        } else if (PRAYER_TIMES.includes(prayerStr)) {
          prayerTimes = [prayerStr];
        } else {
          await sendReply(from, `❌ Waktu solat tidak sah: ${prayerStr}`);
          return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            { headers: { 'Content-Type': 'text/xml' } }
          );
        }
      }

      // Delete unavailability records
      const cancelledTimes: string[] = [];

      for (const prayerTime of prayerTimes) {
        try {
          const [result] = await pool.execute(
            'DELETE FROM availability WHERE user_id = ? AND date = ? AND prayer_time = ? AND is_available = 0',
            [user.id, dbDate, prayerTime]
          );

          if ((result as any).affectedRows > 0) {
            cancelledTimes.push(prayerTime);
          }
        } catch (error: any) {
          console.error(`Error cancelling unavailability for ${prayerTime}:`, error.message);
        }
      }

      if (cancelledTimes.length > 0) {
        await sendReply(from, `✅ *Cuti Berjaya Dibatalkan*

📅 *Tarikh:* ${formatDateMalay(date)}
🕌 *Waktu:* ${cancelledTimes.join(', ')}

Anda kini tersedia untuk bertugas.`);
      } else {
        await sendReply(from, `ℹ️ Tiada rekod cuti ditemui untuk tarikh dan waktu tersebut.`);
      }

      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Default help message
    await sendReply(from, `🕌 *iSAR WhatsApp Bot*

Assalamualaikum ${user.name}! 👋

📝 *Arahan yang tersedia:*

1️⃣ *Lihat Tugas:*
   TUGAS

2️⃣ *Rekod Cuti:*
   CUTI [tarikh] [waktu]
   Contoh: CUTI 2024-12-01 Subuh

3️⃣ *Batal Cuti:*
   BATAL [tarikh] [waktu]
   Contoh: BATAL 2024-12-01 Subuh

4️⃣ *Senarai Cuti:*
   SENARAI

💡 *Waktu solat:* Subuh, Zohor, Asar, Maghrib, Isyak
💡 *Guna "semua"* untuk semua waktu

📅 *Format tarikh:*
   • 2024-12-01
   • 01/12/2024`);

    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    );

  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error:', error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }
}

// GET - Verify webhook (for testing)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    provider: 'Twilio',
    message: 'iSAR WhatsApp Webhook is active',
    commands: [
      'TUGAS - Lihat jadual tugas',
      'CUTI [tarikh] [waktu] - Rekod cuti',
      'BATAL [tarikh] [waktu] - Batal cuti',
      'SENARAI - Lihat senarai cuti',
    ]
  });
}
