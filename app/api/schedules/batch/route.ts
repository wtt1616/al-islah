import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (userRole !== 'head_imam' && userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: updates array required' },
        { status: 400 }
      );
    }

    // Validate all updates before processing
    for (const update of updates) {
      if (!update.id) {
        return NextResponse.json(
          { error: 'Invalid update: id is required' },
          { status: 400 }
        );
      }
      // imam_id and bilal_id can be null (for vacant slots) but must be defined
      if (update.imam_id === undefined || update.bilal_id === undefined) {
        return NextResponse.json(
          { error: 'Invalid update: imam_id and bilal_id must be specified (can be null for vacant)' },
          { status: 400 }
        );
      }
    }

    const userId = (session.user as any).id;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let successCount = 0;
      const errors: string[] = [];

      for (const update of updates) {
        try {
          const [result] = await connection.execute<RowDataPacket[]>(
            `UPDATE schedules
             SET imam_id = ?, bilal_id = ?, is_auto_generated = FALSE, modified_by = ?
             WHERE id = ?`,
            [update.imam_id, update.bilal_id, userId, update.id]
          );

          if ((result as any).affectedRows > 0) {
            successCount++;
          } else {
            errors.push(`Schedule ${update.id} not found`);
          }
        } catch (error) {
          console.error(`Error updating schedule ${update.id}:`, error);
          errors.push(`Failed to update schedule ${update.id}`);
        }
      }

      await connection.commit();

      return NextResponse.json({
        message: `Successfully updated ${successCount} of ${updates.length} schedules`,
        successCount,
        totalCount: updates.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in batch update:', error);
    return NextResponse.json(
      { error: 'Failed to update schedules' },
      { status: 500 }
    );
  }
}
