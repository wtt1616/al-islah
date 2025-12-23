import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendKhairatApprovalWhatsApp, sendKhairatRejectionWhatsApp, isWhatsAppConfigured } from '@/lib/whatsapp';
import { sendKhairatApprovalEmail, sendKhairatRejectionEmail, isEmailConfigured } from '@/lib/email';
import { decrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

interface BayaranRow extends RowDataPacket {
  id: number;
  khairat_ahli_id: number;
  tahun: number;
  jenis_bayaran: 'tahunan' | 'tunggakan';
  amaun: number;
  no_resit: string | null;
  resit_file: string | null;
  status: 'pending' | 'approved' | 'rejected';
  tarikh_bayar: string | null;
  tarikh_lulus: Date | null;
  approved_by: number | null;
  reject_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

interface AhliRow extends RowDataPacket {
  id: number;
  nama: string;
  no_kp: string;
  no_hp: string;
  email: string | null;
}

// GET - Get single payment detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'head_imam', 'bendahari', 'khairat'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        kb.*,
        ka.nama as nama_ahli,
        ka.no_kp as no_kp_ahli,
        ka.no_hp as no_hp_ahli,
        ka.email as email_ahli,
        ka.alamat as alamat_ahli,
        u.name as approver_name
       FROM khairat_bayaran kb
       JOIN khairat_ahli ka ON kb.khairat_ahli_id = ka.id
       LEFT JOIN users u ON kb.approved_by = u.id
       WHERE kb.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Pembayaran tidak dijumpai' }, { status: 404 });
    }

    // Decrypt no_kp
    const payment = {
      ...rows[0],
      no_kp_ahli: decrypt(rows[0].no_kp_ahli)
    };

    return NextResponse.json(payment);

  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Gagal memuatkan pembayaran' }, { status: 500 });
  }
}

// PUT - Approve or reject payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'head_imam', 'bendahari', 'khairat'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reject_reason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Tindakan tidak sah' }, { status: 400 });
    }

    // Get current payment
    const [paymentRows] = await pool.query<BayaranRow[]>(
      'SELECT * FROM khairat_bayaran WHERE id = ?',
      [id]
    );

    if (paymentRows.length === 0) {
      return NextResponse.json({ error: 'Pembayaran tidak dijumpai' }, { status: 404 });
    }

    const payment = paymentRows[0];

    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'Pembayaran sudah diproses sebelum ini' }, { status: 400 });
    }

    // Get member info for notifications
    const [ahliRows] = await pool.query<AhliRow[]>(
      'SELECT id, nama, no_kp, no_hp, email FROM khairat_ahli WHERE id = ?',
      [payment.khairat_ahli_id]
    );

    if (ahliRows.length === 0) {
      return NextResponse.json({ error: 'Ahli tidak dijumpai' }, { status: 404 });
    }

    const ahli = ahliRows[0];

    if (action === 'approve') {
      // Approve payment
      await pool.query<ResultSetHeader>(
        `UPDATE khairat_bayaran
         SET status = 'approved', tarikh_lulus = NOW(), approved_by = ?
         WHERE id = ?`,
        [session.user.id, id]
      );

      // Send notifications
      const notificationData = {
        id: ahli.id,
        nama: ahli.nama,
        no_kp: ahli.no_kp,
        no_hp: ahli.no_hp,
        email: ahli.email || undefined,
        jenis_yuran: 'tahunan' as const,
        no_resit: payment.no_resit || '',
        amaun_bayaran: payment.amaun,
        tarikh_daftar: payment.tarikh_bayar || '',
        tanggungan_count: 0
      };

      const notificationPromises: Promise<boolean>[] = [];

      if (isWhatsAppConfigured()) {
        notificationPromises.push(sendKhairatApprovalWhatsApp(notificationData));
      }

      if (isEmailConfigured() && ahli.email) {
        notificationPromises.push(sendKhairatApprovalEmail(notificationData));
      }

      Promise.allSettled(notificationPromises).then((results) => {
        console.log('Payment approval notifications:', results);
      });

      return NextResponse.json({
        success: true,
        message: `Pembayaran yuran tahun ${payment.tahun} telah diluluskan`
      });

    } else {
      // Reject payment
      if (!reject_reason) {
        return NextResponse.json({ error: 'Sila nyatakan sebab penolakan' }, { status: 400 });
      }

      await pool.query<ResultSetHeader>(
        `UPDATE khairat_bayaran
         SET status = 'rejected', reject_reason = ?, approved_by = ?
         WHERE id = ?`,
        [reject_reason, session.user.id, id]
      );

      // Send notifications
      const notificationData = {
        id: ahli.id,
        nama: ahli.nama,
        no_kp: ahli.no_kp,
        no_hp: ahli.no_hp,
        email: ahli.email || undefined,
        jenis_yuran: 'tahunan' as const,
        no_resit: payment.no_resit || '',
        amaun_bayaran: payment.amaun,
        tarikh_daftar: payment.tarikh_bayar || '',
        tanggungan_count: 0
      };

      const notificationPromises: Promise<boolean>[] = [];

      if (isWhatsAppConfigured()) {
        notificationPromises.push(sendKhairatRejectionWhatsApp(notificationData, reject_reason));
      }

      if (isEmailConfigured() && ahli.email) {
        notificationPromises.push(sendKhairatRejectionEmail(notificationData, reject_reason));
      }

      Promise.allSettled(notificationPromises).then((results) => {
        console.log('Payment rejection notifications:', results);
      });

      return NextResponse.json({
        success: true,
        message: `Pembayaran yuran tahun ${payment.tahun} telah ditolak`
      });
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'Gagal memproses pembayaran' }, { status: 500 });
  }
}

// DELETE - Delete payment (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM khairat_bayaran WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Pembayaran tidak dijumpai' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Pembayaran telah dipadam'
    });

  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Gagal memadam pembayaran' }, { status: 500 });
  }
}
