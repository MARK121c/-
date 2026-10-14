import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getUserIdFromRequest, ensureUserProgressTable } from '@/backend/lib/userProgress';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET(req: NextRequest) {
  const client = getClient();
  try {
    await ensureUserProgressTable(client);
    const userId = await getUserIdFromRequest(req);

    const [lecRes, asgnRes, rsrcRes, vidRes, userDoneRes] = await Promise.all([
      client.execute(`SELECT COUNT(*) as total FROM academic_lectures`),
      client.execute(`SELECT COUNT(*) as total FROM academic_assignments`),
      client.execute(`SELECT COUNT(*) as total FROM academic_materials_resources`),
      client.execute(`SELECT COUNT(*) as total FROM academic_videos`),
      client.execute({
        sql: `SELECT material_type, COUNT(*) as done FROM academic_user_progress WHERE user_id = ? AND completed = 1 GROUP BY material_type`,
        args: [userId]
      }),
    ]);

    const lTotal = Number(lecRes.rows[0]?.total || 0);
    const aTotal = Number(asgnRes.rows[0]?.total || 0);
    const rTotal = Number(rsrcRes.rows[0]?.total || 0);
    const vTotal = Number(vidRes.rows[0]?.total || 0);

    let lDone = 0;
    let aDone = 0;
    let rDone = 0;
    let vDone = 0;

    for (const row of userDoneRes.rows) {
      const type = String(row.material_type);
      const count = Number(row.done || 0);
      if (type === 'lectures') lDone = count;
      else if (type === 'assignments') aDone = count;
      else if (type === 'resources') rDone = count;
      else if (type === 'videos') vDone = count;
    }

    const total = lTotal + aTotal + rTotal + vTotal;
    const completed = lDone + aDone + rDone + vDone;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      user_id: userId,
      progress: {
        total,
        completed,
        percentage,
        breakdown: {
          lectures: { total: lTotal, completed: lDone },
          assignments: { total: aTotal, completed: aDone },
          resources: { total: rTotal, completed: rDone },
          videos: { total: vTotal, completed: vDone },
        }
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
