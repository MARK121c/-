import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getUserSession, handleGuardedDeletion } from '@/backend/lib/deletionGuard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET(req: NextRequest) {
  const client = getClient();
  try {
    const term = req.nextUrl.searchParams.get('term') || 'term1';
    const day = req.nextUrl.searchParams.get('day');

    let sql = `SELECT * FROM academic_schedule WHERE 1=1`;
    const args: any[] = [];

    if (term && term !== 'all') {
      sql += ` AND term = ?`;
      args.push(term);
    }
    if (day && day !== 'all') {
      sql += ` AND day_of_week = ?`;
      args.push(day);
    }

    sql += ` ORDER BY CASE day_of_week
      WHEN 'السبت' THEN 1
      WHEN 'الأحد' THEN 2
      WHEN 'الإثنين' THEN 3
      WHEN 'الثلاثاء' THEN 4
      WHEN 'الأربعاء' THEN 5
      WHEN 'الخميس' THEN 6
      WHEN 'الجمعة' THEN 7
      ELSE 8 END, start_time ASC`;

    const res = await client.execute({ sql, args });
    return NextResponse.json({ success: true, schedule: res.rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const client = getClient();
  try {
    const body = await req.json();
    const {
      term = 'term1',
      subject_id,
      subject_name,
      item_type = 'lecture',
      day_of_week,
      start_time,
      end_time,
      location,
      instructor = '',
      takes_attendance = 1,
      importance = 'high',
      required_tools = '[]',
      notes = ''
    } = body;

    if (!subject_name || !day_of_week || !start_time || !end_time || !location) {
      return NextResponse.json({ success: false, error: 'Subject name, day, times, and location are required' }, { status: 400 });
    }

    const toolsStr = typeof required_tools === 'string' ? required_tools : JSON.stringify(required_tools);
    const now = new Date().toISOString();

    const insertRes = await client.execute({
      sql: `
        INSERT INTO academic_schedule 
        (term, subject_id, subject_name, item_type, day_of_week, start_time, end_time, location, instructor, takes_attendance, importance, required_tools, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        term,
        subject_id || null,
        subject_name,
        item_type,
        day_of_week,
        start_time,
        end_time,
        location,
        instructor,
        takes_attendance ? 1 : 0,
        importance,
        toolsStr,
        notes,
        now
      ]
    });

    const item = await client.execute({
      sql: `SELECT * FROM academic_schedule WHERE id = ?`,
      args: [insertRes.lastInsertRowid!]
    });

    return NextResponse.json({ success: true, scheduleItem: item.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const client = getClient();
  try {
    const body = await req.json();
    const {
      id,
      term,
      subject_id,
      subject_name,
      item_type,
      day_of_week,
      start_time,
      end_time,
      location,
      instructor,
      takes_attendance,
      importance,
      required_tools,
      notes
    } = body;

    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const existingRes = await client.execute({ sql: `SELECT * FROM academic_schedule WHERE id = ?`, args: [id] });
    const existing = existingRes.rows[0];
    if (!existing) return NextResponse.json({ success: false, error: 'Schedule item not found' }, { status: 404 });

    const toolsStr = required_tools !== undefined ? (typeof required_tools === 'string' ? required_tools : JSON.stringify(required_tools)) : existing.required_tools;

    await client.execute({
      sql: `
        UPDATE academic_schedule SET
          term = ?,
          subject_id = ?,
          subject_name = ?,
          item_type = ?,
          day_of_week = ?,
          start_time = ?,
          end_time = ?,
          location = ?,
          instructor = ?,
          takes_attendance = ?,
          importance = ?,
          required_tools = ?,
          notes = ?
        WHERE id = ?
      `,
      args: [
        term !== undefined ? term : existing.term,
        subject_id !== undefined ? subject_id : existing.subject_id,
        subject_name || existing.subject_name,
        item_type || existing.item_type,
        day_of_week || existing.day_of_week,
        start_time || existing.start_time,
        end_time || existing.end_time,
        location || existing.location,
        instructor !== undefined ? instructor : existing.instructor,
        takes_attendance !== undefined ? (takes_attendance ? 1 : 0) : existing.takes_attendance,
        importance || existing.importance,
        toolsStr,
        notes !== undefined ? notes : existing.notes,
        id
      ]
    });

    const updated = await client.execute({ sql: `SELECT * FROM academic_schedule WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true, scheduleItem: updated.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const client = getClient();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

  try {
    const itemRes = await client.execute({ sql: `SELECT * FROM academic_schedule WHERE id = ?`, args: [id] });
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ success: false, error: 'Schedule item not found' }, { status: 404 });

    return await handleGuardedDeletion(
      req,
      client,
      {
        itemType: 'schedule',
        itemId: Number(id),
        itemTitle: `${item.subject_name} (${item.day_of_week} ${item.start_time})`,
        reason: 'طلب حذف محاضرة من جدول الكلية',
      },
      async () => {
        await client.execute({ sql: `DELETE FROM academic_schedule WHERE id = ?`, args: [id] });
      }
    );
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
