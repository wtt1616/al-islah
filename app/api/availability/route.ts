import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const date = searchParams.get('date');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const isAvailable = searchParams.get('is_available');

  try {
    let query = `
      SELECT a.id, a.user_id, DATE_FORMAT(a.date, '%Y-%m-%d') as date,
             a.prayer_time, a.is_available, a.reason,
             a.created_at, a.updated_at, u.name as user_name
      FROM availability a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      query += ' AND a.user_id = ?';
      params.push(userId);
    }

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }

    if (startDate && endDate) {
      query += ' AND a.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (isAvailable !== null && isAvailable !== undefined) {
      query += ' AND a.is_available = ?';
      params.push(isAvailable === 'true' ? 1 : 0);
    }

    query += ' ORDER BY a.date, a.prayer_time';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({
      error: 'Failed to fetch availability',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { user_id, date, prayer_time, is_available, reason } = body;

    const userRole = (session.user as any).role;
    const sessionUserId = (session.user as any).id;

    // Imam and Bilal can only set their own availability
    if ((userRole === 'imam' || userRole === 'bilal') && user_id != sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [result] = await pool.execute(
      `INSERT INTO availability (user_id, date, prayer_time, is_available, reason)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE is_available = ?, reason = ?`,
      [user_id, date, prayer_time, is_available, reason, is_available, reason]
    );

    return NextResponse.json({
      message: 'Availability saved successfully',
      id: (result as any).insertId
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving availability:', error);
    return NextResponse.json({
      error: 'Failed to save availability',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
