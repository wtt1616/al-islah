import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

// GET - Fetch monthly schedules for public display (no auth required)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    const [schedules] = await pool.query<RowDataPacket[]>(
      `SELECT ms.id, DATE_FORMAT(ms.schedule_date, '%Y-%m-%d') as schedule_date,
              ms.schedule_type, ms.prayer_time, ms.petugas_id, ms.petugas_role,
              u.name as petugas_name
       FROM monthly_schedules ms
       LEFT JOIN users u ON ms.petugas_id = u.id
       WHERE ms.schedule_date BETWEEN ? AND ?
       ORDER BY ms.schedule_date,
         FIELD(ms.prayer_time, 'Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'),
         FIELD(ms.petugas_role, 'imam', 'bilal', 'siak', 'tadabbur', 'tahsin', 'imam_jumaat')`,
      [startDate, endDate]
    );

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching public monthly schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}
