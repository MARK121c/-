import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getUserSession, handleGuardedDeletion } from '@/backend/lib/deletionGuard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET(req: NextRequest) {
  const client = getClient();
  try {
    const subjectId = req.nextUrl.searchParams.get('subject_id');
    if (!subjectId) {
      return NextResponse.json({ success: false, error: 'subject_id is required' }, { status: 400 });
    }

    const foldersRes = await client.execute({
      sql: `SELECT * FROM academic_folders WHERE subject_id = ? ORDER BY sort_order ASC, id ASC`,
      args: [subjectId]
    });

    // Also get count of items in each folder
    const foldersWithCount = await Promise.all(
      foldersRes.rows.map(async (folder: any) => {
        const countRes = await client.execute({
          sql: `SELECT COUNT(*) as cnt FROM academic_folder_items WHERE folder_id = ?`,
          args: [folder.id]
        });
        return {
          ...folder,
          itemsCount: Number(countRes.rows[0]?.cnt) || 0
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
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const client = getClient();
  try {
    const body = await req.json();
    const { subject_id, parent_id = null, name, description = '', color = '#3B82F6', icon = 'Folder' } = body;
    if (!subject_id || !name) {
      return NextResponse.json({ success: false, error: 'Subject ID and folder name are required' }, { status: 400 });
    }

    const maxOrderRes = await client.execute({
      sql: `SELECT MAX(sort_order) as max FROM academic_folders WHERE subject_id = ?`,
      args: [subjectId]
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
