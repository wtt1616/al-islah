import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'komuniti2u-secret-key';

// Helper to verify seller token
function verifySeller(request: NextRequest): { id: number; email: string; nama: string } | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string; nama: string };
  } catch {
    return null;
  }
}

export const dynamic = 'force-dynamic';

// GET - Get products (public or seller's own)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sellerId = searchParams.get('seller_id');
    const myProducts = searchParams.get('my_products');

    let query = `
      SELECT p.*, s.nama as seller_nama, s.no_tel as seller_no_tel, s.alamat as seller_alamat,
             c.nama as category_nama, c.icon as category_icon
      FROM k2u_products p
      JOIN k2u_sellers s ON p.seller_id = s.id
      JOIN k2u_categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // If fetching own products, verify seller
    if (myProducts === 'true') {
      const seller = verifySeller(request);
      if (!seller) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      query += ' AND p.seller_id = ?';
      params.push(seller.id);
    } else {
      // Public view - only show active products from active sellers
      query += ' AND p.is_active = TRUE AND s.is_active = TRUE';

      if (sellerId) {
        query += ' AND p.seller_id = ?';
        params.push(sellerId);
      }
    }

    if (category && category !== 'all') {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.nama LIKE ? OR p.keterangan LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC';

    const [products] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Create new product (seller only)
export async function POST(request: NextRequest) {
  try {
    const seller = verifySeller(request);
    if (!seller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if seller is active
    const [sellerCheck] = await pool.query<RowDataPacket[]>(
      'SELECT is_active FROM k2u_sellers WHERE id = ?',
      [seller.id]
    );

    if (sellerCheck.length === 0 || !sellerCheck[0].is_active) {
      return NextResponse.json({ error: 'Akaun anda telah dinyahaktifkan' }, { status: 403 });
    }

    const body = await request.json();
    const { nama, keterangan, harga, category_id, gambar1, gambar2, gambar3 } = body;

    if (!nama || !harga || !category_id) {
      return NextResponse.json(
        { error: 'Sila lengkapkan nama produk, harga dan kategori' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO k2u_products (seller_id, category_id, nama, keterangan, harga, gambar1, gambar2, gambar3)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [seller.id, category_id, nama, keterangan || null, harga, gambar1 || null, gambar2 || null, gambar3 || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Produk berjaya ditambah',
      product_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// PUT - Update product (seller only)
export async function PUT(request: NextRequest) {
  try {
    const seller = verifySeller(request);
    if (!seller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, nama, keterangan, harga, category_id, gambar1, gambar2, gambar3, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if product belongs to seller
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM k2u_products WHERE id = ? AND seller_id = ?',
      [id, seller.id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Produk tidak dijumpai' }, { status: 404 });
    }

    await pool.query(
      `UPDATE k2u_products SET
        nama = COALESCE(?, nama),
        keterangan = ?,
        harga = COALESCE(?, harga),
        category_id = COALESCE(?, category_id),
        gambar1 = ?,
        gambar2 = ?,
        gambar3 = ?,
        is_active = COALESCE(?, is_active)
       WHERE id = ? AND seller_id = ?`,
      [nama, keterangan, harga, category_id, gambar1, gambar2, gambar3, is_active, id, seller.id]
    );

    return NextResponse.json({ success: true, message: 'Produk berjaya dikemaskini' });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - Delete product (seller only)
export async function DELETE(request: NextRequest) {
  try {
    const seller = verifySeller(request);
    if (!seller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Delete only if belongs to seller
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM k2u_products WHERE id = ? AND seller_id = ?',
      [id, seller.id]
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
