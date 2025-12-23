// lib/whatsapp.ts - WhatsApp notification utilities using Twilio
// API Documentation: https://www.twilio.com/docs/whatsapp/api

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER; // Format: +60136358066

// Content Template SID for duty reminder (approved by WhatsApp)
const DUTY_REMINDER_TEMPLATE_SID = 'HX0314b4c3aea10424b77eda50cc215608';

// Content Template SID for preacher duty reminder (approved by WhatsApp)
const PREACHER_REMINDER_TEMPLATE_SID = 'HXcbe52067804a6e750154dac561a2992d';

// Delay between messages in milliseconds (10 seconds for Twilio - more lenient than unofficial APIs)
const MESSAGE_DELAY_MS = 10000;

// Track last message sent time for rate limiting
let lastMessageTime = 0;

/**
 * Sleep/delay function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for rate limit before sending next message
 * Ensures at least MESSAGE_DELAY_MS between messages
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastMessage = now - lastMessageTime;

  if (lastMessageTime > 0 && timeSinceLastMessage < MESSAGE_DELAY_MS) {
    const waitTime = MESSAGE_DELAY_MS - timeSinceLastMessage;
    console.log(`[WhatsApp Queue] Waiting ${Math.round(waitTime / 1000)} seconds before next message...`);
    await sleep(waitTime);
  }
}

interface DutyReminder {
  name: string;
  role: 'Imam' | 'Bilal';
  date: string;
  prayerTime: string;
  phone: string;
}

interface TwilioResponse {
  success: boolean;
  sid?: string;
  error?: string;
}

interface TemplateVariables {
  [key: string]: string;
}

/**
 * Format phone number for Malaysia WhatsApp (with +60 prefix)
 */
function formatPhoneNumber(phone: string): string {
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

/**
 * Send WhatsApp message using Twilio API with rate limiting
 */
async function sendTwilioMessage(target: string, message: string): Promise<TwilioResponse> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in environment variables.');
    return { success: false, error: 'Twilio credentials not configured' };
  }

  try {
    // Wait for rate limit before sending
    await waitForRateLimit();

    const formattedTarget = formatPhoneNumber(target);
    const formattedFrom = TWILIO_WHATSAPP_NUMBER.startsWith('+')
      ? TWILIO_WHATSAPP_NUMBER
      : '+' + TWILIO_WHATSAPP_NUMBER;

    console.log(`[WhatsApp] Sending message to ${formattedTarget}...`);

    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    // Create form data
    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${formattedFrom}`);
    formData.append('To', `whatsapp:${formattedTarget}`);
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

    // Update last message time after API call
    lastMessageTime = Date.now();

    if (response.ok && result.sid) {
      console.log(`[WhatsApp] Message sent successfully: ${result.sid}`);
      return { success: true, sid: result.sid };
    } else {
      const errorMessage = result.message || result.error_message || 'Unknown error';
      console.error(`[WhatsApp] Message failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  } catch (error: any) {
    console.error('[WhatsApp] API error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send WhatsApp template message using Twilio Content API
 * Required for sending messages outside 24-hour window
 */
async function sendTwilioTemplateMessage(
  target: string,
  contentSid: string,
  variables: TemplateVariables
): Promise<TwilioResponse> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.error('Twilio credentials not configured.');
    return { success: false, error: 'Twilio credentials not configured' };
  }

  try {
    // Wait for rate limit before sending
    await waitForRateLimit();

    const formattedTarget = formatPhoneNumber(target);
    const formattedFrom = TWILIO_WHATSAPP_NUMBER.startsWith('+')
      ? TWILIO_WHATSAPP_NUMBER
      : '+' + TWILIO_WHATSAPP_NUMBER;

    console.log(`[WhatsApp] Sending template message to ${formattedTarget}...`);

    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    // Create form data with ContentSid and ContentVariables
    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${formattedFrom}`);
    formData.append('To', `whatsapp:${formattedTarget}`);
    formData.append('ContentSid', contentSid);
    formData.append('ContentVariables', JSON.stringify(variables));

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

    // Update last message time after API call
    lastMessageTime = Date.now();

    if (response.ok && result.sid) {
      console.log(`[WhatsApp] Template message sent successfully: ${result.sid}`);
      return { success: true, sid: result.sid };
    } else {
      const errorMessage = result.message || result.error_message || 'Unknown error';
      console.error(`[WhatsApp] Template message failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  } catch (error: any) {
    console.error('[WhatsApp] API error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send WhatsApp reminder to Imam or Bilal about their duty
 * Uses approved WhatsApp template for messages outside 24-hour window
 */
export async function sendDutyReminder(reminder: DutyReminder): Promise<boolean> {
  const phoneNumber = reminder.phone;

  // Format date for template (DD/MM/YYYY format)
  const date = new Date(reminder.date);
  const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  // Template variables matching the approved template:
  // {{1}} = Name, {{2}} = Role (Imam/Bilal), {{3}} = Date, {{4}} = Prayer time
  const templateVariables: TemplateVariables = {
    '1': reminder.name,
    '2': reminder.role,
    '3': formattedDate,
    '4': reminder.prayerTime
  };

  const result = await sendTwilioTemplateMessage(
    phoneNumber,
    DUTY_REMINDER_TEMPLATE_SID,
    templateVariables
  );

  if (result.success) {
    console.log(`WhatsApp reminder sent to ${reminder.name} (${reminder.phone})`);
    return true;
  } else {
    console.error(`Failed to send WhatsApp to ${reminder.name} (${reminder.phone}):`, result.error);
    return false;
  }
}

/**
 * Send batch reminders to multiple people
 * Messages are sent sequentially with delay between each
 */
export async function sendBatchReminders(reminders: DutyReminder[]): Promise<{
  sent: number;
  failed: number;
  results: Array<{ name: string; success: boolean; error?: string }>;
}> {
  const processedResults: Array<{ name: string; success: boolean; error?: string }> = [];

  console.log(`[WhatsApp Queue] Starting batch send of ${reminders.length} messages`);

  // Send messages sequentially (not in parallel) to respect rate limit
  for (let i = 0; i < reminders.length; i++) {
    const reminder = reminders[i];
    console.log(`[WhatsApp Queue] Processing ${i + 1}/${reminders.length}: ${reminder.name}`);

    try {
      const success = await sendDutyReminder(reminder);
      processedResults.push({
        name: reminder.name,
        success
      });
    } catch (error: any) {
      processedResults.push({
        name: reminder.name,
        success: false,
        error: error?.message || 'Unknown error'
      });
    }
  }

  const sent = processedResults.filter(r => r.success).length;
  const failed = processedResults.length - sent;

  console.log(`[WhatsApp Queue] Batch completed - Sent: ${sent}, Failed: ${failed}`);

  return { sent, failed, results: processedResults };
}

/**
 * Preacher reminder data interface
 */
interface PreacherReminder {
  name: string;
  date: string;
  slot: string;
  phone: string;
}

/**
 * Send WhatsApp reminder to Preacher about their ceramah duty
 * Uses approved WhatsApp template for messages outside 24-hour window
 */
export async function sendPreacherReminder(reminder: PreacherReminder): Promise<boolean> {
  const phoneNumber = reminder.phone;

  // Template variables matching the approved template:
  // {{1}} = Name, {{2}} = Date, {{3}} = Slot
  const templateVariables: TemplateVariables = {
    '1': reminder.name,
    '2': reminder.date,
    '3': reminder.slot
  };

  const result = await sendTwilioTemplateMessage(
    phoneNumber,
    PREACHER_REMINDER_TEMPLATE_SID,
    templateVariables
  );

  if (result.success) {
    console.log(`[Preacher] WhatsApp reminder sent to ${reminder.name} (${reminder.phone})`);
    return true;
  } else {
    console.error(`[Preacher] Failed to send WhatsApp to ${reminder.name} (${reminder.phone}):`, result.error);
    return false;
  }
}

/**
 * Test WhatsApp connection by sending a test message
 */
export async function sendTestMessage(phoneNumber: string, name: string): Promise<boolean> {
  const message = `🕌 *Ujian Sistem iSAR*

السلام عليكم ${name},

Ini adalah mesej ujian dari Sistem Jadual Solat iSAR.

Jika anda menerima mesej ini, notifikasi WhatsApp berfungsi dengan baik! ✅

جزاك الله خيرا`;

  const result = await sendTwilioMessage(phoneNumber, message);

  if (result.success) {
    console.log(`Test message sent to ${name}`);
    return true;
  } else {
    console.error(`Failed to send test message:`, result.error);
    return false;
  }
}

/**
 * Send custom WhatsApp message
 */
export async function sendCustomMessage(phoneNumber: string, message: string): Promise<boolean> {
  const result = await sendTwilioMessage(phoneNumber, message);
  return result.success;
}

/**
 * Interface for Permohonan Majlis data
 */
interface PermohonanMajlisData {
  id: number;
  nama_pemohon: string;
  no_kad_pengenalan: string;
  alamat: string;
  no_telefon_rumah?: string;
  no_handphone: string;
  tajuk_majlis: string;
  tarikh_majlis: string;
  hari_majlis: string;
  masa_majlis: string;
  waktu_majlis: string;
  jumlah_jemputan: number;
  peralatan: string[];
  peralatan_lain?: string;
}

const PERALATAN_LABELS: Record<string, string> = {
  'meja_makan': 'Meja Makan',
  'kerusi_makan': 'Kerusi Makan',
  'pa_system': 'PA System',
  'pinggan': 'Pinggan',
  'gelas': 'Gelas',
  'perkhidmatan_katering': 'Perkhidmatan Katering'
};

/**
 * Send WhatsApp confirmation to applicant when permohonan majlis is submitted
 */
export async function sendPermohonanMajlisConfirmation(data: PermohonanMajlisData): Promise<boolean> {
  const phoneNumber = data.no_handphone;

  // Format date nicely
  const date = new Date(data.tarikh_majlis);
  const formattedDate = date.toLocaleDateString('ms-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format peralatan list
  const peralatanList = data.peralatan
    .map(p => PERALATAN_LABELS[p] || p)
    .join(', ');

  const message = `🕌 *SURAU AR-RAUDHAH*
*Permohonan Majlis Diterima*

السلام عليكم ورحمة الله وبركاته

Yth. *${data.nama_pemohon}*,

Permohonan anda untuk mengadakan majlis di Surau Al-Islah telah *BERJAYA DITERIMA* dan sedang diproses.

━━━━━━━━━━━━━━━━━━
📋 *SALINAN PERMOHONAN*
━━━━━━━━━━━━━━━━━━

*No. Rujukan:* PM-${String(data.id).padStart(4, '0')}

👤 *MAKLUMAT PEMOHON*
• Nama: ${data.nama_pemohon}
• No. KP: ${data.no_kad_pengenalan}
• Alamat: ${data.alamat}
• No. HP: ${data.no_handphone}${data.no_telefon_rumah ? `\n• No. Rumah: ${data.no_telefon_rumah}` : ''}

📅 *MAKLUMAT MAJLIS*
• Tajuk: ${data.tajuk_majlis}
• Tarikh: ${formattedDate}
• Hari: ${data.hari_majlis}
• Masa: ${data.masa_majlis}
• Waktu: ${data.waktu_majlis.charAt(0).toUpperCase() + data.waktu_majlis.slice(1)}
• Jemputan: ${data.jumlah_jemputan} orang

🔧 *PERALATAN*
${peralatanList || 'Tiada'}${data.peralatan_lain ? `\n• Lain-lain: ${data.peralatan_lain}` : ''}

━━━━━━━━━━━━━━━━━━

Pihak pengurusan Surau Al-Islah akan menghubungi anda melalui WhatsApp untuk memaklumkan status kelulusan permohonan.

📞 *Sebarang pertanyaan:*
• Pengerusi: 013-645 3396
• Setiausaha: 012-670 9502
• Siak: 012-974 3858

جزاك الله خيرا
_Sistem iSAR - Surau Al-Islah_`;

  const result = await sendTwilioMessage(phoneNumber, message);

  if (result.success) {
    console.log(`[Permohonan Majlis] Confirmation sent to ${data.nama_pemohon} (${data.no_handphone})`);
    return true;
  } else {
    console.error(`[Permohonan Majlis] Failed to send confirmation to ${data.nama_pemohon}:`, result.error);
    return false;
  }
}

/**
 * Send WhatsApp notification when permohonan status is updated
 */
export async function sendPermohonanStatusUpdate(
  data: PermohonanMajlisData,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<boolean> {
  const phoneNumber = data.no_handphone;

  // Format date nicely
  const date = new Date(data.tarikh_majlis);
  const formattedDate = date.toLocaleDateString('ms-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let message: string;

  if (status === 'approved') {
    message = `🕌 *SURAU AR-RAUDHAH*
*Permohonan Majlis DILULUSKAN*

السلام عليكم ورحمة الله وبركاته

Yth. *${data.nama_pemohon}*,

Alhamdulillah, permohonan anda untuk mengadakan majlis di Surau Al-Islah telah *DILULUSKAN* ✅

━━━━━━━━━━━━━━━━━━
📋 *BUTIRAN MAJLIS*
━━━━━━━━━━━━━━━━━━

*No. Rujukan:* PM-${String(data.id).padStart(4, '0')}
*Tajuk:* ${data.tajuk_majlis}
*Tarikh:* ${formattedDate}
*Masa:* ${data.masa_majlis}
*Jemputan:* ${data.jumlah_jemputan} orang

━━━━━━━━━━━━━━━━━━

⚠️ *PERINGATAN PENTING:*
• Sila pastikan kebersihan surau dijaga selepas majlis
• Kemudahan surau perlu dikembalikan ke keadaan asal
• Dilarang merokok di kawasan surau

📞 *Sebarang pertanyaan:*
• Pengerusi: 013-645 3396
• Setiausaha: 012-670 9502

Terima kasih atas kerjasama anda.

جزاك الله خيرا
_Sistem iSAR - Surau Al-Islah_`;
  } else {
    message = `🕌 *SURAU AR-RAUDHAH*
*Permohonan Majlis TIDAK DILULUSKAN*

السلام عليكم ورحمة الله وبركاته

Yth. *${data.nama_pemohon}*,

Dengan hormatnya dimaklumkan bahawa permohonan anda untuk mengadakan majlis di Surau Al-Islah *TIDAK DAPAT DILULUSKAN* ❌

━━━━━━━━━━━━━━━━━━

*No. Rujukan:* PM-${String(data.id).padStart(4, '0')}
*Tajuk:* ${data.tajuk_majlis}
*Tarikh:* ${formattedDate}

*Sebab Penolakan:*
${rejectionReason || 'Tidak dinyatakan'}

━━━━━━━━━━━━━━━━━━

Anda boleh menghubungi pihak pengurusan untuk maklumat lanjut atau membuat permohonan baru pada tarikh lain.

📞 *Pertanyaan:*
• Pengerusi: 013-645 3396
• Setiausaha: 012-670 9502

Mohon maaf atas sebarang kesulitan.

جزاك الله خيرا
_Sistem iSAR - Surau Al-Islah_`;
  }

  const result = await sendTwilioMessage(phoneNumber, message);

  if (result.success) {
    console.log(`[Permohonan Majlis] Status update (${status}) sent to ${data.nama_pemohon}`);
    return true;
  } else {
    console.error(`[Permohonan Majlis] Failed to send status update to ${data.nama_pemohon}:`, result.error);
    return false;
  }
}

/**
 * Send WhatsApp notification for feedback reply
 */
export async function sendFeedbackReplyWhatsApp(
  phoneNumber: string,
  nama: string,
  originalMessage: string,
  adminReply: string
): Promise<boolean> {
  // Truncate original message if too long
  const truncatedOriginal = originalMessage.length > 200
    ? originalMessage.substring(0, 200) + '...'
    : originalMessage;

  const message = `🕌 *SURAU AR-RAUDHAH*
*Jawapan Maklum Balas*

السلام عليكم ورحمة الله وبركاته

Yth. *${nama}*,

Berikut adalah jawapan daripada pihak pengurusan Surau Al-Islah:

━━━━━━━━━━━━━━━━━━
📝 *Maklum Balas Asal:*
${truncatedOriginal}

━━━━━━━━━━━━━━━━━━
💬 *Jawapan Pengurusan:*
${adminReply}
━━━━━━━━━━━━━━━━━━

Sekiranya anda mempunyai sebarang pertanyaan lanjut, sila hantar maklum balas baru.

جزاك الله خيرا
_Sistem iSAR - Surau Al-Islah_`;

  const result = await sendTwilioMessage(phoneNumber, message);

  if (result.success) {
    console.log(`[Feedback Reply] WhatsApp sent to ${nama} (${phoneNumber})`);
    return true;
  } else {
    console.error(`[Feedback Reply] Failed to send WhatsApp to ${nama}:`, result.error);
    return false;
  }
}

/**
 * Send WhatsApp confirmation when feedback is submitted
 */
export async function sendFeedbackConfirmationWhatsApp(
  phoneNumber: string,
  nama: string,
  mesej: string
): Promise<boolean> {
  // Truncate message if too long
  const truncatedMessage = mesej.length > 200
    ? mesej.substring(0, 200) + '...'
    : mesej;

  const message = `🕌 *SURAU AR-RAUDHAH*
*Maklum Balas Diterima*

السلام عليكم ورحمة الله وبركاته

Yth. *${nama}*,

Terima kasih kerana menghantar maklum balas kepada Surau Al-Islah.

━━━━━━━━━━━━━━━━━━
📝 *Maklum Balas Anda:*
${truncatedMessage}
━━━━━━━━━━━━━━━━━━

Maklum balas anda telah diterima dan sedang diproses. Pihak pengurusan akan menghubungi anda melalui WhatsApp atau emel sekiranya terdapat sebarang maklum balas.

جزاك الله خيرا
_Sistem iSAR - Surau Al-Islah_`;

  const result = await sendTwilioMessage(phoneNumber, message);

  if (result.success) {
    console.log(`[Feedback Confirmation] WhatsApp sent to ${nama} (${phoneNumber})`);
    return true;
  } else {
    console.error(`[Feedback Confirmation] Failed to send WhatsApp to ${nama}:`, result.error);
    return false;
  }
}

/**
 * Interface for Khairat Kematian data
 */
interface KhairatAhliData {
  id: number;
  nama: string;
  no_kp: string;
  no_hp: string;
  email?: string;
  jenis_yuran: string;
  no_resit: string;
  amaun_bayaran: number;
  tarikh_daftar: string;
  tanggungan_count: number;
}

/**
 * Send WhatsApp notification when khairat application is approved
 */
export async function sendKhairatApprovalWhatsApp(data: KhairatAhliData): Promise<boolean> {
  const phoneNumber = data.no_hp;

  const jenisYuranLabel = {
    keahlian: 'Yuran Keahlian (Sekali)',
    tahunan: 'Yuran Tahunan',
    isteri_kedua: 'Yuran Keahlian Isteri Kedua'
  }[data.jenis_yuran] || data.jenis_yuran;

  const message = `🕌 *MASJID SAUJANA IMPIAN*
*Khairat Kematian - Keahlian Diluluskan*

السلام عليكم ورحمة الله وبركاته

Yth. *${data.nama}*,

Alhamdulillah, permohonan keahlian Khairat Kematian anda telah *DILULUSKAN* ✅

━━━━━━━━━━━━━━━━━━
📋 *MAKLUMAT KEAHLIAN*
━━━━━━━━━━━━━━━━━━

*No. Ahli:* KK-${String(data.id).padStart(4, '0')}
*Nama:* ${data.nama}
*No. K/P:* ${data.no_kp}
*Jenis Yuran:* ${jenisYuranLabel}
*No. Resit:* ${data.no_resit}
*Amaun:* RM ${parseFloat(String(data.amaun_bayaran)).toFixed(2)}
*Tanggungan:* ${data.tanggungan_count} orang

━━━━━━━━━━━━━━━━━━

⚠️ *PERINGATAN PENTING:*
• Tempoh bertenang: 1 bulan dari tarikh daftar
• Keahlian akan gugur jika tidak aktif selama 2 tahun

Terima kasih atas penyertaan anda.

جزاك الله خيرا
_Biro Khairat Kematian Masjid Saujana Impian_`;

  const result = await sendTwilioMessage(phoneNumber, message);

  if (result.success) {
    console.log(`[Khairat] Approval notification sent to ${data.nama} (${data.no_hp})`);
    return true;
  } else {
    console.error(`[Khairat] Failed to send approval notification to ${data.nama}:`, result.error);
    return false;
  }
}

/**
 * Send WhatsApp notification when khairat application is rejected
 */
export async function sendKhairatRejectionWhatsApp(
  data: KhairatAhliData,
  rejectReason: string
): Promise<boolean> {
  const phoneNumber = data.no_hp;

  const message = `🕌 *MASJID SAUJANA IMPIAN*
*Khairat Kematian - Permohonan Tidak Diluluskan*

السلام عليكم ورحمة الله وبركاته

Yth. *${data.nama}*,

Dengan hormatnya dimaklumkan bahawa permohonan keahlian Khairat Kematian anda *TIDAK DAPAT DILULUSKAN* ❌

━━━━━━━━━━━━━━━━━━

*Nama:* ${data.nama}
*No. K/P:* ${data.no_kp}

*Sebab Penolakan:*
${rejectReason || 'Tidak dinyatakan'}

━━━━━━━━━━━━━━━━━━

Anda boleh menghubungi pihak pengurusan untuk maklumat lanjut atau membuat permohonan baru.

Mohon maaf atas sebarang kesulitan.

جزاك الله خيرا
_Biro Khairat Kematian Masjid Saujana Impian_`;

  const result = await sendTwilioMessage(phoneNumber, message);

  if (result.success) {
    console.log(`[Khairat] Rejection notification sent to ${data.nama} (${data.no_hp})`);
    return true;
  } else {
    console.error(`[Khairat] Failed to send rejection notification to ${data.nama}:`, result.error);
    return false;
  }
}

/**
 * Check if WhatsApp (Twilio) is configured
 */
export function isWhatsAppConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER);
}

/**
 * Get configuration status for debugging
 */
export function getWhatsAppStatus(): { configured: boolean; provider: string } {
  return {
    configured: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER),
    provider: 'Twilio'
  };
}
