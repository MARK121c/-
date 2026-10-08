import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET() {
  const client = getClient();
  try {
    const [lecRes, asgnRes, rsrcRes, vidRes] = await Promise.all([
      client.execute(`SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as done FROM academic_lectures`),
      client.execute(`SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as done FROM academic_assignments`),
      client.execute(`SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as done FROM academic_materials_resources`),
      client.execute(`SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as done FROM academic_videos`),
    ]);

    const lTotal = Number(lecRes.rows[0]?.total || 0);
    const lDone = Number(lecRes.rows[0]?.done || 0);

    const aTotal = Number(asgnRes.rows[0]?.total || 0);
    const aDone = Number(asgnRes.rows[0]?.done || 0);

    const rTotal = Number(rsrcRes.rows[0]?.total || 0);
    const rDone = Number(rsrcRes.rows[0]?.done || 0);

    const vTotal = Number(vidRes.rows[0]?.total || 0);
    const vDone = Number(vidRes.rows[0]?.done || 0);

    const total = lTotal + aTotal + rTotal + vTotal;
    const completed = lDone + aDone + rDone + vDone;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      success: true,
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
