import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

// GET - Get all products for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'head_imam'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [products] = await pool.query<RowDataPacket[]>(`
      SELECT p.*, s.nama as seller_nama, s.no_tel as seller_no_tel, s.is_active as seller_is_active,
             c.nama as category_nama
      FROM k2u_products p
      JOIN k2u_sellers s ON p.seller_id = s.id
      JOIN k2u_categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// PUT - Update product status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'head_imam'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, is_active } = body;

    if (!id || is_active === undefined) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await pool.query(
      'UPDATE k2u_products SET is_active = ? WHERE id = ?',
      [is_active, id]
    );

    return NextResponse.json({ success: true, message: 'Status produk dikemaskini' });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - Delete product (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'head_imam'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM k2u_products WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Produk tidak dijumpai' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Produk berjaya dipadam' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
