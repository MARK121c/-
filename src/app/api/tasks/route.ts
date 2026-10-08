import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

// GET /api/tasks?type=inbox|today|weekly|all&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const client = getClient();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    let rows;
    if (type === 'all') {
      rows = await client.execute(`SELECT * FROM tasks ORDER BY position ASC, id ASC`);
    } else if (type === 'today') {
      rows = await client.execute(`SELECT * FROM tasks WHERE type = 'today' ORDER BY is_sub_task ASC, position ASC, id ASC`);
    } else if (type === 'weekly') {
      rows = await client.execute(`SELECT * FROM tasks WHERE type = 'weekly' ORDER BY day_of_week ASC, position ASC`);
    } else {
      rows = await client.execute({
        sql: `SELECT * FROM tasks WHERE type = ? ORDER BY position ASC, id DESC`,
        args: [type],
      });
    }

    const tasks = rows.rows.map((r: any) => ({
      id: r.id ?? r[0],
      title: r.title ?? r[1],
      status: r.status ?? r[2],
      type: r.type ?? r[3],
      priority: r.priority ?? r[4],
      estimatedTime: r.estimated_time ?? r[5],
      dayOfWeek: r.day_of_week ?? r[6],
      position: r.position ?? r[7],
      isSubTask: !!(r.is_sub_task ?? r[8]),
      date: r.date ?? r[9],
      completedAt: r.completed_at ?? r[10],
    }));

    return NextResponse.json({ tasks });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/tasks — create a new task
export async function POST(req: NextRequest) {
  const client = getClient();
  const body = await req.json();
  const { title, type = 'inbox', priority = 'medium', estimatedTime = 30, dayOfWeek, isSubTask = false, position = 0 } = body;
  const date = new Date().toISOString().split('T')[0];

  try {
    await client.execute({
      sql: `INSERT INTO tasks (title, status, type, priority, estimated_time, day_of_week, position, is_sub_task, date) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
      args: [title, type, priority, estimatedTime, dayOfWeek ?? null, position, isSubTask ? 1 : 0, date],
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/tasks — update a task
export async function PUT(req: NextRequest) {
  const client = getClient();
  const body = await req.json();
  const { id, status, type, priority, estimatedTime, dayOfWeek, isSubTask, position, title } = body;

  const fields: string[] = [];
  const args: any[] = [];

  if (title !== undefined) { fields.push('title = ?'); args.push(title); }
  if (status !== undefined) {
    fields.push('status = ?'); args.push(status);
    if (status === 'done') {
      fields.push('completed_at = ?');
      args.push(new Date().toISOString());
    } else {
      fields.push('completed_at = NULL');
    }
  }
  if (type !== undefined) { fields.push('type = ?'); args.push(type); }
  if (priority !== undefined) { fields.push('priority = ?'); args.push(priority); }
  if (estimatedTime !== undefined) { fields.push('estimated_time = ?'); args.push(estimatedTime); }
  if (dayOfWeek !== undefined) { fields.push('day_of_week = ?'); args.push(dayOfWeek); }
  if (isSubTask !== undefined) { fields.push('is_sub_task = ?'); args.push(isSubTask ? 1 : 0); }
  if (position !== undefined) { fields.push('position = ?'); args.push(position); }

  if (fields.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  args.push(id);

  try {
    await client.execute({ sql: `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, args });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/tasks?id=123
export async function DELETE(req: NextRequest) {
  const client = getClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    await client.execute({ sql: `DELETE FROM tasks WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
