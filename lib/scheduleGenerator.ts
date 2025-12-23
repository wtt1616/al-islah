import pool from './db';
import { RowDataPacket } from 'mysql2';
import { PrayerTime } from '@/types';

const PRAYER_TIMES: PrayerTime[] = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];

interface AvailableUser {
  id: number;
  name: string;
  role: 'imam' | 'bilal';
  lastAssignedDate?: Date;
  assignmentCount: number;
}

// Helper function to format date as YYYY-MM-DD without timezone issues
function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function generateWeeklySchedule(
  startDate: Date,
  createdBy: number
): Promise<any[]> {
  const schedules = [];
  const weekNumber = getWeekNumber(startDate);
  const year = startDate.getFullYear();

  // Get all imams and bilals
  const [imams] = await pool.execute<RowDataPacket[]>(
    "SELECT id, name FROM users WHERE role = 'imam' AND is_active = TRUE ORDER BY name"
  );
  const [bilals] = await pool.execute<RowDataPacket[]>(
    "SELECT id, name FROM users WHERE role = 'bilal' AND is_active = TRUE ORDER BY name"
  );

  if (imams.length === 0 || bilals.length === 0) {
    throw new Error('Not enough Imam or Bilal to generate schedule');
  }

  // Track assignments for fair distribution
  const imamAssignments = new Map<number, number>();
  const bilalAssignments = new Map<number, number>();

  imams.forEach((imam: any) => imamAssignments.set(imam.id, 0));
  bilals.forEach((bilal: any) => bilalAssignments.set(bilal.id, 0));

  // Fetch all unavailability for the entire week in one query
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const startDateStr = formatDateOnly(startDate);
  const endDateStr = formatDateOnly(endDate);

  const [allUnavailability] = await pool.execute<RowDataPacket[]>(
    `SELECT user_id, prayer_time, DATE_FORMAT(date, '%Y-%m-%d') as date_str
     FROM availability
     WHERE date BETWEEN ? AND ? AND is_available = FALSE`,
    [startDateStr, endDateStr]
  );

  // Build unavailability map by date and prayer time
  const unavailabilityByDate = new Map<string, Map<string, Set<number>>>();
  allUnavailability.forEach((item: any) => {
    if (!unavailabilityByDate.has(item.date_str)) {
      unavailabilityByDate.set(item.date_str, new Map());
    }
    const dateMap = unavailabilityByDate.get(item.date_str)!;
    if (!dateMap.has(item.prayer_time)) {
      dateMap.set(item.prayer_time, new Set());
    }
    dateMap.get(item.prayer_time)!.add(item.user_id);
  });

  // Generate schedule for 7 days (Wednesday to Tuesday)
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = formatDateOnly(currentDate);

    // Get unavailability for this date from the pre-fetched map
    const unavailableMap = unavailabilityByDate.get(dateStr) || new Map();

    // Assign for each prayer time
    for (const prayerTime of PRAYER_TIMES) {
      const unavailableUsers = unavailableMap.get(prayerTime) || new Set();

      // Get available imams and bilals
      const availableImams = imams.filter(
        (imam: any) => !unavailableUsers.has(imam.id)
      );
      const availableBilals = bilals.filter(
        (bilal: any) => !unavailableUsers.has(bilal.id)
      );

      if (availableImams.length === 0 || availableBilals.length === 0) {
        throw new Error(
          `Not enough available personnel for ${prayerTime} on ${dateStr}`
        );
      }

      // Select imam and bilal with least assignments
      const selectedImam = selectLeastAssigned(availableImams, imamAssignments);
      const selectedBilal = selectLeastAssigned(availableBilals, bilalAssignments);

      // Update assignment counts
      imamAssignments.set(selectedImam.id, imamAssignments.get(selectedImam.id)! + 1);
      bilalAssignments.set(selectedBilal.id, bilalAssignments.get(selectedBilal.id)! + 1);

      schedules.push({
        date: dateStr,
        prayer_time: prayerTime,
        imam_id: selectedImam.id,
        bilal_id: selectedBilal.id,
        week_number: weekNumber,
        year: year,
        is_auto_generated: true,
        created_by: createdBy
      });
    }
  }

  return schedules;
}

function selectLeastAssigned(users: any[], assignmentMap: Map<number, number>): any {
  return users.reduce((least, current) => {
    const leastCount = assignmentMap.get(least.id) || 0;
    const currentCount = assignmentMap.get(current.id) || 0;
    return currentCount < leastCount ? current : least;
  });
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getWednesday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Calculate days to Wednesday (day 3)
  const diff = day === 0 ? 3 : day <= 3 ? 3 - day : -(day - 3);
  const wednesday = new Date(d);
  wednesday.setDate(d.getDate() + diff);
  return wednesday;
}
