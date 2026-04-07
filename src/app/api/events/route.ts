import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET() {
  const client = getClient();
  try {
    const res = await client.execute(`SELECT * FROM events ORDER BY date ASC`);
    return NextResponse.json({ events: res.rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = getClient();
  const body = await req.json();
  const { title, type, date, repeat, personId, reminderBeforeDays, notes } = body;

  try {
    await client.execute({
      sql: `INSERT INTO events (title, type, date, repeat, person_id, reminder_before_days, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [title, type, date, repeat, personId, reminderBeforeDays, notes]
    });
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
    await client.execute({ sql: `DELETE FROM events WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
