import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function POST(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { courseId, title, sortOrder = 0 } = body;
    if (!courseId || !title) return NextResponse.json({ error: 'courseId and title required' }, { status: 400 });

    const createdAt = new Date().toISOString();
    const res = await client.execute({
      sql: `INSERT INTO course_modules (course_id, title, sort_order, created_at) VALUES (?, ?, ?, ?)`,
      args: [courseId, title, sortOrder, createdAt],
    });

    return NextResponse.json({ success: true, moduleId: Number(res.lastInsertRowid) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { id, title, sortOrder } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const fields: string[] = [];
    const args: any[] = [];
    if (title !== undefined) { fields.push('title = ?'); args.push(title); }
    if (sortOrder !== undefined) { fields.push('sort_order = ?'); args.push(sortOrder); }

    args.push(id);
    await client.execute({ sql: `UPDATE course_modules SET ${fields.join(', ')} WHERE id = ?`, args });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const client = getClient();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    await client.execute({ sql: `DELETE FROM course_lessons WHERE module_id = ?`, args: [id] });
    await client.execute({ sql: `DELETE FROM course_modules WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
