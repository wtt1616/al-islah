import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir, chmod } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

// Maximum dimensions for banner (Instagram story format)
const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1920;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const QUALITY = 85;

// POST - Upload banner image with auto-resize
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'head_imam') {
      return NextResponse.json({ error: 'Unauthorized - Only Head Imam can upload banners' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('banner') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Jenis fail tidak dibenarkan. Sila gunakan JPEG, PNG, WebP atau GIF.'
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: 'Saiz fail terlalu besar. Maksimum 5MB.'
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image with sharp - auto-resize if needed
    let processedBuffer: Buffer;
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Check if resize is needed
      let needsResize = false;
      let resizeOptions: { width?: number; height?: number } = {};

      if (metadata.width && metadata.width > MAX_WIDTH) {
        needsResize = true;
        resizeOptions.width = MAX_WIDTH;
      }
      if (metadata.height && metadata.height > MAX_HEIGHT) {
        needsResize = true;
        resizeOptions.height = MAX_HEIGHT;
      }

      if (needsResize) {
        processedBuffer = await image
          .resize({
            ...resizeOptions,
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: QUALITY })
          .toBuffer();
      } else {
        // Just optimize without resizing
        processedBuffer = await image
          .jpeg({ quality: QUALITY })
          .toBuffer();
      }
    } catch (err) {
      console.error('Error processing image:', err);
      return NextResponse.json({
        error: 'Gagal memproses gambar. Sila cuba lagi.'
      }, { status: 500 });
    }

    // Create upload directory if not exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'banners');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `banner_${timestamp}_${randomStr}.jpg`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    await writeFile(filepath, processedBuffer);

    // Set file permissions to 755 (readable by all)
    await chmod(filepath, 0o755);

    // Return URL - use API route to serve dynamically uploaded files
    const url = `/api/banners/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      message: 'Banner berjaya dimuat naik'
    });

  } catch (error: any) {
    console.error('Error uploading banner:', error);
    return NextResponse.json({
      error: error.message || 'Gagal memuat naik banner'
    }, { status: 500 });
  }
}
