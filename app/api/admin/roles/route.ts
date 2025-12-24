import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Fetch all users with their roles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userType = searchParams.get('user_type');

    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.user_type, u.role, u.is_active, u.created_at, u.updated_at,
             GROUP_CONCAT(ur.role) as additional_roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userType && userType !== 'all') {
      query += ' AND u.user_type = ?';
      params.push(userType);
    }

    query += ' GROUP BY u.id ORDER BY u.user_type, u.role, u.name';

    const [users] = await pool.query<RowDataPacket[]>(query, params);

    // Parse additional_roles from comma-separated string to array
    // Filter out empty strings to prevent issues
    const usersWithRoles = users.map((user: any) => ({
      ...user,
      roles: user.additional_roles
        ? user.additional_roles.split(',').filter((r: string) => r && r.trim() !== '')
        : (user.role ? [user.role] : [])
    }));

    return NextResponse.json({ data: usersWithRoles });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PUT - Update user role
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, user_type, role, roles, additional_petugas_roles } = body;

    if (!user_id || !user_type) {
      return NextResponse.json(
        { error: 'user_id and user_type are required' },
        { status: 400 }
      );
    }

    // Validate user_type and role combination
    const internalRoles = ['admin', 'bendahari', 'aset', 'pegawai'];
    const petugasRoles = ['imam', 'bilal', 'imam_jumaat', 'bilal_jumaat', 'penceramah', 'head_imam'];

    // Get custom roles from database
    const [customRolesResult] = await pool.query<RowDataPacket[]>(
      'SELECT role_key, category FROM custom_roles WHERE is_active = TRUE'
    );
    const customInternalRoles = customRolesResult.filter(r => r.category === 'pengguna_dalaman').map(r => r.role_key);
    const customPetugasRoles = customRolesResult.filter(r => r.category === 'petugas').map(r => r.role_key);

    // Combined roles
    const allInternalRoles = [...internalRoles, ...customInternalRoles];
    const allPetugasRoles = [...petugasRoles, ...customPetugasRoles];

    // Prevent admin from changing their own role to non-admin
    const currentUserId = (session.user as any).id;

    if (user_type === 'pengguna_dalaman') {
      // For pengguna dalaman, one or more internal roles are allowed
      // Filter out empty strings to prevent issues
      const rawRoles = roles || (role ? [role] : []);
      const selectedRoles = rawRoles.filter((r: string) => r && r.trim() !== '');

      if (selectedRoles.length === 0) {
        return NextResponse.json(
          { error: 'Sekurang-kurangnya satu peranan diperlukan' },
          { status: 400 }
        );
      }

      // Validate all roles are internal roles
      for (const r of selectedRoles) {
        if (!allInternalRoles.includes(r)) {
          return NextResponse.json(
            { error: `Peranan tidak sah untuk pengguna dalaman: ${r}` },
            { status: 400 }
          );
        }
      }

      // Prevent admin from removing their own admin role
      if (user_id === currentUserId && !selectedRoles.includes('admin')) {
        return NextResponse.json(
          { error: 'Anda tidak boleh menukar peranan anda sendiri dari admin' },
          { status: 400 }
        );
      }

      // Set primary role (first role)
      const primaryRole = selectedRoles[0];

      await pool.query(
        'UPDATE users SET user_type = ?, role = ?, updated_at = NOW() WHERE id = ?',
        [user_type, primaryRole, user_id]
      );

      // Update user_roles table - delete existing and insert new internal roles
      await pool.query('DELETE FROM user_roles WHERE user_id = ?', [user_id]);

      // Insert all selected internal roles
      for (const r of selectedRoles) {
        await pool.query(
          'INSERT INTO user_roles (user_id, role) VALUES (?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)',
          [user_id, r]
        );
      }

      // Also insert any additional petugas roles if provided
      if (additional_petugas_roles && Array.isArray(additional_petugas_roles) && additional_petugas_roles.length > 0) {
        for (const r of additional_petugas_roles) {
          if (allPetugasRoles.includes(r)) {
            await pool.query(
              'INSERT INTO user_roles (user_id, role) VALUES (?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)',
              [user_id, r]
            );
          }
        }
      }

    } else if (user_type === 'petugas') {
      // For petugas, multiple roles are allowed
      // Filter out empty strings to prevent issues
      const rawRoles = roles || (role ? [role] : []);
      const selectedRoles = rawRoles.filter((r: string) => r && r.trim() !== '');

      console.log('Petugas update - selectedRoles:', selectedRoles);
      console.log('Petugas update - allPetugasRoles:', allPetugasRoles);

      if (selectedRoles.length === 0) {
        return NextResponse.json(
          { error: 'At least one role is required for petugas' },
          { status: 400 }
        );
      }

      // Validate all roles
      for (const r of selectedRoles) {
        if (!allPetugasRoles.includes(r)) {
          console.log('Invalid role found:', r);
          return NextResponse.json(
            { error: `Peranan tidak sah untuk petugas: ${r}` },
            { status: 400 }
          );
        }
      }

      // Set primary role (first role or the one passed)
      const primaryRole = selectedRoles[0];

      await pool.query(
        'UPDATE users SET user_type = ?, role = ?, updated_at = NOW() WHERE id = ?',
        [user_type, primaryRole, user_id]
      );

      // Update user_roles table - delete existing and insert new
      await pool.query('DELETE FROM user_roles WHERE user_id = ?', [user_id]);

      // Insert all selected roles
      for (const r of selectedRoles) {
        await pool.query(
          'INSERT INTO user_roles (user_id, role) VALUES (?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)',
          [user_id, r]
        );
      }
    }

    return NextResponse.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
