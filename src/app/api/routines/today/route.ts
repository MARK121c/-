import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET(req: NextRequest) {
  const client = getClient();
  const dateObj = new Date();
  const todayStr = dateObj.toISOString().split('T')[0];
  const currentDayOfWeek = dateObj.getDay();

  try {
    const routinesRes = await client.execute(`SELECT * FROM routines WHERE is_active = 1`);
    
    // Filter purely for TODAY
    const todayRoutines = routinesRes.rows.filter((r: any) => {
      const type = r.type ?? r[2];
      const daysStr = r.days_of_week ?? r[5];
      if (type === 'daily') return true;
      if (type === 'weekly' && daysStr) {
        try {
          const days = JSON.parse(daysStr);
          if (days.includes(currentDayOfWeek)) return true;
        } catch(e) {}
      }
      return false;
    });

    const routineIds = todayRoutines.map((r: any) => Number(r.id ?? r[0]));

    if (routineIds.length === 0) {
      return NextResponse.json({ todayRoutines: [], score: 0, totalRequired: 0, completedRequired: 0 });
    }

    const placeholders = routineIds.map(() => '?').join(',');
    const stepsRes = await client.execute({
      sql: `SELECT * FROM routine_steps WHERE routine_id IN (${placeholders}) ORDER BY routine_id ASC, step_order ASC`,
      args: routineIds
    });

    const logsRes = await client.execute({
      sql: `SELECT * FROM routine_step_logs WHERE date = ? AND routine_id IN (${placeholders})`,
      args: [todayStr, ...routineIds]
    });
    
    const completedStepIds = new Set(
      logsRes.rows.filter((l: any) => !!(l.completed ?? l[4])).map((l: any) => Number(l.step_id ?? l[2]))
    );

    const routinesMap: any = {};
    for (const r of todayRoutines) {
      const id = Number(r.id ?? r[0]);
      routinesMap[id] = {
        id,
        name: r.name ?? r[1],
        category: r.category ?? r[3],
        steps: []
      };
    }

    let totalRequired = 0;
    let completedRequired = 0;

    for (const s of stepsRes.rows) {
      const rId = Number(s.routine_id ?? s[1]);
      const stepId = Number(s.id ?? s[0]);
      const isReq = !!(s.is_required ?? s[5]);
      const isCompleted = completedStepIds.has(stepId);

      if (isReq) totalRequired++;
      if (isReq && isCompleted) completedRequired++;

      if (routinesMap[rId]) {
        routinesMap[rId].steps.push({
          id: stepId,
          routineId: rId,
          stepName: s.step_name ?? s[2],
          estimatedTime: s.estimated_time ?? s[4],
          isRequired: isReq,
          completed: isCompleted,
          productId: s.product_id ?? s[6]
        });
      }
    }

    const payload = Object.values(routinesMap).filter((r: any) => r.steps.length > 0);
    const score = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

    // Update Daily Score safely
    await client.execute({
      sql: `INSERT OR IGNORE INTO routine_logs (date, daily_score, streak) VALUES (?, 0, 0)`,
      args: [todayStr]
    });
    
    await client.execute({
      sql: `UPDATE routine_logs SET daily_score = ? WHERE date = ?`,
      args: [score, todayStr]
    });

    // Check Streak logic (count consecutive days > 80% or 100%)
    const streakRes = await client.execute(`SELECT date, daily_score FROM routine_logs ORDER BY date DESC LIMIT 30`);
    let streak = 0;
    for (const r of streakRes.rows) {
      const s = r.daily_score ?? r[1];
      if (s !== null && Number(s) >= 80) streak++; else if (r.date !== todayStr) break; // skip today if 0 but continue
    }

    return NextResponse.json({ todayRoutines: payload, score, totalRequired, completedRequired, streak });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
