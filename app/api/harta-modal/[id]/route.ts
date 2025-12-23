import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET single harta modal item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        h.id,
        h.no_siri_pendaftaran,
        h.keterangan,
        h.cara_diperolehi,
        h.created_by,
        h.modified_by,
        h.created_at,
        h.updated_at,
        creator.name as creator_name,
        modifier.name as modifier_name
      FROM harta_modal h
      LEFT JOIN users creator ON h.created_by = creator.id
      LEFT JOIN users modifier ON h.modified_by = modifier.id
      WHERE h.id = ?`,
      [params.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Harta modal item not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching harta modal item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch harta modal item' },
      { status: 500 }
    );
  }
}

// PUT - Update harta modal item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (userRole !== 'admin' && userRole !== 'inventory_staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { no_siri_pendaftaran, keterangan, cara_diperolehi } = body;

    if (!no_siri_pendaftaran || !keterangan || !cara_diperolehi) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Check if no_siri_pendaftaran already exists for different item
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM harta_modal WHERE no_siri_pendaftaran = ? AND id != ?',
      [no_siri_pendaftaran, params.id]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'No Siri Pendaftaran already exists' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `UPDATE harta_modal
       SET no_siri_pendaftaran = ?, keterangan = ?, cara_diperolehi = ?, modified_by = ?
       WHERE id = ?`,
      [no_siri_pendaftaran, keterangan, cara_diperolehi, userId, params.id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Harta modal item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Harta modal item updated successfully' });
  } catch (error) {
    console.error('Error updating harta modal item:', error);
    return NextResponse.json(
      { error: 'Failed to update harta modal item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete harta modal item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (userRole !== 'admin' && userRole !== 'inventory_staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM harta_modal WHERE id = ?',
      [params.id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Harta modal item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Harta modal item deleted successfully' });
  } catch (error) {
    console.error('Error deleting harta modal item:', error);
    return NextResponse.json(
      { error: 'Failed to delete harta modal item' },
      { status: 500 }
    );
  }
}
