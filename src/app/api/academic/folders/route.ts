import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getUserSession, handleGuardedDeletion } from '@/backend/lib/deletionGuard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

async function ensureFoldersTable(client: any) {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS academic_folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id INTEGER NOT NULL,
        parent_id INTEGER,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        color TEXT DEFAULT '#3B82F6',
        icon TEXT DEFAULT 'Folder',
        sort_order INTEGER DEFAULT 0,
        created_at TEXT
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS academic_folder_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folder_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        item_type TEXT DEFAULT 'lecture',
        code_snippet TEXT DEFAULT '',
        code_language TEXT DEFAULT 'python',
        file_url TEXT DEFAULT '',
        file_name TEXT DEFAULT '',
        file_size INTEGER DEFAULT 0,
        due_date TEXT DEFAULT '',
        is_completed INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT
      )
    `);
    try { await client.execute(`ALTER TABLE academic_folder_items ADD COLUMN due_date TEXT DEFAULT ''`); } catch {}
    try { await client.execute(`ALTER TABLE academic_folder_items ADD COLUMN is_completed INTEGER DEFAULT 0`); } catch {}
  } catch {}
}

export async function GET(req: NextRequest) {
  const client = getClient();
  try {
    await ensureFoldersTable(client);
    const subjectId = req.nextUrl.searchParams.get('subject_id');
    if (!subjectId) {
      return NextResponse.json({ success: false, error: 'subject_id is required' }, { status: 400 });
    }

    const foldersRes = await client.execute({
      sql: `SELECT * FROM academic_folders WHERE subject_id = ? ORDER BY sort_order ASC, id ASC`,
      args: [subjectId]
    });

    // Also get breakdown count of items in each folder
    const foldersWithCount = await Promise.all(
      foldersRes.rows.map(async (folder: any) => {
        const countRes = await client.execute({
          sql: `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN item_type IN ('lecture', 'note', 'file', 'code') THEN 1 ELSE 0 END) as lectures,
            SUM(CASE WHEN item_type = 'assignment' THEN 1 ELSE 0 END) as assignments,
            SUM(CASE WHEN item_type = 'resource' THEN 1 ELSE 0 END) as resources,
            SUM(CASE WHEN item_type = 'video' THEN 1 ELSE 0 END) as videos,
            SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_count
          FROM academic_folder_items WHERE folder_id = ?`,
          args: [folder.id]
        });
        const row = countRes.rows[0] || {};
        return {
          ...folder,
          itemsCount: Number(row.total) || 0,
          lecturesCount: Number(row.lectures) || 0,
          assignmentsCount: Number(row.assignments) || 0,
          resourcesCount: Number(row.resources) || 0,
          videosCount: Number(row.videos) || 0,
          completedCount: Number(row.completed_count) || 0,
        };
      })
    );

    return NextResponse.json({ success: true, folders: foldersWithCount });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getUserSession(req);
  if (session && session.role === 'viewer') {
    return NextResponse.json({ success: false, error: 'حساب المشاهد لا يملك صلاحية إنشاء مجلدات' }, { status: 403 });
  }

  const client = getClient();
  try {
    await ensureFoldersTable(client);
    const body = await req.json();
    const { subject_id, parent_id = null, name, description = '', color = '#3B82F6', icon = 'Folder' } = body;
    if (!subject_id || !name) {
      return NextResponse.json({ success: false, error: 'Subject ID and folder name are required' }, { status: 400 });
    }

    const maxOrderRes = await client.execute({
      sql: `SELECT MAX(sort_order) as max FROM academic_folders WHERE subject_id = ?`,
      args: [subject_id]
    });
    const nextOrder = (Number(maxOrderRes.rows[0]?.max) || 0) + 1;
    const now = new Date().toISOString();

    const insertRes = await client.execute({
      sql: `INSERT INTO academic_folders (subject_id, parent_id, name, description, color, icon, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [subject_id, parent_id, name, description, color, icon, nextOrder, now]
    });

    const folder = await client.execute({
      sql: `SELECT * FROM academic_folders WHERE id = ?`,
      args: [insertRes.lastInsertRowid!]
    });

    return NextResponse.json({ success: true, folder: { ...folder.rows[0], itemsCount: 0 } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const client = getClient();
  try {
    const body = await req.json();
    const { id, name, description, color, icon } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const existingRes = await client.execute({ sql: `SELECT * FROM academic_folders WHERE id = ?`, args: [id] });
    const existing = existingRes.rows[0];
    if (!existing) return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });

    await client.execute({
      sql: `UPDATE academic_folders SET name = ?, description = ?, color = ?, icon = ? WHERE id = ?`,
      args: [
        name || existing.name,
        description !== undefined ? description : existing.description,
        color || existing.color,
        icon || existing.icon,
        id
      ]
    });

    const updated = await client.execute({ sql: `SELECT * FROM academic_folders WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true, folder: updated.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const client = getClient();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

  try {
    const itemRes = await client.execute({ sql: `SELECT * FROM academic_folders WHERE id = ?`, args: [id] });
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });

    return await handleGuardedDeletion(
      req,
      client,
      {
        itemType: 'folder',
        itemId: Number(id),
        itemTitle: String(item.name || `مجلد #${id}`),
        reason: 'طلب حذف مجلد دراسي بجميع ملفاته',
      },
      async () => {
        await client.execute({ sql: `DELETE FROM academic_folder_items WHERE folder_id = ?`, args: [id] });
        await client.execute({ sql: `DELETE FROM academic_folders WHERE id = ?`, args: [id] });
      }
    );
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
