import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getUserIdFromRequest, toggleUserProgress } from '@/backend/lib/userProgress';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'lectures');
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
    let sql = `SELECT * FROM academic_lectures`;
    const args: any[] = [];
    if (subjectId) {
      sql += ` WHERE subject_id = ?`;
      args.push(subjectId);
    }
    sql += ` ORDER BY sort_order ASC, id ASC`;
    const res = await client.execute({ sql, args });
    return NextResponse.json({ success: true, lectures: res.rows });
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
    let materialDate = '';
    let filePath = '';
    let fileName = '';
    let fileSize = 0;
    let createdBy = 'owner';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      title = (formData.get('title') as string) || '';
      description = (formData.get('description') as string) || '';
      subjectId = (formData.get('subject_id') as string) || '';
      materialDate = (formData.get('material_date') as string) || new Date().toISOString().split('T')[0];
      createdBy = (formData.get('created_by') as string) || 'owner';

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        fileName = file.name;
        fileSize = file.size;
        const ext = path.extname(file.name);
        const uniqueName = `${randomUUID()}${ext}`;
        const targetPath = path.join(uploadDir, uniqueName);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.promises.writeFile(targetPath, buffer);
        filePath = `/uploads/lectures/${uniqueName}`;
      }
    } else {
      const body = await req.json();
      title = body.title || '';
      description = body.description || '';
      subjectId = body.subject_id || '';
      materialDate = body.material_date || new Date().toISOString().split('T')[0];
      createdBy = body.created_by || 'owner';
      filePath = body.file_path || '';
      fileName = body.file_name || '';
      fileSize = body.file_size || 0;
    }

    if (!title || !subjectId) {
      return NextResponse.json({ success: false, error: 'Title and Subject ID are required' }, { status: 400 });
    }

    const maxOrderRes = await client.execute({
      sql: `SELECT MAX(sort_order) as max FROM academic_lectures WHERE subject_id = ?`,
      args: [subjectId]
    });
    const nextOrder = (Number(maxOrderRes.rows[0]?.max) || 0) + 1;
    const now = new Date().toISOString();

    const insertRes = await client.execute({
      sql: `INSERT INTO academic_lectures (subject_id, title, description, file_path, file_name, file_size, material_date, upload_timestamp, completed, sort_order, created_by, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1)`,
      args: [subjectId, title, description, filePath, fileName, fileSize, materialDate, now, nextOrder, createdBy]
    });

    const itemRes = await client.execute({
      sql: `SELECT * FROM academic_lectures WHERE id = ?`,
      args: [insertRes.lastInsertRowid!]
    });

    return NextResponse.json({ success: true, lecture: itemRes.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { id, title, description, material_date } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const itemRes = await client.execute({ sql: `SELECT * FROM academic_lectures WHERE id = ?`, args: [id] });
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ success: false, error: 'Lecture not found' }, { status: 404 });

    const filePath = body.file_path !== undefined ? body.file_path : (body.url !== undefined ? body.url : item.file_path);

    await client.execute({
      sql: `UPDATE academic_lectures SET title = ?, description = ?, material_date = ?, file_path = ? WHERE id = ?`,
      args: [
        title || item.title,
        description !== undefined ? description : item.description,
        material_date || item.material_date,
        filePath || '',
        id
      ]
    });

    const updated = await client.execute({ sql: `SELECT * FROM academic_lectures WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true, lecture: updated.rows[0] });
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

    const itemRes = await client.execute({ sql: `SELECT * FROM academic_lectures WHERE id = ?`, args: [id] });
    if (!itemRes.rows[0]) return NextResponse.json({ success: false, error: 'Lecture not found' }, { status: 404 });

    const userId = await getUserIdFromRequest(req);
    const explicitCompleted = toggle !== undefined ? undefined : (body.completed ? true : false);
    const newCompleted = await toggleUserProgress(client, userId, 'lecture', Number(id), explicitCompleted);

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
    const itemRes = await client.execute({ sql: `SELECT * FROM academic_lectures WHERE id = ?`, args: [id] });
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ success: false, error: 'Lecture not found' }, { status: 404 });

    if (item.file_path) {
      const fullDiskPath = path.join(process.cwd(), 'public', String(item.file_path).replace(/^\//, ''));
      deleteFile(fullDiskPath);
    }

    await client.execute({ sql: `DELETE FROM academic_lectures WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
