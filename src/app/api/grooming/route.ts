import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET(req: NextRequest) {
  const client = getClient();
  try {
    const res = await client.execute(`SELECT * FROM grooming_products ORDER BY id DESC`);
    const products = res.rows.map((r: any) => ({
      id: r.id ?? r[0],
      name: r.name ?? r[1],
      category: r.category ?? r[2],
      quantity: r.quantity ?? r[3],
      startDate: r.start_date ?? r[4],
      expiryDate: r.expiry_date ?? r[5],
      estimatedDurationDays: r.estimated_duration_days ?? r[6],
      usagePerDay: r.usage_per_day ?? r[7],
      reminderDaysBefore: r.reminder_days_before ?? r[8],
      linkedRoutines: r.linked_routines ? JSON.parse(r.linked_routines ?? r[9]) : [],
      status: r.status ?? r[10]
    }));
    return NextResponse.json({ products });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = getClient();
  const body = await req.json();
  const { name, category, quantity = 1, estimatedDurationDays = 30, usagePerDay = 1.0 } = body;
  const startDate = new Date().toISOString().split('T')[0];

  try {
    await client.execute({
      sql: `INSERT INTO grooming_products (name, category, quantity, start_date, estimated_duration_days, usage_per_day, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      args: [name, category, quantity, startDate, estimatedDurationDays, usagePerDay]
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
    await client.execute({ sql: `DELETE FROM grooming_products WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
