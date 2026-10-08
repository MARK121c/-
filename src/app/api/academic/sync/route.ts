import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET() {
  const client = getClient();
  try {
    const [lecRes, asgnRes, rsrcRes, vidRes, logsRes] = await Promise.all([
      client.execute(`SELECT COUNT(*) as c FROM academic_lectures WHERE synced = 0`),
      client.execute(`SELECT COUNT(*) as c FROM academic_assignments WHERE synced = 0`),
      client.execute(`SELECT COUNT(*) as c FROM academic_materials_resources WHERE synced = 0`),
      client.execute(`SELECT COUNT(*) as c FROM academic_videos WHERE synced = 0`),
      client.execute(`SELECT * FROM academic_sync_log ORDER BY synced_at DESC LIMIT 20`),
    ]);

    const lec = Number(lecRes.rows[0]?.c || 0);
    const asgn = Number(asgnRes.rows[0]?.c || 0);
    const rsrc = Number(rsrcRes.rows[0]?.c || 0);
    const vid = Number(vidRes.rows[0]?.c || 0);

    return NextResponse.json({
      success: true,
      pending: {
        lectures: lec,
        assignments: asgn,
        resources: rsrc,
        videos: vid,
        total: lec + asgn + rsrc + vid
      },
      logs: logsRes.rows
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json().catch(() => ({}));
    const syncedBy = body.synced_by || 'owner';

    const tables = ['academic_lectures', 'academic_assignments', 'academic_materials_resources', 'academic_videos'];
    let totalSynced = 0;

    for (const table of tables) {
      const res = await client.execute(`UPDATE ${table} SET synced = 1 WHERE synced = 0`);
      totalSynced += Number(res.rowsAffected || 0);
    }

    const now = new Date().toISOString();
    await client.execute({
      sql: `INSERT INTO academic_sync_log (synced_by, sync_type, items_synced, synced_at) VALUES (?, 'full', ?, ?)`,
      args: [syncedBy, totalSynced, now]
    });

    return NextResponse.json({ success: true, items_synced: totalSynced });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
