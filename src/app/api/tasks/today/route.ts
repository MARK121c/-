import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


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

    // VIRTUAL INJECTION: Add today's events as tasks
    const eventsRes = await client.execute(`SELECT e.*, p.name as person_name FROM events e LEFT JOIN people p ON e.person_id = p.id`);
    const currentMonth = todayObj.getMonth() + 1;
    const currentDay = todayObj.getDate();
    
    const virtualEvents = eventsRes.rows.map((r: any) => {
       const eventDate = new Date(r.date ?? r[3]);
       const m = eventDate.getMonth() + 1;
       const d = eventDate.getDate();
       const repeat = r.repeat ?? r[4];
       const type = r.type ?? r[2];
       let isToday = false;
       if (repeat === 'yearly') isToday = (m === currentMonth && d === currentDay);
       else if (repeat === 'monthly') isToday = (d === currentDay);
       else isToday = (r.date === today);

       if (isToday) {
          return {
             id: `event-${r.id}`,
             title: `${type === 'birthday' ? '🎂 عيد ميلاد' : '📅 موعد'}: ${r.title}${r.person_name ? ` (${r.person_name})` : ''}`,
             status: 'pending', // Events are always pending unless logged
             type: 'today',
             priority: 'critical',
             estimatedTime: 15,
             isSubTask: false,
             isEvent: true
          };
       }
       return null;
    }).filter(e => e !== null);

    const tasksWithEvents = [...coreTasks, ...virtualEvents];

    const completedCore = tasksWithEvents.filter((t: any) => t.status === 'done').length;
    const completedTotal = [...tasksWithEvents, ...subTasks].filter((t: any) => t.status === 'done').length;
    const totalTasks = tasksWithEvents.length + subTasks.length;
    
    const focusScore = totalTasks > 0
      ? Math.min(100, Math.round(
          (completedTotal / totalTasks) * 70 +
          (completedCore >= (tasksWithEvents.length) ? 30 : (completedCore / tasksWithEvents.length) * 30)
        ))
      : 0;

    return NextResponse.json({
      log: log ? {
        date: log.date ?? log[1], completedTasks: log.completed_tasks ?? log[2],
        totalTasks: log.total_tasks ?? log[3], completedCore: log.completed_core ?? log[4],
        focusScore: log.focus_score ?? log[5], streakDay: log.streak_day ?? log[6],
      } : null,
      streak,
      todayStats: { coreTasks: tasksWithEvents, subTasks, tasks: [...tasksWithEvents, ...subTasks], completedCore, completedTotal, totalTasks, focusScore },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
