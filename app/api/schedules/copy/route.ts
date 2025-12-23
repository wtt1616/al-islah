import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  const userId = parseInt((session.user as any).id);

  console.log('POST /api/schedules/copy - User role:', userRole, 'User ID:', userId);

  // Only head_imam and admin can copy schedules
  if (userRole !== 'head_imam' && userRole !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { start_date } = await request.json();
    console.log('Copy schedule request for start_date:', start_date);

    if (!start_date) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      );
    }

    // Parse the start date for the current week (Wednesday)
    const currentWednesday = new Date(start_date);

    // Calculate the previous week's Wednesday (7 days earlier)
    const previousWednesday = new Date(currentWednesday);
    previousWednesday.setDate(currentWednesday.getDate() - 7);

    // Calculate the Tuesday of previous week (end of week)
    const previousTuesday = new Date(previousWednesday);
    previousTuesday.setDate(previousWednesday.getDate() + 6);

    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const prevStartDate = formatDate(previousWednesday);
    const prevEndDate = formatDate(previousTuesday);

    // Fetch previous week's schedules
    const [previousSchedules] = await pool.query<RowDataPacket[]>(
      `SELECT date, prayer_time, imam_id, bilal_id
       FROM schedules
       WHERE date BETWEEN ? AND ?
       ORDER BY date, FIELD(prayer_time, "Subuh", "Zohor", "Asar", "Maghrib", "Isyak")`,
      [prevStartDate, prevEndDate]
    );

    if (previousSchedules.length === 0) {
      return NextResponse.json(
        { error: 'No schedules found for the previous week' },
        { status: 404 }
      );
    }

    // Calculate the current week's end date
    const currentTuesday = new Date(currentWednesday);
    currentTuesday.setDate(currentWednesday.getDate() + 6);
    const currentStartDate = formatDate(currentWednesday);
    const currentEndDate = formatDate(currentTuesday);

    // Fetch unavailability for the current week
    const [unavailabilityData] = await pool.query<RowDataPacket[]>(
      `SELECT user_id, date, prayer_time
       FROM availability
       WHERE is_available = false
       AND date BETWEEN ? AND ?`,
      [currentStartDate, currentEndDate]
    );

    // Build unavailability map: "date_prayerTime" -> Set of unavailable user IDs
    const unavailabilityMap = new Map<string, Set<number>>();
    unavailabilityData.forEach((item: any) => {
      const dateStr = typeof item.date === 'string'
        ? item.date.split('T')[0]
        : formatDate(new Date(item.date));
      const key = `${dateStr}_${item.prayer_time}`;
      if (!unavailabilityMap.has(key)) {
        unavailabilityMap.set(key, new Set());
      }
      unavailabilityMap.get(key)!.add(item.user_id);
    });

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    // Calculate week number and year for the current week
    const currentWeekNumber = getWeekNumber(currentWednesday);
    const currentYear = currentWednesday.getFullYear();

    // Create new schedules for current week based on previous week
    const newSchedules = [];
    const conflictSchedules: Array<{
      date: string;
      prayer_time: string;
      imam_id: number | null;
      bilal_id: number | null;
      imam_unavailable: boolean;
      bilal_unavailable: boolean;
    }> = [];

    for (const prevSchedule of previousSchedules) {
      // Calculate the corresponding date in the current week (add 7 days)
      const prevDate = new Date(prevSchedule.date);
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + 7);
      const newDateStr = formatDate(newDate);

      const prayerTime = prevSchedule.prayer_time;
      const key = `${newDateStr}_${prayerTime}`;
      const unavailableUsers = unavailabilityMap.get(key) || new Set();

      const imamUnavailable = unavailableUsers.has(prevSchedule.imam_id);
      const bilalUnavailable = unavailableUsers.has(prevSchedule.bilal_id);

      // If either imam or bilal is unavailable, mark as null and add to conflicts
      const finalImamId = imamUnavailable ? null : prevSchedule.imam_id;
      const finalBilalId = bilalUnavailable ? null : prevSchedule.bilal_id;

      if (imamUnavailable || bilalUnavailable) {
        conflictSchedules.push({
          date: newDateStr,
          prayer_time: prayerTime,
          imam_id: finalImamId,
          bilal_id: finalBilalId,
          imam_unavailable: imamUnavailable,
          bilal_unavailable: bilalUnavailable,
        });
      }

      newSchedules.push({
        date: newDateStr,
        prayer_time: prayerTime,
        imam_id: finalImamId,
        bilal_id: finalBilalId,
        week_number: currentWeekNumber,
        year: currentYear,
      });
    }

    // Insert the new schedules
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const schedule of newSchedules) {
        await connection.query(
          `INSERT INTO schedules (date, prayer_time, imam_id, bilal_id, week_number, year, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           imam_id = VALUES(imam_id),
           bilal_id = VALUES(bilal_id)`,
          [
            schedule.date,
            schedule.prayer_time,
            schedule.imam_id,
            schedule.bilal_id,
            schedule.week_number,
            schedule.year,
            userId,
          ]
        );
      }

      await connection.commit();

      return NextResponse.json({
        message: `Successfully copied ${newSchedules.length} schedules from previous week`,
        conflicts: conflictSchedules.length > 0 ? conflictSchedules : undefined,
        conflictCount: conflictSchedules.length,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error copying schedule:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to copy schedule', details: errorMessage },
      { status: 500 }
    );
  }
}
