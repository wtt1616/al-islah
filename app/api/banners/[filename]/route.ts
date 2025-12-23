import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

// GET - Serve banner image
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;

    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filepath = path.join(process.cwd(), 'public', 'uploads', 'banners', filename);

    const fileBuffer = await readFile(filepath);

    // Determine content type
    let contentType = 'image/jpeg';
    if (filename.endsWith('.png')) {
      contentType = 'image/png';
    } else if (filename.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (filename.endsWith('.gif')) {
      contentType = 'image/gif';
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving banner:', error);
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to serve banner' }, { status: 500 });
  }
}
