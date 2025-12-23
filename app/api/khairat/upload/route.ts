import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

// POST - Upload receipt file for khairat registration (Public - no auth required)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('resit') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Fail resit diperlukan' },
        { status: 400 }
      );
    }

    // Validate file type (images and PDF)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Jenis fail tidak sah. Hanya JPEG, PNG, WebP dan PDF dibenarkan' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Saiz fail melebihi had 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `resit-${timestamp}-${randomStr}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'khairat');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Save file
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return the API path for serving uploaded files (works in production)
    const filePath = `/api/uploads/khairat/${filename}`;

    return NextResponse.json({
      success: true,
      message: 'Fail resit berjaya dimuat naik',
      filePath
    });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    return NextResponse.json(
      { error: 'Gagal memuat naik fail resit' },
      { status: 500 }
    );
  }
}
