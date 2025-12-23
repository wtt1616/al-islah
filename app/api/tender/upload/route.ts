import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir, chmod, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// POST - Upload tender document (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('dokumen') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (PDF only for tender documents)
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Jenis fail tidak sah. Hanya fail PDF dibenarkan.' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Saiz fail terlalu besar. Maksimum 10MB dibenarkan.' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tender');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${randomStr}_${originalName}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Set file permissions to be readable by all (644)
    await chmod(filePath, 0o644);

    // Return the public URL via API route (for dynamic serving)
    const documentUrl = `/api/uploads/tender/${filename}`;

    return NextResponse.json({
      success: true,
      url: documentUrl,
      filename: filename,
      message: 'Dokumen berjaya dimuat naik'
    });
  } catch (error) {
    console.error('Error uploading tender document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}

// DELETE - Delete tender document (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename diperlukan' }, { status: 400 });
    }

    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'tender', sanitizedFilename);

    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    return NextResponse.json({ success: true, message: 'Dokumen berjaya dipadam' });
  } catch (error) {
    console.error('Error deleting tender document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
