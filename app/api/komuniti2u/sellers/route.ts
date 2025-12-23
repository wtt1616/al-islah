import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'komuniti2u-secret-key';

export const dynamic = 'force-dynamic';

// GET - Get all sellers (admin only) or seller profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin');

    // Admin view - requires admin session
    if (adminView === 'true') {
      const session = await getServerSession(authOptions);
      if (!session || !['admin', 'head_imam'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const [sellers] = await pool.query<RowDataPacket[]>(`
        SELECT s.*,
               (SELECT COUNT(*) FROM k2u_products WHERE seller_id = s.id) as product_count
        FROM k2u_sellers s
        ORDER BY s.created_at DESC
      `);

      return NextResponse.json(sellers);
    }

    // Seller profile - requires seller token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

      const [sellers] = await pool.query<RowDataPacket[]>(
        'SELECT id, nama, email, no_tel, alamat, is_active, created_at FROM k2u_sellers WHERE id = ?',
        [decoded.id]
      );

      if (sellers.length === 0) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
      }

      return NextResponse.json(sellers[0]);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return NextResponse.json({ error: 'Failed to fetch sellers' }, { status: 500 });
  }
}

// PUT - Update seller (admin or seller themselves)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_active, nama, no_tel, alamat } = body;

    // Check if admin request
    const session = await getServerSession(authOptions);
    if (session && ['admin', 'head_imam'].includes(session.user.role)) {
      // Admin can update is_active status
      if (id && is_active !== undefined) {
        await pool.query(
          'UPDATE k2u_sellers SET is_active = ? WHERE id = ?',
          [is_active, id]
        );
        return NextResponse.json({ success: true, message: 'Status penjual dikemaskini' });
      }
    }

    // Seller updating own profile
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

      await pool.query(
        `UPDATE k2u_sellers SET
          nama = COALESCE(?, nama),
          no_tel = COALESCE(?, no_tel),
          alamat = COALESCE(?, alamat)
         WHERE id = ?`,
        [nama, no_tel, alamat, decoded.id]
      );

      return NextResponse.json({ success: true, message: 'Profil dikemaskini' });
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating seller:', error);
    return NextResponse.json({ error: 'Failed to update seller' }, { status: 500 });
  }
}

// DELETE - Delete seller and their products (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'head_imam'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
    }

    // Delete seller (cascade will delete products)
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM k2u_sellers WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Penjual tidak dijumpai' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Penjual dan produk berjaya dipadam' });
  } catch (error) {
    console.error('Error deleting seller:', error);
    return NextResponse.json({ error: 'Failed to delete seller' }, { status: 500 });
  }
}
