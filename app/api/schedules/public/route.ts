import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

// GET - Public endpoint for viewing schedules (used on login page)
// Only returns basic schedule info without sensitive data
export async function GET(request: NextRequest) {
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
    console.error('Error fetching public schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}
