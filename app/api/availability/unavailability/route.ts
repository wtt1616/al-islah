import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Fetch unavailability records (only head_imam can access)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only head_imam and admin can view all unavailability
    if (!['head_imam', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('user_name');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = `
      SELECT
        a.id,
        a.user_id,
        u.name as user_name,
        u.role as user_role,
        DATE_FORMAT(a.date, '%Y-%m-%d') as date,
        a.prayer_time,
        a.reason,
        a.created_at,
        a.updated_at
      FROM availability a
      JOIN users u ON a.user_id = u.id
      WHERE a.is_available = 0
        AND u.role IN ('imam', 'bilal')
    `;

    const params: any[] = [];

    // Filter by user name (partial match)
    if (userName && userName.trim() !== '') {
      query += ' AND u.name LIKE ?';
      params.push(`%${userName}%`);
    }

    // Filter by date range
    if (startDate && endDate) {
      query += ' AND a.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' AND a.date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' AND a.date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY a.date DESC, u.name, a.prayer_time';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching unavailability records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unavailability records' },
      { status: 500 }
    );
  }
}
