import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { ResultSetHeader } from 'mysql2';

// POST - Upload preacher photo (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can upload preacher photos' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const preacherId = formData.get('preacherId') as string;
    const file = formData.get('photo') as File;

    if (!preacherId) {
      return NextResponse.json(
        { error: 'Preacher ID is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Photo file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 2MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `preacher-${preacherId}-${timestamp}.${fileExtension}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/preachers directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'preachers');
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    // Get old photo path to delete later
    const [existingPreacher] = await pool.query<any[]>(
      'SELECT photo FROM preachers WHERE id = ?',
      [preacherId]
    );

    const oldPhoto = existingPreacher[0]?.photo;

    // Update database with photo path
    const photoPath = `/uploads/preachers/${filename}`;
    await pool.query<ResultSetHeader>(
      'UPDATE preachers SET photo = ? WHERE id = ?',
      [photoPath, preacherId]
    );

    // Delete old photo if exists
    if (oldPhoto) {
      try {
        const oldFilePath = path.join(process.cwd(), 'public', oldPhoto);
        await unlink(oldFilePath);
      } catch (error) {
        // Ignore if old file doesn't exist
        console.log('Could not delete old photo:', error);
      }
    }

    return NextResponse.json({
      message: 'Photo uploaded successfully',
      photoPath
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

// DELETE - Remove preacher photo (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can delete preacher photos' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const preacherId = searchParams.get('preacherId');

    if (!preacherId) {
      return NextResponse.json(
        { error: 'Preacher ID is required' },
        { status: 400 }
      );
    }

    // Get photo path
    const [preacher] = await pool.query<any[]>(
      'SELECT photo FROM preachers WHERE id = ?',
      [preacherId]
    );

    const photoPath = preacher[0]?.photo;

    if (!photoPath) {
      return NextResponse.json(
        { error: 'No photo found for this preacher' },
        { status: 404 }
      );
    }

    // Delete file
    const filepath = path.join(process.cwd(), 'public', photoPath);
    await unlink(filepath);

    // Update database
    await pool.query<ResultSetHeader>(
      'UPDATE preachers SET photo = NULL WHERE id = ?',
      [preacherId]
    );

    return NextResponse.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
