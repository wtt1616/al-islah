// lib/email.ts - Email notification utilities using Nodemailer

import nodemailer from 'nodemailer';

// SMTP configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'Surau Al-Islah <noreply@surau-arraudhah.com>';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send email using Nodemailer
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASS in environment variables.');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error('Email sending failed:', error.message);
    return false;
  }
}

/**
 * Send feedback confirmation email to sender
 */
export async function sendFeedbackConfirmation(
  to: string,
  nama: string,
  mesej: string
): Promise<boolean> {
  const subject = 'Maklum Balas Anda Telah Diterima - Surau Al-Islah';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #198754; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background-color: #343a40; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .message-box { background-color: white; padding: 15px; border-left: 4px solid #198754; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Surau Al-Islah</h2>
          <p>Maklum Balas Diterima</p>
        </div>
        <div class="content">
          <p>Assalamualaikum ${nama},</p>
          <p>Terima kasih kerana menghantar maklum balas kepada Surau Al-Islah. Maklum balas anda telah berjaya diterima dan sedang diproses oleh pihak pengurusan.</p>

          <div class="message-box">
            <strong>Maklum Balas Anda:</strong>
            <p>${mesej}</p>
          </div>

          <p>Kami akan menghubungi anda melalui WhatsApp atau emel ini sekiranya terdapat sebarang maklum balas daripada pihak pengurusan.</p>

          <p>Jazakallahu khairan.</p>
          <p><em>Sistem iSAR - Surau Al-Islah</em></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Surau Al-Islah. Semua hak cipta terpelihara.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Assalamualaikum ${nama},

Terima kasih kerana menghantar maklum balas kepada Surau Al-Islah. Maklum balas anda telah berjaya diterima dan sedang diproses oleh pihak pengurusan.

Maklum Balas Anda:
${mesej}

Kami akan menghubungi anda melalui WhatsApp atau emel ini sekiranya terdapat sebarang maklum balas daripada pihak pengurusan.

Jazakallahu khairan.
Sistem iSAR - Surau Al-Islah`;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send feedback reply email to sender
 */
export async function sendFeedbackReplyEmail(
  to: string,
  nama: string,
  originalMessage: string,
  adminReply: string
): Promise<boolean> {
  const subject = 'Jawapan Daripada Surau Al-Islah';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #198754; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background-color: #343a40; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .message-box { background-color: white; padding: 15px; border-left: 4px solid #6c757d; margin: 15px 0; }
        .reply-box { background-color: white; padding: 15px; border-left: 4px solid #198754; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Surau Al-Islah</h2>
          <p>Jawapan Maklum Balas</p>
        </div>
        <div class="content">
          <p>Assalamualaikum ${nama},</p>
          <p>Berikut adalah jawapan daripada pihak pengurusan Surau Al-Islah berhubung maklum balas yang anda hantar:</p>

          <div class="message-box">
            <strong>Maklum Balas Asal Anda:</strong>
            <p>${originalMessage}</p>
          </div>

          <div class="reply-box">
            <strong>Jawapan Pengurusan:</strong>
            <p>${adminReply}</p>
          </div>

          <p>Sekiranya anda mempunyai sebarang pertanyaan lanjut, sila hubungi pihak pengurusan atau hantar maklum balas baru.</p>

          <p>Jazakallahu khairan.</p>
          <p><em>Sistem iSAR - Surau Al-Islah</em></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Surau Al-Islah. Semua hak cipta terpelihara.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Assalamualaikum ${nama},

Berikut adalah jawapan daripada pihak pengurusan Surau Al-Islah berhubung maklum balas yang anda hantar:

Maklum Balas Asal Anda:
${originalMessage}

Jawapan Pengurusan:
${adminReply}

Sekiranya anda mempunyai sebarang pertanyaan lanjut, sila hubungi pihak pengurusan atau hantar maklum balas baru.

Jazakallahu khairan.
Sistem iSAR - Surau Al-Islah`;

  return sendEmail({ to, subject, html, text });
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
 * Send email notification when khairat application is approved
 */
export async function sendKhairatApprovalEmail(data: KhairatAhliData): Promise<boolean> {
  if (!data.email) return false;

  const jenisYuranLabel = {
    keahlian: 'Yuran Keahlian (Sekali)',
    tahunan: 'Yuran Tahunan',
    isteri_kedua: 'Yuran Keahlian Isteri Kedua'
  }[data.jenis_yuran] || data.jenis_yuran;

  const subject = 'Keahlian Khairat Kematian Diluluskan - Masjid Saujana Impian';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #198754; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background-color: #343a40; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .info-box { background-color: white; padding: 15px; border-left: 4px solid #198754; margin: 15px 0; }
        .warning-box { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px 0; }
        td:first-child { font-weight: bold; width: 40%; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Masjid Saujana Impian</h2>
          <p>Khairat Kematian - Keahlian Diluluskan</p>
        </div>
        <div class="content">
          <p>Assalamualaikum ${data.nama},</p>
          <p>Alhamdulillah, permohonan keahlian Khairat Kematian anda telah <strong>DILULUSKAN</strong>.</p>

          <div class="info-box">
            <h4 style="margin-top: 0;">Maklumat Keahlian</h4>
            <table>
              <tr><td>No. Ahli:</td><td>KK-${String(data.id).padStart(4, '0')}</td></tr>
              <tr><td>Nama:</td><td>${data.nama}</td></tr>
              <tr><td>No. K/P:</td><td>${data.no_kp}</td></tr>
              <tr><td>Jenis Yuran:</td><td>${jenisYuranLabel}</td></tr>
              <tr><td>No. Resit:</td><td>${data.no_resit}</td></tr>
              <tr><td>Amaun:</td><td>RM ${parseFloat(String(data.amaun_bayaran)).toFixed(2)}</td></tr>
              <tr><td>Tanggungan:</td><td>${data.tanggungan_count} orang</td></tr>
            </table>
          </div>

          <div class="warning-box">
            <h4 style="margin-top: 0;">Peringatan Penting</h4>
            <ul style="margin-bottom: 0;">
              <li>Tempoh bertenang: 1 bulan dari tarikh daftar</li>
              <li>Keahlian akan gugur jika tidak aktif selama 2 tahun</li>
            </ul>
          </div>

          <p>Terima kasih atas penyertaan anda dalam khairat kematian Masjid Saujana Impian.</p>
          <p>Jazakallahu khairan.</p>
          <p><em>Biro Khairat Kematian Masjid Saujana Impian</em></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Masjid Saujana Impian. Semua hak cipta terpelihara.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Assalamualaikum ${data.nama},

Alhamdulillah, permohonan keahlian Khairat Kematian anda telah DILULUSKAN.

MAKLUMAT KEAHLIAN
No. Ahli: KK-${String(data.id).padStart(4, '0')}
Nama: ${data.nama}
No. K/P: ${data.no_kp}
Jenis Yuran: ${jenisYuranLabel}
No. Resit: ${data.no_resit}
Amaun: RM ${parseFloat(String(data.amaun_bayaran)).toFixed(2)}
Tanggungan: ${data.tanggungan_count} orang

PERINGATAN PENTING:
- Tempoh bertenang: 1 bulan dari tarikh daftar
- Keahlian akan gugur jika tidak aktif selama 2 tahun

Terima kasih atas penyertaan anda.

Jazakallahu khairan.
Biro Khairat Kematian Masjid Saujana Impian`;

  return sendEmail({ to: data.email, subject, html, text });
}

/**
 * Send email notification when khairat application is rejected
 */
export async function sendKhairatRejectionEmail(
  data: KhairatAhliData,
  rejectReason: string
): Promise<boolean> {
  if (!data.email) return false;

  const subject = 'Permohonan Khairat Kematian Tidak Diluluskan - Masjid Saujana Impian';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background-color: #343a40; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .reason-box { background-color: white; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Masjid Saujana Impian</h2>
          <p>Khairat Kematian - Permohonan Tidak Diluluskan</p>
        </div>
        <div class="content">
          <p>Assalamualaikum ${data.nama},</p>
          <p>Dengan hormatnya dimaklumkan bahawa permohonan keahlian Khairat Kematian anda <strong>TIDAK DAPAT DILULUSKAN</strong>.</p>

          <div class="reason-box">
            <h4 style="margin-top: 0;">Sebab Penolakan:</h4>
            <p style="margin-bottom: 0;">${rejectReason || 'Tidak dinyatakan'}</p>
          </div>

          <p>Anda boleh menghubungi pihak pengurusan untuk maklumat lanjut atau membuat permohonan baru.</p>
          <p>Mohon maaf atas sebarang kesulitan.</p>
          <p>Jazakallahu khairan.</p>
          <p><em>Biro Khairat Kematian Masjid Saujana Impian</em></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Masjid Saujana Impian. Semua hak cipta terpelihara.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Assalamualaikum ${data.nama},

Dengan hormatnya dimaklumkan bahawa permohonan keahlian Khairat Kematian anda TIDAK DAPAT DILULUSKAN.

Sebab Penolakan:
${rejectReason || 'Tidak dinyatakan'}

Anda boleh menghubungi pihak pengurusan untuk maklumat lanjut atau membuat permohonan baru.

Mohon maaf atas sebarang kesulitan.

Jazakallahu khairan.
Biro Khairat Kematian Masjid Saujana Impian`;

  return sendEmail({ to: data.email, subject, html, text });
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return !!(SMTP_USER && SMTP_PASS);
}

/**
 * Get email configuration status
 */
export function getEmailStatus(): { configured: boolean; host: string; port: number } {
  return {
    configured: !!(SMTP_USER && SMTP_PASS),
    host: SMTP_HOST,
    port: SMTP_PORT,
  };
}
