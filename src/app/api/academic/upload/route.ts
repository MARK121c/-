import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Only image files allowed' }, { status: 400 });
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = file.name || 'cover.png';
    const ext = path.extname(originalName) || '.png';
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `cover-${baseName}-${Date.now()}${ext.toLowerCase()}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'covers');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/covers/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueName,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error('Cover upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
  }
}
