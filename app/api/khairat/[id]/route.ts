import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendKhairatApprovalWhatsApp, sendKhairatRejectionWhatsApp, isWhatsAppConfigured } from '@/lib/whatsapp';
import { sendKhairatApprovalEmail, sendKhairatRejectionEmail, isEmailConfigured } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface KhairatAhliRow extends RowDataPacket {
  id: number;
  nama: string;
  no_kp: string;
  umur: number | null;
  alamat: string | null;
  no_telefon_rumah: string | null;
  no_hp: string;
  email: string | null;
  jenis_yuran: 'keahlian' | 'tahunan' | 'isteri_kedua';
  no_resit: string | null;
  resit_file: string | null;
  amaun_bayaran: number;
  status: 'pending' | 'approved' | 'rejected';
  tarikh_daftar: string | null;
  tarikh_lulus: Date | null;
  approved_by: number | null;
  reject_reason: string | null;
  created_at: Date;
  updated_at: Date;
  approver_name?: string;
}

interface TanggunganRow extends RowDataPacket {
  id: number;
  khairat_ahli_id: number;
  nama_penuh: string;
  no_kp: string | null;
  umur: number | null;
  pertalian: 'isteri' | 'pasangan' | 'anak' | 'anak_oku';
  created_at: Date;
}

// GET - Get single khairat application detail
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

    // Get main application
    const [rows] = await pool.query<KhairatAhliRow[]>(
      `SELECT k.*, u.name as approver_name
       FROM khairat_ahli k
       LEFT JOIN users u ON k.approved_by = u.id
       WHERE k.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Permohonan tidak dijumpai' }, { status: 404 });
    }

    // Get tanggungan
    const [tanggungan] = await pool.query<TanggunganRow[]>(
      `SELECT * FROM khairat_tanggungan WHERE khairat_ahli_id = ? ORDER BY id`,
      [id]
    );

    return NextResponse.json({
      ...rows[0],
      tanggungan
    });
  } catch (error) {
    console.error('Error fetching khairat application:', error);
    return NextResponse.json({ error: 'Gagal memuatkan permohonan' }, { status: 500 });
  }
}

// PUT - Approve, reject, or update khairat application
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

    if (!action || !['approve', 'reject', 'update'].includes(action)) {
      return NextResponse.json({ error: 'Tindakan tidak sah' }, { status: 400 });
    }

    // Handle update action
    if (action === 'update') {
      return await handleUpdate(id, body, session);
    }

    // Get current application
    const [rows] = await pool.query<KhairatAhliRow[]>(
      'SELECT * FROM khairat_ahli WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Permohonan tidak dijumpai' }, { status: 404 });
    }

    const application = rows[0];

    if (application.status !== 'pending') {
      return NextResponse.json({ error: 'Permohonan sudah diproses sebelum ini' }, { status: 400 });
    }

    // Get tanggungan count
    const [tanggunganCount] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM khairat_tanggungan WHERE khairat_ahli_id = ?',
      [id]
    );

    if (action === 'approve') {
      // Approve application
      await pool.query<ResultSetHeader>(
        `UPDATE khairat_ahli
         SET status = 'approved', tarikh_lulus = NOW(), approved_by = ?
         WHERE id = ?`,
        [session.user.id, id]
      );

      // Send notifications
      const notificationData = {
        id: application.id,
        nama: application.nama,
        no_kp: application.no_kp,
        no_hp: application.no_hp,
        email: application.email || undefined,
        jenis_yuran: application.jenis_yuran,
        no_resit: application.no_resit || '',
        amaun_bayaran: application.amaun_bayaran,
        tarikh_daftar: application.tarikh_daftar || '',
        tanggungan_count: tanggunganCount[0].count
      };

      const notificationPromises: Promise<boolean>[] = [];

      if (isWhatsAppConfigured()) {
        notificationPromises.push(sendKhairatApprovalWhatsApp(notificationData));
      }

      if (isEmailConfigured() && application.email) {
        notificationPromises.push(sendKhairatApprovalEmail(notificationData));
      }

      // Fire and forget notifications
      Promise.allSettled(notificationPromises).then((results) => {
        console.log('Khairat approval notifications:', results);
      });

      return NextResponse.json({
        success: true,
        message: 'Permohonan telah diluluskan dan notifikasi telah dihantar'
      });

    } else {
      // Reject application
      if (!reject_reason) {
        return NextResponse.json({ error: 'Sila nyatakan sebab penolakan' }, { status: 400 });
      }

      await pool.query<ResultSetHeader>(
        `UPDATE khairat_ahli
         SET status = 'rejected', reject_reason = ?, approved_by = ?
         WHERE id = ?`,
        [reject_reason, session.user.id, id]
      );

      // Send notifications
      const notificationData = {
        id: application.id,
        nama: application.nama,
        no_kp: application.no_kp,
        no_hp: application.no_hp,
        email: application.email || undefined,
        jenis_yuran: application.jenis_yuran,
        no_resit: application.no_resit || '',
        amaun_bayaran: application.amaun_bayaran,
        tarikh_daftar: application.tarikh_daftar || '',
        tanggungan_count: tanggunganCount[0].count
      };

      const notificationPromises: Promise<boolean>[] = [];

      if (isWhatsAppConfigured()) {
        notificationPromises.push(sendKhairatRejectionWhatsApp(notificationData, reject_reason));
      }

      if (isEmailConfigured() && application.email) {
        notificationPromises.push(sendKhairatRejectionEmail(notificationData, reject_reason));
      }

      // Fire and forget notifications
      Promise.allSettled(notificationPromises).then((results) => {
        console.log('Khairat rejection notifications:', results);
      });

      return NextResponse.json({
        success: true,
        message: 'Permohonan telah ditolak dan notifikasi telah dihantar'
      });
    }
  } catch (error) {
    console.error('Error processing khairat application:', error);
    return NextResponse.json({ error: 'Gagal memproses permohonan' }, { status: 500 });
  }
}

// Helper function to handle update action
async function handleUpdate(id: string, body: any, session: any) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { nama, no_kp, umur, alamat, no_hp, tanggungan } = body;

    // Validate required fields
    if (!nama || !no_kp || !alamat || !no_hp) {
      return NextResponse.json({ error: 'Sila lengkapkan semua maklumat wajib' }, { status: 400 });
    }

    // Clean IC number
    const cleanNoKp = no_kp.replace(/[-\s]/g, '').trim();

    // Update main record
    await connection.query<ResultSetHeader>(
      `UPDATE khairat_ahli SET
        nama = ?, no_kp = ?, umur = ?, alamat = ?, no_hp = ?, updated_at = NOW()
       WHERE id = ?`,
      [nama.trim(), cleanNoKp, umur || null, alamat.trim(), no_hp.replace(/[-\s]/g, '').trim(), id]
    );

    // Handle tanggungan updates
    if (tanggungan && Array.isArray(tanggungan)) {
      // Get existing tanggungan IDs
      const [existingTanggungan] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM khairat_tanggungan WHERE khairat_ahli_id = ?',
        [id]
      );
      const existingIds = existingTanggungan.map((t: any) => t.id);

      // Process each tanggungan
      const processedIds: number[] = [];

      for (const t of tanggungan) {
        if (!t.nama_penuh || !t.pertalian) continue;

        const tanggunganNoKp = t.no_kp?.trim() ? t.no_kp.replace(/[-\s]/g, '').trim() : null;

        if (t.id && existingIds.includes(t.id)) {
          // Update existing tanggungan
          await connection.query(
            `UPDATE khairat_tanggungan SET
              nama_penuh = ?, no_kp = ?, umur = ?, pertalian = ?
             WHERE id = ? AND khairat_ahli_id = ?`,
            [t.nama_penuh.trim(), tanggunganNoKp, t.umur || null, t.pertalian, t.id, id]
          );
          processedIds.push(t.id);
        } else {
          // Insert new tanggungan
          const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO khairat_tanggungan (khairat_ahli_id, nama_penuh, no_kp, umur, pertalian)
             VALUES (?, ?, ?, ?, ?)`,
            [id, t.nama_penuh.trim(), tanggunganNoKp, t.umur || null, t.pertalian]
          );
          processedIds.push(result.insertId);
        }
      }

      // Delete tanggungan that were removed
      const idsToDelete = existingIds.filter((existingId: number) => !processedIds.includes(existingId));
      if (idsToDelete.length > 0) {
        await connection.query(
          `DELETE FROM khairat_tanggungan WHERE id IN (?) AND khairat_ahli_id = ?`,
          [idsToDelete, id]
        );
      }
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: 'Rekod khairat telah dikemaskini'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating khairat record:', error);
    return NextResponse.json({ error: 'Gagal mengemaskini rekod' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// DELETE - Delete khairat application (Admin only)
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

    // Delete will cascade to tanggungan due to ON DELETE CASCADE
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM khairat_ahli WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Permohonan tidak dijumpai' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Permohonan telah dipadam'
    });
  } catch (error) {
    console.error('Error deleting khairat application:', error);
    return NextResponse.json({ error: 'Gagal memadam permohonan' }, { status: 500 });
  }
}
