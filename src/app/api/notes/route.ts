import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

async function ensureNotesTable(client: any) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '',
      content TEXT NOT NULL,
      category TEXT DEFAULT 'عام',
      color TEXT DEFAULT 'orange',
      tags TEXT DEFAULT '[]',
      is_pinned INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      checklist TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `).catch(() => null);
}

export async function GET(req: NextRequest) {
  const client = getClient();
  try {
    await ensureNotesTable(client);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = `SELECT * FROM notes WHERE is_archived = 0 ORDER BY is_pinned DESC, id DESC`;
    const res = await client.execute(query);
    let notes = (res.rows || []).map((row: any) => ({
      id: row.id,
      title: row.title || '',
      content: row.content || '',
      category: row.category || 'عام',
      color: row.color || 'orange',
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []),
      isPinned: Boolean(row.is_pinned),
      isArchived: Boolean(row.is_archived),
      checklist: typeof row.checklist === 'string' ? JSON.parse(row.checklist || '[]') : (row.checklist || []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    if (category && category !== 'all' && category !== 'الكل') {
      notes = notes.filter((n: any) => n.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      notes = notes.filter((n: any) => 
        n.title.toLowerCase().includes(q) || 
        n.content.toLowerCase().includes(q) ||
        (Array.isArray(n.tags) && n.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = getClient();
  try {
    await ensureNotesTable(client);
    const body = await req.json();
    const {
      title = '',
      content = '',
      category = 'عام',
      color = 'orange',
      tags = [],
      isPinned = false,
      checklist = [],
    } = body;

    if (!content && !title) {
      return NextResponse.json({ error: 'Content or title is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);
    const checklistJson = JSON.stringify(Array.isArray(checklist) ? checklist : []);

    const res = await client.execute({
      sql: `INSERT INTO notes (title, content, category, color, tags, is_pinned, is_archived, checklist, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      args: [
        title.trim(),
        content.trim(),
        category.trim() || 'عام',
        color || 'orange',
        tagsJson,
        isPinned ? 1 : 0,
        checklistJson,
        now,
        now
      ]
    });

    return NextResponse.json({ success: true, id: Number(res.lastInsertRowid) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const client = getClient();
  try {
    await ensureNotesTable(client);
    const body = await req.json();
    const {
      id,
      title,
      content,
      category,
      color,
      tags,
      isPinned,
      isArchived,
      checklist
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const tagsJson = tags !== undefined ? JSON.stringify(Array.isArray(tags) ? tags : []) : null;
    const checklistJson = checklist !== undefined ? JSON.stringify(Array.isArray(checklist) ? checklist : []) : null;

    // Fetch existing note first
    const existing = await client.execute({ sql: `SELECT * FROM notes WHERE id = ?`, args: [id] });
    if (!existing.rows || existing.rows.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    const current = existing.rows[0];

    const newTitle = title !== undefined ? title : current.title;
    const newContent = content !== undefined ? content : current.content;
    const newCategory = category !== undefined ? category : current.category;
    const newColor = color !== undefined ? color : current.color;
    const newTags = tagsJson !== null ? tagsJson : current.tags;
    const newIsPinned = isPinned !== undefined ? (isPinned ? 1 : 0) : current.is_pinned;
    const newIsArchived = isArchived !== undefined ? (isArchived ? 1 : 0) : current.is_archived;
    const newChecklist = checklistJson !== null ? checklistJson : current.checklist;

    await client.execute({
      sql: `UPDATE notes SET title = ?, content = ?, category = ?, color = ?, tags = ?, is_pinned = ?, is_archived = ?, checklist = ?, updated_at = ? WHERE id = ?`,
      args: [newTitle, newContent, newCategory, newColor, newTags, newIsPinned, newIsArchived, newChecklist, now, id]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const client = getClient();
  try {
    await ensureNotesTable(client);
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await client.execute({
      sql: `DELETE FROM notes WHERE id = ?`,
      args: [id]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
