import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const availabilityId = parseInt(params.id);
    const sessionUserId = (session.user as any).id;

    // First, check if this availability entry belongs to the current user
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id FROM availability WHERE id = ?',
      [availabilityId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
    }

    const availabilityUserId = rows[0].user_id;

    // Only allow users to delete their own availability entries
    // Use loose equality to handle number/string type differences
    if (availabilityUserId != sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the availability entry
    await pool.execute(
      'DELETE FROM availability WHERE id = ?',
      [availabilityId]
    );

    return NextResponse.json({
      message: 'Availability removed successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting availability:', error);
    return NextResponse.json({
      error: 'Failed to delete availability',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
