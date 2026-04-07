import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function POST(req: NextRequest) {
  const client = getClient();
  const body = await req.json();
  const { routineId, stepId, completed } = body;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    if (completed) {
      await client.execute({
        sql: `INSERT INTO routine_step_logs (routine_id, step_id, date, completed) VALUES (?, ?, ?, 1)`,
        args: [routineId, stepId, todayStr]
      });
    } else {
      await client.execute({
        sql: `DELETE FROM routine_step_logs WHERE step_id = ? AND date = ?`,
        args: [stepId, todayStr]
      });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
