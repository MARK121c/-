import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getUserIdFromRequest, getUserCompletedSet, ensureUserProgressTable } from '@/backend/lib/userProgress';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET(req: NextRequest) {
  const client = getClient();
  try {
    // ensure columns
    try { await client.execute(`ALTER TABLE academic_subjects ADD COLUMN drive_folder_url TEXT DEFAULT ''`); } catch {}
    try { await client.execute(`ALTER TABLE academic_subjects ADD COLUMN cover_image TEXT DEFAULT ''`); } catch {}

    const userId = await getUserIdFromRequest(req);
    await ensureUserProgressTable(client);
    const completedSet = await getUserCompletedSet(client, userId);

    const subjectsRes = await client.execute(`SELECT * FROM academic_subjects ORDER BY sort_order ASC, id ASC`);
    const subjects = subjectsRes.rows;

    const subjectsWithStats = await Promise.all(
      subjects.map(async (sub: any) => {
        const subId = sub.id;

        const [lecRes, asgnRes, rsrcRes, vidRes] = await Promise.all([
          client.execute({ sql: `SELECT id FROM academic_lectures WHERE subject_id = ?`, args: [subId] }),
          client.execute({ sql: `SELECT id FROM academic_assignments WHERE subject_id = ?`, args: [subId] }),
          client.execute({ sql: `SELECT id FROM academic_materials_resources WHERE subject_id = ?`, args: [subId] }),
          client.execute({ sql: `SELECT id FROM academic_videos WHERE subject_id = ?`, args: [subId] }),
        ]);

        const lTotal = lecRes.rows.length;
        const lDone = lecRes.rows.filter((r: any) => completedSet.has(`lecture:${r.id}`)).length;

        const aTotal = asgnRes.rows.length;
        const aDone = asgnRes.rows.filter((r: any) => completedSet.has(`assignment:${r.id}`)).length;

        const rTotal = rsrcRes.rows.length;
        const rDone = rsrcRes.rows.filter((r: any) => completedSet.has(`resource:${r.id}`)).length;

        const vTotal = vidRes.rows.length;
        const vDone = vidRes.rows.filter((r: any) => completedSet.has(`video:${r.id}`)).length;

        const total = lTotal + aTotal + rTotal + vTotal;
        const completed = lDone + aDone + rDone + vDone;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...sub,
          drive_folder_url: sub.drive_folder_url || '',
          cover_image: sub.cover_image || '',
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
    const { name, code, color, icon, driveFolderUrl, drive_folder_url, cover_image, coverImage } = body;
    if (!name) return NextResponse.json({ success: false, error: 'Subject name is required' }, { status: 400 });

    try {
      await client.execute(`ALTER TABLE academic_subjects ADD COLUMN drive_folder_url TEXT DEFAULT ''`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE academic_subjects ADD COLUMN cover_image TEXT DEFAULT ''`);
    } catch {}

    const maxOrderRes = await client.execute(`SELECT MAX(sort_order) as max FROM academic_subjects`);
    const nextOrder = (Number(maxOrderRes.rows[0]?.max) || 0) + 1;
    const now = new Date().toISOString();
    const driveUrl = driveFolderUrl || drive_folder_url || '';
    const coverImg = cover_image !== undefined ? cover_image : (coverImage !== undefined ? coverImage : '');

    const insertRes = await client.execute({
      sql: `INSERT INTO academic_subjects (name, code, color, icon, drive_folder_url, cover_image, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [name, code || '', color || '#FF6B00', icon || '📘', driveUrl, coverImg, nextOrder, now, now]
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
