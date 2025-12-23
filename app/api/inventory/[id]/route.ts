import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET single inventory item
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
        i.id,
        i.no_siri_pendaftaran,
        i.keterangan,
        i.cara_diperolehi,
        i.created_by,
        i.modified_by,
        i.created_at,
        i.updated_at,
        creator.name as creator_name,
        modifier.name as modifier_name
      FROM inventory i
      LEFT JOIN users creator ON i.created_by = creator.id
      LEFT JOIN users modifier ON i.modified_by = modifier.id
      WHERE i.id = ?`,
      [params.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory item' },
      { status: 500 }
    );
  }
}

// PUT - Update inventory item
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
      'SELECT id FROM inventory WHERE no_siri_pendaftaran = ? AND id != ?',
      [no_siri_pendaftaran, params.id]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'No Siri Pendaftaran already exists' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `UPDATE inventory
       SET no_siri_pendaftaran = ?, keterangan = ?, cara_diperolehi = ?, modified_by = ?
       WHERE id = ?`,
      [no_siri_pendaftaran, keterangan, cara_diperolehi, userId, params.id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Inventory item updated successfully' });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete inventory item
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
      'DELETE FROM inventory WHERE id = ?',
      [params.id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}
