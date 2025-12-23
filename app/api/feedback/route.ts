import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendFeedbackConfirmationWhatsApp, isWhatsAppConfigured } from '@/lib/whatsapp';
import { sendFeedbackConfirmation, isEmailConfigured } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface FeedbackRow extends RowDataPacket {
  id: number;
  nama: string;
  no_telefon: string;
  alamat: string;
  emel: string;
  mesej: string;
  status: 'baru' | 'dibaca' | 'dibalas';
  admin_reply: string | null;
  replied_by: number | null;
  replied_at: Date | null;
  whatsapp_sent: boolean;
  email_sent: boolean;
  created_at: Date;
  updated_at: Date;
  replied_by_name?: string;
}

// GET - Fetch all feedback (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'head_imam'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        f.*,
        u.name as replied_by_name
      FROM feedback f
      LEFT JOIN users u ON f.replied_by = u.id
    `;
    const params: any[] = [];

    if (status && status !== 'semua') {
      query += ' WHERE f.status = ?';
      params.push(status);
    }

    query += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query<FeedbackRow[]>(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM feedback';
    const countParams: any[] = [];
    if (status && status !== 'semua') {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }
    const [countResult] = await pool.query<RowDataPacket[]>(countQuery, countParams);
    const total = countResult[0].total;

    // Get status counts
    const [statusCounts] = await pool.query<RowDataPacket[]>(`
      SELECT
        status,
        COUNT(*) as count
      FROM feedback
      GROUP BY status
    `);

    const counts = {
      semua: total,
      baru: 0,
      dibaca: 0,
      dibalas: 0
    };

    statusCounts.forEach((row: any) => {
      counts[row.status as keyof typeof counts] = row.count;
    });

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      counts
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Gagal memuatkan maklum balas' }, { status: 500 });
  }
}

// POST - Submit new feedback (Public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama, no_telefon, alamat, emel, mesej } = body;

    // Validation
    if (!nama || !no_telefon || !alamat || !emel || !mesej) {
      return NextResponse.json(
        { error: 'Sila lengkapkan semua maklumat' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emel)) {
      return NextResponse.json(
        { error: 'Format emel tidak sah' },
        { status: 400 }
      );
    }

    // Phone number validation (Malaysian format)
    const phoneRegex = /^(\+?60|0)?1[0-9]{8,9}$/;
    const cleanPhone = no_telefon.replace(/[\s\-]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Format nombor telefon tidak sah' },
        { status: 400 }
      );
    }

    // Insert feedback
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO feedback (nama, no_telefon, alamat, emel, mesej, status)
       VALUES (?, ?, ?, ?, ?, 'baru')`,
      [nama.trim(), cleanPhone, alamat.trim(), emel.trim().toLowerCase(), mesej.trim()]
    );

    const feedbackId = result.insertId;

    // Send confirmation notifications (don't block response)
    const notificationPromises: Promise<boolean>[] = [];

    if (isWhatsAppConfigured()) {
      notificationPromises.push(
        sendFeedbackConfirmationWhatsApp(cleanPhone, nama, mesej)
      );
    }

    if (isEmailConfigured()) {
      notificationPromises.push(
        sendFeedbackConfirmation(emel, nama, mesej)
      );
    }

    // Fire and forget notifications
    Promise.allSettled(notificationPromises).then((results) => {
      console.log('Feedback confirmation notifications:', results);
    });

    return NextResponse.json({
      success: true,
      message: 'Maklum balas anda telah berjaya dihantar. Terima kasih!',
      id: feedbackId
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Gagal menghantar maklum balas' }, { status: 500 });
  }
}

// PUT - Update feedback status (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'head_imam'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID dan status diperlukan' }, { status: 400 });
    }

    if (!['baru', 'dibaca', 'dibalas'].includes(status)) {
      return NextResponse.json({ error: 'Status tidak sah' }, { status: 400 });
    }

    await pool.query(
      'UPDATE feedback SET status = ? WHERE id = ?',
      [status, id]
    );

    return NextResponse.json({ success: true, message: 'Status dikemaskini' });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    return NextResponse.json({ error: 'Gagal mengemaskini status' }, { status: 500 });
  }
}
