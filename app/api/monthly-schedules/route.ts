import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

// GET - Fetch monthly schedules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    const [schedules] = await pool.query<RowDataPacket[]>(
      `SELECT ms.id, DATE_FORMAT(ms.schedule_date, '%Y-%m-%d') as schedule_date,
              ms.schedule_type, ms.prayer_time, ms.petugas_id, ms.petugas_role,
              ms.month_number, ms.year, ms.is_auto_generated, ms.notes,
              ms.created_by, ms.modified_by, ms.created_at, ms.updated_at,
              u.name as petugas_name
       FROM monthly_schedules ms
       LEFT JOIN users u ON ms.petugas_id = u.id
       WHERE ms.month_number = ? AND ms.year = ?
       ORDER BY ms.schedule_date,
         FIELD(ms.schedule_type, 'prayer', 'tadabbur', 'tahsin', 'imam_jumaat'),
         FIELD(ms.prayer_time, 'Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'),
         FIELD(ms.petugas_role, 'imam', 'bilal', 'siak', 'tadabbur', 'tahsin', 'imam_jumaat')`,
      [month, year]
    );

    // Also get personnel lists for dropdowns
    const [imams] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id, u.name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.is_active = TRUE AND (u.role = 'imam' OR ur.role = 'imam')
       ORDER BY u.name`
    );

    const [bilals] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id, u.name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.is_active = TRUE AND (u.role = 'bilal' OR ur.role = 'bilal')
       ORDER BY u.name`
    );

    const [siaks] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id, u.name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.is_active = TRUE AND (u.role = 'siak' OR ur.role = 'siak')
       ORDER BY u.name`
    );

    const [tadabbur] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id, u.name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.is_active = TRUE AND (u.role = 'tadabbur' OR ur.role = 'tadabbur')
       ORDER BY u.name`
    );

    const [tahsin] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id, u.name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.is_active = TRUE AND (u.role = 'tahsin' OR ur.role = 'tahsin')
       ORDER BY u.name`
    );

    const [imamJumaat] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id, u.name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.is_active = TRUE AND (u.role = 'imam_jumaat' OR ur.role = 'imam_jumaat')
       ORDER BY u.name`
    );

    return NextResponse.json({
      schedules,
      personnel: {
        imams,
        bilals,
        siaks,
        tadabbur,
        tahsin,
        imamJumaat
      }
    });
  } catch (error) {
    console.error('Error fetching monthly schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// POST - Create individual schedule entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'head_imam' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      schedule_date,
      schedule_type,
      prayer_time,
      petugas_id,
      petugas_role,
      month_number,
      year
    } = body;

    if (!schedule_date || !schedule_type || !petugas_role || !month_number || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const createdBy = (session.user as any).id;

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO monthly_schedules
       (schedule_date, schedule_type, prayer_time, petugas_id, petugas_role, month_number, year, is_auto_generated, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, ?)
       ON DUPLICATE KEY UPDATE
       petugas_id = VALUES(petugas_id),
       modified_by = VALUES(created_by),
       is_auto_generated = FALSE`,
      [schedule_date, schedule_type, prayer_time, petugas_id, petugas_role, month_number, year, createdBy]
    );

    return NextResponse.json({
      message: 'Schedule created successfully',
      id: result.insertId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete all schedules for a month
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'head_imam' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM monthly_schedules WHERE month_number = ? AND year = ?',
      [month, year]
    );

    return NextResponse.json({
      message: 'Schedules deleted successfully',
      deleted: result.affectedRows
    });
  } catch (error) {
    console.error('Error deleting schedules:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedules' },
      { status: 500 }
    );
  }
}
