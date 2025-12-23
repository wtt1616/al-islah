import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET all inventory items
export async function GET(request: NextRequest) {
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
      ORDER BY i.created_at DESC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST - Create new inventory item
export async function POST(request: NextRequest) {
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

    // Check if no_siri_pendaftaran already exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM inventory WHERE no_siri_pendaftaran = ?',
      [no_siri_pendaftaran]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'No Siri Pendaftaran already exists' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO inventory (no_siri_pendaftaran, keterangan, cara_diperolehi, created_by)
       VALUES (?, ?, ?, ?)`,
      [no_siri_pendaftaran, keterangan, cara_diperolehi, userId]
    );

    return NextResponse.json({
      message: 'Inventory item created successfully',
      id: (result as any).insertId,
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}
