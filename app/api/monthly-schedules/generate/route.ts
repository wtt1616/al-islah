import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { generateMonthlySchedule } from '@/lib/monthlyScheduleGenerator';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;

  // Only head_imam and admin can generate schedules
  if (userRole !== 'head_imam' && userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { month, year } = body;

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    // Check if schedules already exist for this month
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM monthly_schedules WHERE month_number = ? AND year = ?',
      [month, year]
    );

    if ((existing[0] as any).count > 0) {
      return NextResponse.json(
        { error: 'Jadual untuk bulan ini sudah wujud. Sila padam dahulu sebelum menjana semula.' },
        { status: 400 }
      );
    }

    // Generate schedules
    const createdBy = (session.user as any).id;
    const schedules = await generateMonthlySchedule(month, year, createdBy);

    if (schedules.length === 0) {
      return NextResponse.json(
        { error: 'Tiada jadual yang dijana. Sila pastikan petugas telah didaftarkan.' },
        { status: 400 }
      );
    }

    // Insert all schedules in batch
    const values = schedules.map(s => [
      s.schedule_date,
      s.schedule_type,
      s.prayer_time,
      s.petugas_id,
      s.petugas_role,
      s.month_number,
      s.year,
      s.is_auto_generated,
      s.created_by
    ]);

    // Insert in batches of 100 to avoid query size limits
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const flatValues = batch.flat();

      await pool.execute(
        `INSERT INTO monthly_schedules
         (schedule_date, schedule_type, prayer_time, petugas_id, petugas_role, month_number, year, is_auto_generated, created_by)
         VALUES ${placeholders}`,
        flatValues
      );

      insertedCount += batch.length;
    }

    // Calculate statistics
    const prayerSlots = schedules.filter(s => s.schedule_type === 'prayer').length;
    const tadabburSlots = schedules.filter(s => s.schedule_type === 'tadabbur').length;
    const tahsinSlots = schedules.filter(s => s.schedule_type === 'tahsin').length;
    const imamJumaatSlots = schedules.filter(s => s.schedule_type === 'imam_jumaat').length;

    return NextResponse.json({
      message: 'Jadual bulanan berjaya dijana',
      count: insertedCount,
      stats: {
        prayer: prayerSlots,
        tadabbur: tadabburSlots,
        tahsin: tahsinSlots,
        imam_jumaat: imamJumaatSlots
      },
      month,
      year
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating monthly schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate schedule' },
      { status: 500 }
    );
  }
}
