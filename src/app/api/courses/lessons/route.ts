import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function POST(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const courseId = body.courseId ?? body.course_id;
    const moduleId = body.moduleId ?? body.module_id;
    const title = body.title;
    const description = body.description || '';
    const videoUrl = (body.videoUrl ?? body.video_url ?? '').trim();
    const duration = body.duration || '';
    const notes = body.notes || '';
    const attachments = body.attachments || '[]';
    const sortOrder = body.sortOrder ?? body.sort_order ?? 0;

    if (!courseId || !moduleId || !title) {
      return NextResponse.json({ error: 'courseId, moduleId, and title are required' }, { status: 400 });
    }

    const attachmentsJson = typeof attachments === 'string' ? attachments : JSON.stringify(attachments);
    const createdAt = new Date().toISOString();

    const res = await client.execute({
      sql: `INSERT INTO course_lessons (course_id, module_id, title, description, video_url, duration, notes, attachments, completed, sort_order, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      args: [courseId, moduleId, title, description, videoUrl, duration, notes, attachmentsJson, sortOrder, createdAt],
    });

    return NextResponse.json({ success: true, lessonId: Number(res.lastInsertRowid) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { id, title, description, notes, attachments, completed, sortOrder, sort_order } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const videoUrl = body.videoUrl !== undefined ? body.videoUrl : body.video_url;
    const duration = body.duration;

    const fields: string[] = [];
    const args: any[] = [];

    if (title !== undefined) { fields.push('title = ?'); args.push(title); }
    if (description !== undefined) { fields.push('description = ?'); args.push(description); }
    if (videoUrl !== undefined) { fields.push('video_url = ?'); args.push(videoUrl.trim()); }
    if (duration !== undefined) { fields.push('duration = ?'); args.push(duration); }
    if (notes !== undefined) { fields.push('notes = ?'); args.push(notes); }
    if (attachments !== undefined) {
      const attachmentsJson = typeof attachments === 'string' ? attachments : JSON.stringify(attachments);
      fields.push('attachments = ?');
      args.push(attachmentsJson);
    }
    if (completed !== undefined) {
      const isCompleted = completed ? 1 : 0;
      fields.push('completed = ?');
      args.push(isCompleted);

      // Also update course_progress
      if (isCompleted) {
        const lessonRes = await client.execute({ sql: `SELECT course_id FROM course_lessons WHERE id = ?`, args: [id] });
        if (lessonRes.rows.length > 0) {
          const cId = lessonRes.rows[0].course_id;
          await client.execute({
            sql: `INSERT INTO course_progress (course_id, lesson_id, user_id, completed, completed_at)
                  VALUES (?, ?, 'owner', 1, ?)
                  ON CONFLICT DO NOTHING`,
            args: [cId, id, new Date().toISOString()],
          }).catch(() => {});
        }
      } else {
        await client.execute({
          sql: `DELETE FROM course_progress WHERE lesson_id = ? AND user_id = 'owner'`,
          args: [id],
        }).catch(() => {});
      }
    }
    const sOrder = sortOrder !== undefined ? sortOrder : sort_order;
    if (sOrder !== undefined) { fields.push('sort_order = ?'); args.push(sOrder); }

    if (fields.length === 0) return NextResponse.json({ success: true });

    args.push(id);
    await client.execute({ sql: `UPDATE course_lessons SET ${fields.join(', ')} WHERE id = ?`, args });
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
    await client.execute({ sql: `DELETE FROM course_progress WHERE lesson_id = ?`, args: [id] });
    await client.execute({ sql: `DELETE FROM course_lessons WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
