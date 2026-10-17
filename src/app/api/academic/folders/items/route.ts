import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getUserSession, handleGuardedDeletion } from '@/backend/lib/deletionGuard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

async function ensureFolderItemsTable(client: any) {
  try {
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
    await ensureFolderItemsTable(client);
    const folderId = req.nextUrl.searchParams.get('folder_id');
    if (!folderId) {
      return NextResponse.json({ success: false, error: 'folder_id is required' }, { status: 400 });
    }

    const res = await client.execute({
      sql: `SELECT * FROM academic_folder_items WHERE folder_id = ? ORDER BY sort_order ASC, id ASC`,
      args: [folderId]
    });

    return NextResponse.json({ success: true, items: res.rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getUserSession(req);
  if (session && session.role === 'viewer') {
    return NextResponse.json({ success: false, error: 'حساب المشاهد لا يملك صلاحية إضافة محتوى' }, { status: 403 });
  }

  const client = getClient();
  try {
    await ensureFolderItemsTable(client);
    const body = await req.json();
    const {
      folder_id,
      subject_id,
      title,
      content = '',
      item_type = 'lecture',
      code_snippet = '',
      code_language = 'python',
      file_url = '',
      file_name = '',
      file_size = 0,
      due_date = '',
      is_completed = 0
    } = body;

    if (!folder_id || !subject_id || !title) {
      return NextResponse.json({ success: false, error: 'folder_id, subject_id, and title are required' }, { status: 400 });
    }

    const maxOrderRes = await client.execute({
      sql: `SELECT MAX(sort_order) as max FROM academic_folder_items WHERE folder_id = ?`,
      args: [folder_id]
    });
    const nextOrder = (Number(maxOrderRes.rows[0]?.max) || 0) + 1;
    const now = new Date().toISOString();

    const insertRes = await client.execute({
      sql: `
        INSERT INTO academic_folder_items 
        (folder_id, subject_id, title, content, item_type, code_snippet, code_language, file_url, file_name, file_size, due_date, is_completed, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        folder_id,
        subject_id,
        title,
        content,
        item_type,
        code_snippet,
        code_language,
        file_url,
        file_name,
        file_size,
        due_date,
        is_completed ? 1 : 0,
        nextOrder,
        now
      ]
    });

    const item = await client.execute({
      sql: `SELECT * FROM academic_folder_items WHERE id = ?`,
      args: [insertRes.lastInsertRowid!]
    });

    return NextResponse.json({ success: true, item: item.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getUserSession(req);
  if (session && session.role === 'viewer') {
    return NextResponse.json({ success: false, error: 'حساب المشاهد لا يملك صلاحية تعديل المحتوى' }, { status: 403 });
  }

  const client = getClient();
  try {
    await ensureFolderItemsTable(client);
    const body = await req.json();
    const { id, is_completed } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const existingRes = await client.execute({ sql: `SELECT * FROM academic_folder_items WHERE id = ?`, args: [id] });
    const existing = existingRes.rows[0];
    if (!existing) return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });

    const newCompleted = is_completed !== undefined ? (is_completed ? 1 : 0) : (existing.is_completed ? 0 : 1);

    await client.execute({
      sql: `UPDATE academic_folder_items SET is_completed = ? WHERE id = ?`,
      args: [newCompleted, id]
    });

    return NextResponse.json({ success: true, is_completed: newCompleted });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getUserSession(req);
  if (session && session.role === 'viewer') {
    return NextResponse.json({ success: false, error: 'حساب المشاهد لا يملك صلاحية تعديل المحتوى' }, { status: 403 });
  }

  const client = getClient();
  try {
    await ensureFolderItemsTable(client);
    const body = await req.json();
    const { id, title, content, item_type, code_snippet, code_language, file_url, file_name, file_size, due_date, is_completed } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const existingRes = await client.execute({ sql: `SELECT * FROM academic_folder_items WHERE id = ?`, args: [id] });
    const existing = existingRes.rows[0];
    if (!existing) return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });

    await client.execute({
      sql: `
        UPDATE academic_folder_items SET
          title = ?,
          content = ?,
          item_type = ?,
          code_snippet = ?,
          code_language = ?,
          file_url = ?,
          file_name = ?,
          file_size = ?,
          due_date = ?,
          is_completed = ?
        WHERE id = ?
      `,
      args: [
        title || existing.title,
        content !== undefined ? content : existing.content,
        item_type || existing.item_type,
        code_snippet !== undefined ? code_snippet : existing.code_snippet,
        code_language || existing.code_language,
        file_url !== undefined ? file_url : existing.file_url,
        file_name !== undefined ? file_name : existing.file_name,
        file_size !== undefined ? file_size : existing.file_size,
        due_date !== undefined ? due_date : existing.due_date,
        is_completed !== undefined ? (is_completed ? 1 : 0) : existing.is_completed,
        id
      ]
    });

    const updated = await client.execute({ sql: `SELECT * FROM academic_folder_items WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true, item: updated.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const client = getClient();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

  try {
    const itemRes = await client.execute({ sql: `SELECT * FROM academic_folder_items WHERE id = ?`, args: [id] });
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });

    return await handleGuardedDeletion(
      req,
      client,
      {
        itemType: 'folder_item',
        itemId: Number(id),
        itemTitle: String(item.title || `عنصر مجلد #${id}`),
        reason: 'طلب حذف ملف / ملاحظة من المجلد',
      },
      async () => {
        await client.execute({ sql: `DELETE FROM academic_folder_items WHERE id = ?`, args: [id] });
      }
    );
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
