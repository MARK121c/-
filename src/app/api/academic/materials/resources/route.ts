import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getUserIdFromRequest, toggleUserProgress } from '@/backend/lib/userProgress';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET(req: NextRequest) {
  const client = getClient();
  const subjectId = new URL(req.url).searchParams.get('subject_id');
  try {
    let sql = `SELECT * FROM academic_materials_resources`;
    const args: any[] = [];
    if (subjectId) {
      sql += ` WHERE subject_id = ?`;
      args.push(subjectId);
    }
    sql += ` ORDER BY sort_order ASC, id ASC`;
    const res = await client.execute({ sql, args });
    return NextResponse.json({ success: true, resources: res.rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { title, description, url, resource_type, subject_id, material_date, created_by } = body;
    if (!title || !subject_id) {
      return NextResponse.json({ success: false, error: 'Title and Subject ID are required' }, { status: 400 });
    }

    const maxOrderRes = await client.execute({
      sql: `SELECT MAX(sort_order) as max FROM academic_materials_resources WHERE subject_id = ?`,
      args: [subject_id]
    });
    const nextOrder = (Number(maxOrderRes.rows[0]?.max) || 0) + 1;
    const now = new Date().toISOString();

    const insertRes = await client.execute({
      sql: `INSERT INTO academic_materials_resources (subject_id, title, description, url, resource_type, material_date, upload_timestamp, completed, sort_order, created_by, synced) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1)`,
      args: [
        subject_id,
        title,
        description || '',
        url || '',
        resource_type || 'link',
        material_date || new Date().toISOString().split('T')[0],
        now,
        nextOrder,
        created_by || 'owner'
      ]
    });

    const itemRes = await client.execute({
      sql: `SELECT * FROM academic_materials_resources WHERE id = ?`,
      args: [insertRes.lastInsertRowid!]
    });

    return NextResponse.json({ success: true, resource: itemRes.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { id, title, description, url, resource_type, material_date } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const itemRes = await client.execute({ sql: `SELECT * FROM academic_materials_resources WHERE id = ?`, args: [id] });
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });

    await client.execute({
      sql: `UPDATE academic_materials_resources SET title = ?, description = ?, url = ?, resource_type = ?, material_date = ? WHERE id = ?`,
      args: [
        title || item.title,
        description !== undefined ? description : item.description,
        url !== undefined ? url : item.url,
        resource_type || item.resource_type,
        material_date || item.material_date,
        id
      ]
    });

    const updated = await client.execute({ sql: `SELECT * FROM academic_materials_resources WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true, resource: updated.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { id, toggle } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const itemRes = await client.execute({ sql: `SELECT * FROM academic_materials_resources WHERE id = ?`, args: [id] });
    if (!itemRes.rows[0]) return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });

    const userId = await getUserIdFromRequest(req);
    const explicitCompleted = toggle !== undefined ? undefined : (body.completed ? true : false);
    const newCompleted = await toggleUserProgress(client, userId, 'resource', Number(id), explicitCompleted);

    return NextResponse.json({ success: true, completed: newCompleted });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const client = getClient();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

  try {
    const itemRes = await client.execute({ sql: `SELECT * FROM academic_materials_resources WHERE id = ?`, args: [id] });
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });

    const { handleGuardedDeletion } = await import('@/backend/lib/deletionGuard');

    return await handleGuardedDeletion(
      req,
      client,
      {
        itemType: 'resource',
        itemId: Number(id),
        itemTitle: String(item.title || `مرجع #${id}`),
        reason: 'طلب حذف مرجع دراسي / رابط',
      },
      async () => {
        await client.execute({ sql: `DELETE FROM academic_materials_resources WHERE id = ?`, args: [id] });
      }
    );
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
