import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET() {
  const client = getClient();
  try {
    // Ensure drive_folder_url column exists
    try {
      await client.execute(`ALTER TABLE academic_subjects ADD COLUMN drive_folder_url TEXT DEFAULT ''`);
    } catch {}

    const subjectsRes = await client.execute(`SELECT * FROM academic_subjects ORDER BY sort_order ASC, id ASC`);
    const subjects = subjectsRes.rows;

    const subjectsWithStats = await Promise.all(
      subjects.map(async (sub: any) => {
        const subId = sub.id;

        const [lecRes, asgnRes, rsrcRes, vidRes] = await Promise.all([
          client.execute({ sql: `SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as done FROM academic_lectures WHERE subject_id = ?`, args: [subId] }),
          client.execute({ sql: `SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as done FROM academic_assignments WHERE subject_id = ?`, args: [subId] }),
          client.execute({ sql: `SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as done FROM academic_materials_resources WHERE subject_id = ?`, args: [subId] }),
          client.execute({ sql: `SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as done FROM academic_videos WHERE subject_id = ?`, args: [subId] }),
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

        return {
          ...sub,
          drive_folder_url: sub.drive_folder_url || '',
          stats: {
            lectures: lTotal,
            assignments: aTotal,
            resources: rTotal,
            videos: vTotal,
            total,
            completed,
            percentage,
          }
        };
      })
    );

    return NextResponse.json({ success: true, subjects: subjectsWithStats });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { name, code, color, icon, driveFolderUrl, drive_folder_url } = body;
    if (!name) return NextResponse.json({ success: false, error: 'Subject name is required' }, { status: 400 });

    try {
      await client.execute(`ALTER TABLE academic_subjects ADD COLUMN drive_folder_url TEXT DEFAULT ''`);
    } catch {}

    const maxOrderRes = await client.execute(`SELECT MAX(sort_order) as max FROM academic_subjects`);
    const nextOrder = (Number(maxOrderRes.rows[0]?.max) || 0) + 1;
    const now = new Date().toISOString();
    const driveUrl = driveFolderUrl || drive_folder_url || '';

    const insertRes = await client.execute({
      sql: `INSERT INTO academic_subjects (name, code, color, icon, drive_folder_url, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [name, code || '', color || '#FF6B00', icon || '📘', driveUrl, nextOrder, now, now]
    });

    const sub = await client.execute({
      sql: `SELECT * FROM academic_subjects WHERE id = ?`,
      args: [insertRes.lastInsertRowid!]
    });

    return NextResponse.json({ success: true, subject: sub.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
