import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

interface CustomRole extends RowDataPacket {
  id: number;
  role_key: string;
  role_label: string;
  category: 'pengguna_dalaman' | 'petugas';
  is_active: boolean;
}

// System roles (cannot be deleted)
const systemRoles = {
  pengguna_dalaman: [
    { value: 'admin', label: 'Admin', isSystem: true },
    { value: 'bendahari', label: 'Bendahari', isSystem: true },
    { value: 'aset', label: 'Pegawai Aset', isSystem: true },
    { value: 'pegawai', label: 'Pegawai', isSystem: true },
  ],
  petugas: [
    { value: 'head_imam', label: 'Ketua Imam', isSystem: true },
    { value: 'imam', label: 'Imam', isSystem: true },
    { value: 'bilal', label: 'Bilal', isSystem: true },
    { value: 'imam_jumaat', label: 'Imam Jumaat', isSystem: true },
    { value: 'bilal_jumaat', label: 'Bilal Jumaat', isSystem: true },
    { value: 'penceramah', label: 'Penceramah', isSystem: true },
  ],
};

// GET - Fetch all available roles (system + custom)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch active custom roles from database
    const [customRoles] = await pool.query<CustomRole[]>(
      'SELECT * FROM custom_roles WHERE is_active = TRUE ORDER BY category, role_label'
    );

    // Combine system roles with custom roles
    const penggunaDalaman = [
      ...systemRoles.pengguna_dalaman,
      ...customRoles
        .filter(r => r.category === 'pengguna_dalaman')
        .map(r => ({
          value: r.role_key,
          label: r.role_label,
          isSystem: false,
        })),
    ];

    const petugas = [
      ...systemRoles.petugas,
      ...customRoles
        .filter(r => r.category === 'petugas')
        .map(r => ({
          value: r.role_key,
          label: r.role_label,
          isSystem: false,
        })),
    ];

    return NextResponse.json({
      pengguna_dalaman: penggunaDalaman,
      petugas: petugas,
      all: [...penggunaDalaman, ...petugas],
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}
