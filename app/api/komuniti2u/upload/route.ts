import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, chmod } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'komuniti2u-secret-key';

export const dynamic = 'force-dynamic';

// Verify seller token
function verifySeller(request: NextRequest): { id: number; email: string; nama: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; nama: string };
    return decoded;
  } catch {
    return null;
  }
}

// POST - Upload image
export async function POST(request: NextRequest) {
  try {
    const seller = verifySeller(request);
    if (!seller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'komuniti2u');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${seller.id}_${timestamp}_${randomStr}.${extension}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Set file permissions to be readable by all (644)
    await chmod(filePath, 0o644);

    // Return the public URL via API route (for dynamic serving)
    const imageUrl = `/api/uploads/komuniti2u/${filename}`;

    return NextResponse.json({
      success: true,
      url: imageUrl,
      message: 'Gambar berjaya dimuat naik'
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
