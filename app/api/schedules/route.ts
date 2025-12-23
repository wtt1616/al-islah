import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  // SECURITY: Require authentication to view schedules
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekNumber = searchParams.get('week_number');
  const year = searchParams.get('year');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    let query = `
      SELECT
        s.id,
        DATE_FORMAT(s.date, '%Y-%m-%dT00:00:00.000Z') as date,
        s.prayer_time,
        s.imam_id,
        s.bilal_id,
        s.week_number,
        s.year,
        s.is_auto_generated,
        s.created_by,
        i.name as imam_name,
        b.name as bilal_name
      FROM schedules s
      LEFT JOIN users i ON s.imam_id = i.id
      LEFT JOIN users b ON s.bilal_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (weekNumber && year) {
      query += ' AND s.week_number = ? AND s.year = ?';
      params.push(weekNumber, year);
    }

    if (startDate && endDate) {
      query += ' AND s.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY s.date, FIELD(s.prayer_time, "Subuh", "Zohor", "Asar", "Maghrib", "Isyak")';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;

  // Only head_imam and admin can create schedules
  if (userRole !== 'head_imam' && userRole !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, prayer_time, imam_id, bilal_id, week_number, year, is_auto_generated } = body;
    const createdBy = (session.user as any).id;

    const [result] = await pool.execute(
      `INSERT INTO schedules (date, prayer_time, imam_id, bilal_id, week_number, year, is_auto_generated, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [date, prayer_time, imam_id, bilal_id, week_number, year, is_auto_generated || false, createdBy]
    );

    return NextResponse.json({
      message: 'Schedule created successfully',
      id: (result as any).insertId
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Schedule already exists for this date and prayer time' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}
