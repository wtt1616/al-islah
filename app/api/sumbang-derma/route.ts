import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

interface SumbangDermaRow extends RowDataPacket {
  id: number;
  nama: string;
  alamat: string;
  telefon: string;
  keterangan: string;
  image_url: string | null;
  status: 'menunggu' | 'lulus';
  created_at: Date;
  approved_at: Date | null;
  approved_by: number | null;
}

// Ensure table exists
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sumbang_derma (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      alamat TEXT NOT NULL,
      telefon VARCHAR(50) NOT NULL,
      keterangan TEXT NOT NULL,
      image_url VARCHAR(500) NULL,
      status ENUM('menunggu', 'lulus') DEFAULT 'menunggu',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_at TIMESTAMP NULL,
      approved_by INT NULL,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

// GET - Fetch all sumbang derma (public can see, but with different info)
export async function GET(request: NextRequest) {
  try {
    await ensureTable();

    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';

    // Check if admin view is requested
    if (adminView) {
      const session = await getServerSession(authOptions);
      if (!session || !['admin', 'bendahari'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Admin sees all including pending
      const [rows] = await pool.query<SumbangDermaRow[]>(`
        SELECT sd.*, u.name as approved_by_name
        FROM sumbang_derma sd
        LEFT JOIN users u ON sd.approved_by = u.id
        ORDER BY sd.created_at DESC
      `);

      return NextResponse.json({ data: rows });
    }

    // Public view - show all (both pending and approved)
    const [rows] = await pool.query<SumbangDermaRow[]>(`
      SELECT id, nama, alamat, telefon, keterangan, image_url, status, created_at
      FROM sumbang_derma
      ORDER BY
        CASE WHEN status = 'lulus' THEN 0 ELSE 1 END,
        created_at DESC
    `);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching sumbang derma:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Create new sumbang derma (public can submit)
export async function POST(request: NextRequest) {
  try {
    await ensureTable();

    const formData = await request.formData();
    const nama = formData.get('nama') as string;
    const alamat = formData.get('alamat') as string;
    const telefon = formData.get('telefon') as string;
    const keterangan = formData.get('keterangan') as string;
    const image = formData.get('image') as File | null;

    if (!nama || !alamat || !telefon || !keterangan) {
      return NextResponse.json({ error: 'Semua maklumat wajib diisi' }, { status: 400 });
    }

    let imageUrl: string | null = null;

    // Handle image upload
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'sumbang-derma');
      await mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const ext = image.name.split('.').pop();
      const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filepath = path.join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      imageUrl = `/api/uploads/sumbang-derma/${filename}`;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO sumbang_derma (nama, alamat, telefon, keterangan, image_url, status)
       VALUES (?, ?, ?, ?, ?, 'menunggu')`,
      [nama, alamat, telefon, keterangan, imageUrl]
    );

    return NextResponse.json({
      success: true,
      message: 'Permohonan sumbangan berjaya dihantar',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating sumbang derma:', error);
    return NextResponse.json({ error: 'Gagal menghantar permohonan' }, { status: 500 });
  }
}

// PUT - Update status or edit record (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle FormData for edit with image upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const id = formData.get('id') as string;
      const nama = formData.get('nama') as string;
      const alamat = formData.get('alamat') as string;
      const telefon = formData.get('telefon') as string;
      const keterangan = formData.get('keterangan') as string;
      const image = formData.get('image') as File | null;

      if (!id || !nama || !alamat || !telefon || !keterangan) {
        return NextResponse.json({ error: 'Semua maklumat wajib diisi' }, { status: 400 });
      }

      let imageUrl: string | null = null;

      // Handle image upload if new image is provided
      if (image && image.size > 0) {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'sumbang-derma');
        await mkdir(uploadsDir, { recursive: true });

        const timestamp = Date.now();
        const ext = image.name.split('.').pop();
        const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        await writeFile(filepath, buffer);
        imageUrl = `/api/uploads/sumbang-derma/${filename}`;

        await pool.query(
          `UPDATE sumbang_derma SET nama = ?, alamat = ?, telefon = ?, keterangan = ?, image_url = ? WHERE id = ?`,
          [nama, alamat, telefon, keterangan, imageUrl, id]
        );
      } else {
        await pool.query(
          `UPDATE sumbang_derma SET nama = ?, alamat = ?, telefon = ?, keterangan = ? WHERE id = ?`,
          [nama, alamat, telefon, keterangan, id]
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Rekod telah dikemaskini'
      });
    }

    // Handle JSON for approve action
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'approve') {
      await pool.query(
        `UPDATE sumbang_derma
         SET status = 'lulus', approved_at = NOW(), approved_by = ?
         WHERE id = ?`,
        [session.user.id, id]
      );

      return NextResponse.json({
        success: true,
        message: 'Permohonan telah diluluskan'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating sumbang derma:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE - Delete entry (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    await pool.query('DELETE FROM sumbang_derma WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Permohonan telah dipadam' });
  } catch (error) {
    console.error('Error deleting sumbang derma:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
