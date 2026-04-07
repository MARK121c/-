import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

// POST /api/tasks/complete-day
export async function POST(req: NextRequest) {
  const client = getClient();
  const today = new Date().toISOString().split('T')[0];
  const body = await req.json().catch(() => ({}));

  try {
    // Count today's tasks
    const todayTasks = await client.execute(`SELECT * FROM tasks WHERE type = 'today'`);
    const tasks = todayTasks.rows;
    const total = tasks.length;
    const done = tasks.filter((r: any) => (r.status ?? r[2]) === 'done').length;
    const coreDone = tasks.filter((r: any) => (r.status ?? r[2]) === 'done' && !(r.is_sub_task ?? r[8])).length;
    
    const focusScore = total > 0
      ? Math.min(100, Math.round((done / total) * 70 + (coreDone >= 3 ? 30 : (coreDone / 3) * 30)))
      : 0;

    // Calculate streak
    const prevLog = await client.execute({
      sql: `SELECT streak_day, date FROM daily_logs WHERE date = ? LIMIT 1`,
      args: [new Date(Date.now() - 86400000).toISOString().split('T')[0]]
    });
    const prevStreak = prevLog.rows.length > 0 
      ? ((prevLog.rows[0] as any).streak_day ?? (prevLog.rows[0] as any)[6] ?? 0) 
      : 0;
    const newStreak = coreDone >= 3 ? prevStreak + 1 : 0;

    await client.execute({
      sql: `INSERT INTO daily_logs (date, completed_tasks, total_tasks, completed_core, focus_score, streak_day, closed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
              completed_tasks = excluded.completed_tasks,
              total_tasks = excluded.total_tasks,
              completed_core = excluded.completed_core,
              focus_score = excluded.focus_score,
              streak_day = excluded.streak_day,
              closed_at = excluded.closed_at`,
      args: [today, done, total, coreDone, focusScore, newStreak, new Date().toISOString()],
    });

    return NextResponse.json({ success: true, focusScore, streak: newStreak, coreDone, done, total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
