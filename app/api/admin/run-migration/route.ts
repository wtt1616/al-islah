import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// POST - Run database migration (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { migration } = body;

    if (migration === 'add_pemohon_info_to_aktiviti') {
      const columns = [
        { name: 'no_handphone', sql: "ALTER TABLE aktiviti_surau ADD COLUMN no_handphone VARCHAR(20) NULL AFTER penganjur" },
        { name: 'anggaran_jemputan', sql: "ALTER TABLE aktiviti_surau ADD COLUMN anggaran_jemputan INT NULL AFTER no_handphone" },
        { name: 'peralatan', sql: "ALTER TABLE aktiviti_surau ADD COLUMN peralatan JSON NULL AFTER anggaran_jemputan" },
        { name: 'peralatan_lain', sql: "ALTER TABLE aktiviti_surau ADD COLUMN peralatan_lain VARCHAR(255) NULL AFTER peralatan" }
      ];

      const results: string[] = [];

      for (const col of columns) {
        try {
          await pool.execute(col.sql);
          results.push(`Added column: ${col.name}`);
        } catch (err: any) {
          if (err.code === 'ER_DUP_FIELDNAME') {
            results.push(`Column ${col.name} already exists, skipping...`);
          } else {
            throw err;
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Migration completed',
        results
      });
    }

    if (migration === 'add_preacher_schedule_banners') {
      const columns = [
        { name: 'subuh_banner', sql: "ALTER TABLE preacher_schedules ADD COLUMN subuh_banner VARCHAR(500) NULL" },
        { name: 'dhuha_banner', sql: "ALTER TABLE preacher_schedules ADD COLUMN dhuha_banner VARCHAR(500) NULL" },
        { name: 'maghrib_banner', sql: "ALTER TABLE preacher_schedules ADD COLUMN maghrib_banner VARCHAR(500) NULL" },
        { name: 'friday_banner', sql: "ALTER TABLE preacher_schedules ADD COLUMN friday_banner VARCHAR(500) NULL" },
        { name: 'friday_dhuha_banner', sql: "ALTER TABLE preacher_schedules ADD COLUMN friday_dhuha_banner VARCHAR(500) NULL" }
      ];

      const results: string[] = [];

      for (const col of columns) {
        try {
          await pool.execute(col.sql);
          results.push(`Added column: ${col.name}`);
        } catch (err: any) {
          if (err.code === 'ER_DUP_FIELDNAME') {
            results.push(`Column ${col.name} already exists, skipping...`);
          } else {
            throw err;
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Migration completed',
        results
      });
    }

    return NextResponse.json({ error: 'Unknown migration' }, { status: 400 });
  } catch (error: any) {
    console.error('Error running migration:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
