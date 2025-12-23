import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendFeedbackReplyWhatsApp, isWhatsAppConfigured } from '@/lib/whatsapp';
import { sendFeedbackReplyEmail, isEmailConfigured } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface FeedbackRow extends RowDataPacket {
  id: number;
  nama: string;
  no_telefon: string;
  alamat: string;
  emel: string;
  mesej: string;
  status: string;
  admin_reply: string | null;
}

// POST - Reply to feedback (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'head_imam'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, reply } = body;

    if (!id || !reply) {
      return NextResponse.json(
        { error: 'ID dan jawapan diperlukan' },
        { status: 400 }
      );
    }

    // Get feedback details
    const [feedbackRows] = await pool.query<FeedbackRow[]>(
      'SELECT * FROM feedback WHERE id = ?',
      [id]
    );

    if (feedbackRows.length === 0) {
      return NextResponse.json({ error: 'Maklum balas tidak dijumpai' }, { status: 404 });
    }

    const feedback = feedbackRows[0];

    // Update feedback with reply
    await pool.query(
      `UPDATE feedback
       SET admin_reply = ?,
           replied_by = ?,
           replied_at = NOW(),
           status = 'dibalas'
       WHERE id = ?`,
      [reply.trim(), session.user.id, id]
    );

    // Send notifications
    let whatsappSent = false;
    let emailSent = false;

    // Send WhatsApp notification
    if (isWhatsAppConfigured()) {
      try {
        whatsappSent = await sendFeedbackReplyWhatsApp(
          feedback.no_telefon,
          feedback.nama,
          feedback.mesej,
          reply
        );
      } catch (error) {
        console.error('WhatsApp notification error:', error);
      }
    }

    // Send email notification
    if (isEmailConfigured()) {
      try {
        emailSent = await sendFeedbackReplyEmail(
          feedback.emel,
          feedback.nama,
          feedback.mesej,
          reply
        );
      } catch (error) {
        console.error('Email notification error:', error);
      }
    }

    // Update notification status
    await pool.query(
      'UPDATE feedback SET whatsapp_sent = ?, email_sent = ? WHERE id = ?',
      [whatsappSent, emailSent, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Jawapan telah dihantar',
      notifications: {
        whatsapp: whatsappSent,
        email: emailSent
      }
    });
  } catch (error) {
    console.error('Error replying to feedback:', error);
    return NextResponse.json({ error: 'Gagal menghantar jawapan' }, { status: 500 });
  }
}
