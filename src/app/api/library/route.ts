import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET() {
  const client = getClient();
  try {
    const res = await client.execute(`SELECT * FROM resources ORDER BY created_at DESC`);
    return NextResponse.json({ resources: res.rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = getClient();
  const body = await req.json();
  const { title, type, url, thumbnail, category, notes } = body;
  const createdAt = new Date().toISOString();

  try {
    await client.execute({
      sql: `INSERT INTO resources (title, type, url, thumbnail, category, status, notes, created_at) 
            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
      args: [title, type, url, thumbnail, category, notes, createdAt]
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const client = getClient();
  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  try {
    await client.execute({
      sql: `UPDATE resources SET status = ? WHERE id = ?`,
      args: [status, id]
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
    await client.execute({ sql: `DELETE FROM resources WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
