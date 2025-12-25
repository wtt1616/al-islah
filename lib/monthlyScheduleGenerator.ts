import pool from './db';
import { RowDataPacket } from 'mysql2';
import { PrayerTime, MonthlyPetugasRole } from '@/types';

const PRAYER_TIMES: PrayerTime[] = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];

interface ActiveUser {
  id: number;
  name: string;
}

interface ScheduleEntry {
  schedule_date: string;
  schedule_type: 'prayer' | 'tadabbur' | 'tahsin' | 'imam_jumaat';
  prayer_time: PrayerTime | null;
  petugas_id: number | null;
  petugas_role: MonthlyPetugasRole;
  month_number: number;
  year: number;
  is_auto_generated: boolean;
  created_by: number;
}

// Helper function to format date as YYYY-MM-DD
function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get all days in a month
function getDaysInMonth(month: number, year: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month - 1, 1); // month is 1-indexed

  while (date.getMonth() === month - 1) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return days;
}

// Get active users by role (checks both primary role and user_roles table)
async function getActiveUsersByRole(role: string): Promise<ActiveUser[]> {
  const [users] = await pool.execute<RowDataPacket[]>(
    `SELECT DISTINCT u.id, u.name
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     WHERE u.is_active = TRUE
       AND (u.role = ? OR ur.role = ?)
     ORDER BY u.name`,
    [role, role]
  );
  return users as ActiveUser[];
}

// Select user with least assignments for fair distribution
function selectLeastAssigned(
  users: ActiveUser[],
  assignmentMap: Map<number, number>
): ActiveUser | null {
  if (users.length === 0) return null;

  return users.reduce((least, current) => {
    const leastCount = assignmentMap.get(least.id) || 0;
    const currentCount = assignmentMap.get(current.id) || 0;
    return currentCount < leastCount ? current : least;
  });
}

// Initialize assignment counter
function initializeAssignments(users: ActiveUser[]): Map<number, number> {
  const map = new Map<number, number>();
  users.forEach(user => map.set(user.id, 0));
  return map;
}

// Update assignment counter
function updateAssignment(map: Map<number, number>, userId: number): void {
  map.set(userId, (map.get(userId) || 0) + 1);
}

export async function generateMonthlySchedule(
  month: number,
  year: number,
  createdBy: number
): Promise<ScheduleEntry[]> {
  const schedules: ScheduleEntry[] = [];
  const daysInMonth = getDaysInMonth(month, year);

  // Fetch all active personnel by role
  const imams = await getActiveUsersByRole('imam');
  const bilals = await getActiveUsersByRole('bilal');
  const siaks = await getActiveUsersByRole('siak');
  const petugasTadabbur = await getActiveUsersByRole('tadabbur');
  const petugasTahsin = await getActiveUsersByRole('tahsin');
  const imamJumaat = await getActiveUsersByRole('imam_jumaat');

  // Check if we have enough personnel
  if (imams.length === 0) {
    throw new Error('Tiada Imam aktif ditemui. Sila daftarkan Imam terlebih dahulu.');
  }
  if (bilals.length === 0) {
    throw new Error('Tiada Bilal aktif ditemui. Sila daftarkan Bilal terlebih dahulu.');
  }

  // Initialize assignment counters for fair distribution
  const imamAssignments = initializeAssignments(imams);
  const bilalAssignments = initializeAssignments(bilals);
  const siakAssignments = initializeAssignments(siaks);
  const tadabburAssignments = initializeAssignments(petugasTadabbur);
  const tahsinAssignments = initializeAssignments(petugasTahsin);
  const imamJumaatAssignments = initializeAssignments(imamJumaat);

  // Generate schedules for each day
  for (const date of daysInMonth) {
    const dateStr = formatDateOnly(date);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday

    // 1. Generate 5 Prayer Schedules (Daily)
    for (const prayerTime of PRAYER_TIMES) {
      // Assign Imam
      const selectedImam = selectLeastAssigned(imams, imamAssignments);
      if (selectedImam) {
        updateAssignment(imamAssignments, selectedImam.id);
        schedules.push({
          schedule_date: dateStr,
          schedule_type: 'prayer',
          prayer_time: prayerTime,
          petugas_id: selectedImam.id,
          petugas_role: 'imam',
          month_number: month,
          year: year,
          is_auto_generated: true,
          created_by: createdBy
        });
      }

      // Assign Bilal
      const selectedBilal = selectLeastAssigned(bilals, bilalAssignments);
      if (selectedBilal) {
        updateAssignment(bilalAssignments, selectedBilal.id);
        schedules.push({
          schedule_date: dateStr,
          schedule_type: 'prayer',
          prayer_time: prayerTime,
          petugas_id: selectedBilal.id,
          petugas_role: 'bilal',
          month_number: month,
          year: year,
          is_auto_generated: true,
          created_by: createdBy
        });
      }

      // Assign Siak
      if (siaks.length > 0) {
        const selectedSiak = selectLeastAssigned(siaks, siakAssignments);
        if (selectedSiak) {
          updateAssignment(siakAssignments, selectedSiak.id);
          schedules.push({
            schedule_date: dateStr,
            schedule_type: 'prayer',
            prayer_time: prayerTime,
            petugas_id: selectedSiak.id,
            petugas_role: 'siak',
            month_number: month,
            year: year,
            is_auto_generated: true,
            created_by: createdBy
          });
        }
      }
    }

    // 2. Generate Tadabbur Schedule (Monday-Friday only, dayOfWeek 1-5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && petugasTadabbur.length > 0) {
      const selectedTadabbur = selectLeastAssigned(petugasTadabbur, tadabburAssignments);
      if (selectedTadabbur) {
        updateAssignment(tadabburAssignments, selectedTadabbur.id);
        schedules.push({
          schedule_date: dateStr,
          schedule_type: 'tadabbur',
          prayer_time: null,
          petugas_id: selectedTadabbur.id,
          petugas_role: 'tadabbur',
          month_number: month,
          year: year,
          is_auto_generated: true,
          created_by: createdBy
        });
      }
    }

    // 3. Generate Tahsin Schedule (Daily)
    if (petugasTahsin.length > 0) {
      const selectedTahsin = selectLeastAssigned(petugasTahsin, tahsinAssignments);
      if (selectedTahsin) {
        updateAssignment(tahsinAssignments, selectedTahsin.id);
        schedules.push({
          schedule_date: dateStr,
          schedule_type: 'tahsin',
          prayer_time: null,
          petugas_id: selectedTahsin.id,
          petugas_role: 'tahsin',
          month_number: month,
          year: year,
          is_auto_generated: true,
          created_by: createdBy
        });
      }
    }

    // 4. Generate Imam Jumaat Schedule (Friday only, dayOfWeek 5)
    if (dayOfWeek === 5 && imamJumaat.length > 0) {
      const selectedImamJumaat = selectLeastAssigned(imamJumaat, imamJumaatAssignments);
      if (selectedImamJumaat) {
        updateAssignment(imamJumaatAssignments, selectedImamJumaat.id);
        schedules.push({
          schedule_date: dateStr,
          schedule_type: 'imam_jumaat',
          prayer_time: null,
          petugas_id: selectedImamJumaat.id,
          petugas_role: 'imam_jumaat',
          month_number: month,
          year: year,
          is_auto_generated: true,
          created_by: createdBy
        });
      }
    }
  }

  return schedules;
}

// Get distribution statistics for a month
export function getDistributionStats(schedules: ScheduleEntry[]): {
  imam: Map<number, number>;
  bilal: Map<number, number>;
  siak: Map<number, number>;
  tadabbur: Map<number, number>;
  tahsin: Map<number, number>;
  imam_jumaat: Map<number, number>;
} {
  const stats = {
    imam: new Map<number, number>(),
    bilal: new Map<number, number>(),
    siak: new Map<number, number>(),
    tadabbur: new Map<number, number>(),
    tahsin: new Map<number, number>(),
    imam_jumaat: new Map<number, number>()
  };

  for (const schedule of schedules) {
    if (schedule.petugas_id) {
      const role = schedule.petugas_role;
      const map = stats[role];
      map.set(schedule.petugas_id, (map.get(schedule.petugas_id) || 0) + 1);
    }
  }

  return stats;
}
