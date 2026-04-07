import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

// GET /api/tasks/today — get today's log + streak info
export async function GET() {
  const client = getClient();
  const today = new Date().toISOString().split('T')[0];

  try {
    const logRes = await client.execute({
      sql: `SELECT * FROM daily_logs WHERE date = ? LIMIT 1`,
      args: [today],
    });
    const log = logRes.rows[0] ?? null;

    // Count streak
    const allLogs = await client.execute(`SELECT date, completed_core FROM daily_logs ORDER BY date DESC`);
    let streak = 0;
    const todayObj = new Date(today);
    for (let i = 0; i < allLogs.rows.length; i++) {
      const r = allLogs.rows[i] as any;
      const logDate = new Date(r.date ?? r[1]);
      const dayDiff = Math.round((todayObj.getTime() - logDate.getTime()) / 86400000);
      if (dayDiff === i && (r.completed_core ?? r[4]) >= 3) {
        streak++;
      } else if (dayDiff !== i) {
        break;
      }
    }

    const todayTasks = await client.execute(`SELECT * FROM tasks WHERE type = 'today' ORDER BY is_sub_task ASC, position ASC`);
    const tasks = todayTasks.rows.map((r: any) => ({
      id: r.id ?? r[0], title: r.title ?? r[1], status: r.status ?? r[2],
      type: r.type ?? r[3], priority: r.priority ?? r[4],
      estimatedTime: r.estimated_time ?? r[5], dayOfWeek: r.day_of_week ?? r[6],
      position: r.position ?? r[7], isSubTask: !!(r.is_sub_task ?? r[8]),
      date: r.date ?? r[9], completedAt: r.completed_at ?? r[10],
    }));

    const coreTasks = tasks.filter((t: any) => !t.isSubTask);
    const subTasks = tasks.filter((t: any) => t.isSubTask);
    const completedCore = coreTasks.filter((t: any) => t.status === 'done').length;
    const completedTotal = tasks.filter((t: any) => t.status === 'done').length;
    const totalTasks = tasks.length;
    const focusScore = totalTasks > 0
      ? Math.min(100, Math.round(
          (completedTotal / totalTasks) * 70 +
          (completedCore >= 3 ? 30 : (completedCore / 3) * 30)
        ))
      : 0;

    return NextResponse.json({
      log: log ? {
        date: log.date ?? log[1], completedTasks: log.completed_tasks ?? log[2],
        totalTasks: log.total_tasks ?? log[3], completedCore: log.completed_core ?? log[4],
        focusScore: log.focus_score ?? log[5], streakDay: log.streak_day ?? log[6],
      } : null,
      streak,
      todayStats: { coreTasks, subTasks, tasks, completedCore, completedTotal, totalTasks, focusScore },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
