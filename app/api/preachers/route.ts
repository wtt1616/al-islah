import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { encrypt, decrypt } from '@/lib/encryption';

// GET - Fetch all preachers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Only admin and head_imam can view full preacher details
    const userRole = session.user.role;
    const canViewSensitiveData = userRole === 'admin' || userRole === 'head_imam';

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Only include sensitive fields (nama_bank, no_akaun) for authorized roles
    let query = canViewSensitiveData
      ? 'SELECT id, name, phone, email, photo, nama_bank, no_akaun, is_active, created_at FROM preachers'
      : 'SELECT id, name, phone, email, photo, is_active, created_at FROM preachers';

    if (activeOnly) {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY name ASC';

    const [preachers] = await pool.query<RowDataPacket[]>(query);

    // Get base URL for constructing absolute photo URLs
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Convert photo paths to absolute URLs
    const formattedPreachers = preachers.map(preacher => {
      const formatPhotoUrl = (photo: string | null) => {
        if (!photo) return null;
        // If photo is already an absolute URL, return as is
        if (photo.startsWith('http://') || photo.startsWith('https://')) {
          return photo;
        }
        // If photo starts with /, it's a relative path from root
        if (photo.startsWith('/')) {
          return `${baseUrl}${photo}`;
        }
        // Otherwise, assume it's just filename, prepend /uploads/preachers/
        return `${baseUrl}/uploads/preachers/${photo}`;
      };

      return {
        ...preacher,
        photo: formatPhotoUrl(preacher.photo),
        // Decrypt no_akaun if present (only for authorized users who can see it)
        no_akaun: preacher.no_akaun ? decrypt(preacher.no_akaun) : null
      };
    });

    return NextResponse.json({ preachers: formattedPreachers });
  } catch (error) {
    console.error('Error fetching preachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preachers' },
      { status: 500 }
    );
  }
}

// POST - Create new preacher (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can add preachers' },
        { status: 403 }
      );
    }

    const { name, phone, email, nama_bank, no_akaun } = await request.json();

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if email already exists (if email provided)
    if (email && email.trim() !== '') {
      const [existing] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM preachers WHERE email = ?',
        [email.trim()]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Encrypt bank account number if provided
    const encryptedNoAkaun = no_akaun?.trim() ? encrypt(no_akaun.trim()) : null;

    // Insert new preacher
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO preachers (name, phone, email, nama_bank, no_akaun, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [name.trim(), phone?.trim() || null, email?.trim() || null, nama_bank?.trim() || null, encryptedNoAkaun]
    );

    return NextResponse.json(
      {
        message: 'Preacher added successfully',
        preacherId: result.insertId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating preacher:', error);
    return NextResponse.json(
      { error: 'Failed to create preacher' },
      { status: 500 }
    );
  }
}

// PUT - Update preacher (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can update preachers' },
        { status: 403 }
      );
    }

    const { id, name, phone, email, nama_bank, no_akaun, is_active } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Preacher ID is required' },
        { status: 400 }
      );
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if email already exists for another preacher
    if (email && email.trim() !== '') {
      const [existing] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM preachers WHERE email = ? AND id != ?',
        [email.trim(), id]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Encrypt bank account number if provided
    const encryptedNoAkaun = no_akaun?.trim() ? encrypt(no_akaun.trim()) : null;

    // Update preacher
    await pool.query(
      'UPDATE preachers SET name = ?, phone = ?, email = ?, nama_bank = ?, no_akaun = ?, is_active = ? WHERE id = ?',
      [name.trim(), phone?.trim() || null, email?.trim() || null, nama_bank?.trim() || null, encryptedNoAkaun, is_active ? 1 : 0, id]
    );

    return NextResponse.json({ message: 'Preacher updated successfully' });
  } catch (error) {
    console.error('Error updating preacher:', error);
    return NextResponse.json(
      { error: 'Failed to update preacher' },
      { status: 500 }
    );
  }
}

// DELETE - Delete preacher (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can delete preachers' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Preacher ID is required' },
        { status: 400 }
      );
    }

    // Delete preacher (cascading will set foreign keys to NULL in schedules)
    await pool.query('DELETE FROM preachers WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Preacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting preacher:', error);
    return NextResponse.json(
      { error: 'Failed to delete preacher' },
      { status: 500 }
    );
  }
}
