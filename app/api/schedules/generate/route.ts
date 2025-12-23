import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { generateWeeklySchedule, getWednesday } from '@/lib/scheduleGenerator';

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;

  // Only head_imam and admin can generate schedules
  if (userRole !== 'head_imam' && userRole !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { start_date } = body;

    if (!start_date) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
    }

    const startDate = getWednesday(new Date(start_date));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const startDateStr = formatDateOnly(startDate);
    const endDateStr = formatDateOnly(endDate);

    // Check if schedules already exist for this week
    const [existing] = await pool.execute(
      'SELECT COUNT(*) as count FROM schedules WHERE date BETWEEN ? AND ?',
      [startDateStr, endDateStr]
    );

    if ((existing as any)[0].count > 0) {
      return NextResponse.json(
        { error: 'Schedules already exist for this week. Please delete them first.' },
        { status: 400 }
      );
    }

    // Generate schedules
    const createdBy = (session.user as any).id;
    const schedules = await generateWeeklySchedule(startDate, createdBy);

    // Insert all schedules
    const values = schedules.map(s =>
      [s.date, s.prayer_time, s.imam_id, s.bilal_id, s.week_number, s.year, s.is_auto_generated, s.created_by]
    );

    for (const value of values) {
      await pool.execute(
        `INSERT INTO schedules (date, prayer_time, imam_id, bilal_id, week_number, year, is_auto_generated, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        value
      );
    }

    return NextResponse.json({
      message: 'Weekly schedule generated successfully',
      count: schedules.length,
      start_date: startDateStr,
      end_date: endDateStr
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate schedule' },
      { status: 500 }
    );
  }
}
