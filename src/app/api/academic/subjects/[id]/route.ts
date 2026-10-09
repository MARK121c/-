import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

function deleteFile(filePath: string) {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to delete file:', e); }
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient();
  try {
    const subjectRes = await client.execute({ sql: `SELECT * FROM academic_subjects WHERE id = ?`, args: [id] });
    const subject = subjectRes.rows[0];
    if (!subject) return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });

    const [lecRes, asgnRes, rsrcRes, vidRes] = await Promise.all([
      client.execute({ sql: `SELECT * FROM academic_lectures WHERE subject_id = ? ORDER BY sort_order ASC, id ASC`, args: [id] }),
      client.execute({ sql: `SELECT * FROM academic_assignments WHERE subject_id = ? ORDER BY sort_order ASC, id ASC`, args: [id] }),
      client.execute({ sql: `SELECT * FROM academic_materials_resources WHERE subject_id = ? ORDER BY sort_order ASC, id ASC`, args: [id] }),
      client.execute({ sql: `SELECT * FROM academic_videos WHERE subject_id = ? ORDER BY sort_order ASC, id ASC`, args: [id] }),
    ]);

    const lectures = lecRes.rows;
    const assignments = asgnRes.rows;
    const resources = rsrcRes.rows;
    const videos = vidRes.rows;

    const allItems = [...lectures, ...assignments, ...resources, ...videos];
    const total = allItems.length;
    const completed = allItems.filter((i: any) => i.completed === 1 || i.completed === true).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      subject: {
        ...subject,
        lectures,
        assignments,
        resources,
        videos,
        stats: {
          lectures: lectures.length,
          assignments: assignments.length,
          resources: resources.length,
          videos: videos.length,
          total,
          completed,
          percentage,
        }
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient();
  try {
    const body = await req.json();
    const { name, code, color, icon, drive_folder_url, driveFolderUrl } = body;

    const subjectRes = await client.execute({ sql: `SELECT * FROM academic_subjects WHERE id = ?`, args: [id] });
    const subject = subjectRes.rows[0];
    if (!subject) return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });

    const driveUrl = drive_folder_url !== undefined ? drive_folder_url : (driveFolderUrl !== undefined ? driveFolderUrl : subject.drive_folder_url);

    await client.execute({
      sql: `UPDATE academic_subjects SET name = ?, code = ?, color = ?, icon = ?, drive_folder_url = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [
        name || subject.name,
        code !== undefined ? code : subject.code,
        color || subject.color,
        icon || subject.icon,
        driveUrl || '',
        id
      ]
    });

    const updated = await client.execute({ sql: `SELECT * FROM academic_subjects WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true, subject: updated.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient();
  try {
    const subjectRes = await client.execute({ sql: `SELECT * FROM academic_subjects WHERE id = ?`, args: [id] });
    if (!subjectRes.rows[0]) return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });

    // Clean up uploaded files for this subject
    const [lecRes, asgnRes, vidRes] = await Promise.all([
      client.execute({ sql: `SELECT file_path FROM academic_lectures WHERE subject_id = ?`, args: [id] }),
      client.execute({ sql: `SELECT file_path FROM academic_assignments WHERE subject_id = ?`, args: [id] }),
      client.execute({ sql: `SELECT file_path FROM academic_videos WHERE subject_id = ?`, args: [id] }),
    ]);

    lecRes.rows.forEach((r: any) => deleteFile(r.file_path));
    asgnRes.rows.forEach((r: any) => deleteFile(r.file_path));
    vidRes.rows.forEach((r: any) => deleteFile(r.file_path));

    await Promise.all([
      client.execute({ sql: `DELETE FROM academic_lectures WHERE subject_id = ?`, args: [id] }),
      client.execute({ sql: `DELETE FROM academic_assignments WHERE subject_id = ?`, args: [id] }),
      client.execute({ sql: `DELETE FROM academic_materials_resources WHERE subject_id = ?`, args: [id] }),
      client.execute({ sql: `DELETE FROM academic_videos WHERE subject_id = ?`, args: [id] }),
      client.execute({ sql: `DELETE FROM academic_subjects WHERE id = ?`, args: [id] }),
    ]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
