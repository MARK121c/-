import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getUserIdFromRequest, toggleUserProgress } from '@/backend/lib/userProgress';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function deleteFile(filePath: string) {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to delete file:', e); }
  }
}

export async function GET(req: NextRequest) {
  const client = getClient();
  const subjectId = new URL(req.url).searchParams.get('subject_id');
  try {
    let sql = `SELECT * FROM academic_videos`;
    const args: any[] = [];
    if (subjectId) {
      sql += ` WHERE subject_id = ?`;
      args.push(subjectId);
    }
    sql += ` ORDER BY sort_order ASC, id ASC`;
    const res = await client.execute({ sql, args });
    return NextResponse.json({ success: true, videos: res.rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = getClient();
  try {
    const contentType = req.headers.get('content-type') || '';
    let title = '';
    let description = '';
    let subjectId = '';
    let videoUrl = '';
    let videoType = 'youtube';
    let duration = '';
    let materialDate = '';
    let filePath = '';
    let createdBy = 'owner';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      title = (formData.get('title') as string) || '';
      description = (formData.get('description') as string) || '';
      subjectId = (formData.get('subject_id') as string) || '';
      videoUrl = (formData.get('video_url') as string) || '';
      videoType = (formData.get('video_type') as string) || 'youtube';
      duration = (formData.get('duration') as string) || '';
      materialDate = (formData.get('material_date') as string) || new Date().toISOString().split('T')[0];
      createdBy = (formData.get('created_by') as string) || 'owner';

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        videoType = 'upload';
        const ext = path.extname(file.name);
        const uniqueName = `${randomUUID()}${ext}`;
        const targetPath = path.join(uploadDir, uniqueName);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.promises.writeFile(targetPath, buffer);
        filePath = `/uploads/videos/${uniqueName}`;
      }
    } else {
      const body = await req.json();
      title = body.title || '';
      description = body.description || '';
      subjectId = body.subject_id || '';
      videoUrl = body.video_url || '';
      videoType = body.video_type || 'youtube';
      duration = body.duration || '';
      materialDate = body.material_date || new Date().toISOString().split('T')[0];
      createdBy = body.created_by || 'owner';
      filePath = body.file_path || '';
    }

    if (!title || !subjectId) {
      return NextResponse.json({ success: false, error: 'Title and Subject ID are required' }, { status: 400 });
    }

    const maxOrderRes = await client.execute({
      sql: `SELECT MAX(sort_order) as max FROM academic_videos WHERE subject_id = ?`,
      args: [subjectId]
    });
    const nextOrder = (Number(maxOrderRes.rows[0]?.max) || 0) + 1;
    const now = new Date().toISOString();

    const insertRes = await client.execute({
      sql: `INSERT INTO academic_videos (subject_id, title, description, video_url, file_path, video_type, duration, material_date, upload_timestamp, completed, sort_order, created_by, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1)`,
      args: [subjectId, title, description, videoUrl, filePath, videoType, duration, materialDate, now, nextOrder, createdBy]
    });

    const itemRes = await client.execute({
      sql: `SELECT * FROM academic_videos WHERE id = ?`,
      args: [insertRes.lastInsertRowid!]
    });

    return NextResponse.json({ success: true, video: itemRes.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { id, title, description, video_url, video_type, duration, material_date } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const itemRes = await client.execute({ sql: `SELECT * FROM academic_videos WHERE id = ?`, args: [id] });
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });

    await client.execute({
      sql: `UPDATE academic_videos SET title = ?, description = ?, video_url = ?, video_type = ?, duration = ?, material_date = ? WHERE id = ?`,
      args: [
        title || item.title,
        description !== undefined ? description : item.description,
        video_url !== undefined ? video_url : item.video_url,
        video_type || item.video_type,
        duration !== undefined ? duration : item.duration,
        material_date || item.material_date,
        id
      ]
    });

    const updated = await client.execute({ sql: `SELECT * FROM academic_videos WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true, video: updated.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { id, toggle } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const itemRes = await client.execute({ sql: `SELECT * FROM academic_videos WHERE id = ?`, args: [id] });
    if (!itemRes.rows[0]) return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });

    const userId = await getUserIdFromRequest(req);
    const explicitCompleted = toggle !== undefined ? undefined : (body.completed ? true : false);
    const newCompleted = await toggleUserProgress(client, userId, 'video', Number(id), explicitCompleted);

    return NextResponse.json({ success: true, completed: newCompleted });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const client = getClient();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

  try {
    const itemRes = await client.execute({ sql: `SELECT * FROM academic_videos WHERE id = ?`, args: [id] });
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });

    const { handleGuardedDeletion } = await import('@/backend/lib/deletionGuard');

    return await handleGuardedDeletion(
      req,
      client,
      {
        itemType: 'video',
        itemId: Number(id),
        itemTitle: String(item.title || `فيديو #${id}`),
        reason: 'طلب حذف فيديو / محاضرة مسجلة',
      },
      async () => {
        if (item.file_path) {
          const fullDiskPath = path.join(process.cwd(), 'public', String(item.file_path).replace(/^\//, ''));
          deleteFile(fullDiskPath);
        }
        await client.execute({ sql: `DELETE FROM academic_videos WHERE id = ?`, args: [id] });
      }
    );
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
