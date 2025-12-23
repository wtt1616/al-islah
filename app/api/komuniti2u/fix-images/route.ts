import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Fix image URLs in database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'head_imam'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update gambar1
    await pool.query(`
      UPDATE k2u_products
      SET gambar1 = REPLACE(gambar1, '/uploads/', '/api/uploads/')
      WHERE gambar1 LIKE '/uploads/%'
    `);

    // Update gambar2
    await pool.query(`
      UPDATE k2u_products
      SET gambar2 = REPLACE(gambar2, '/uploads/', '/api/uploads/')
      WHERE gambar2 LIKE '/uploads/%'
    `);

    // Update gambar3
    await pool.query(`
      UPDATE k2u_products
      SET gambar3 = REPLACE(gambar3, '/uploads/', '/api/uploads/')
      WHERE gambar3 LIKE '/uploads/%'
    `);

    return NextResponse.json({
      success: true,
      message: 'Image URLs updated successfully'
    });
  } catch (error) {
    console.error('Error fixing image URLs:', error);
    return NextResponse.json({ error: 'Failed to fix image URLs' }, { status: 500 });
  }
}
