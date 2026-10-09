import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

// Helper to ensure courses tables exist
async function ensureCoursesTables(client: any) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      thumbnail_url TEXT DEFAULT '',
      category TEXT DEFAULT 'general',
      instructor TEXT DEFAULT 'Mark Emad',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `).catch(() => null);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS course_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `).catch(() => null);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS course_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      module_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      video_url TEXT DEFAULT '',
      duration TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      attachments TEXT DEFAULT '[]',
      completed INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `).catch(() => null);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS course_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      user_id TEXT DEFAULT 'owner',
      completed INTEGER DEFAULT 1,
      completed_at TEXT NOT NULL
    );
  `).catch(() => null);
}

export async function GET() {
  const client = getClient();
  try {
    await ensureCoursesTables(client);

    const [coursesRes, modulesRes, lessonsRes] = await Promise.all([
      client.execute(`SELECT * FROM courses ORDER BY sort_order ASC, id ASC`),
      client.execute(`SELECT * FROM course_modules ORDER BY sort_order ASC, id ASC`),
      client.execute(`SELECT * FROM course_lessons ORDER BY sort_order ASC, id ASC`),
    ]);

    const modules = modulesRes.rows || [];
    const lessons = lessonsRes.rows || [];

    const coursesData = (coursesRes.rows || []).map((c: any) => {
      const courseModules = modules
        .filter((m: any) => m.course_id === c.id || m.courseId === c.id)
        .map((m: any) => {
          const moduleLessons = lessons.filter((l: any) => (l.module_id === m.id || l.moduleId === m.id) && (l.course_id === c.id || l.courseId === c.id));
          return {
            id: m.id,
            courseId: m.course_id ?? m.courseId,
            title: m.title,
            sortOrder: m.sort_order ?? m.sortOrder ?? 0,
            lessons: moduleLessons.map((l: any) => ({
              id: l.id,
              courseId: l.course_id ?? l.courseId,
              moduleId: l.module_id ?? l.moduleId,
              title: l.title,
              description: l.description || '',
              videoUrl: l.video_url ?? l.videoUrl ?? '',
              duration: l.duration || '',
              notes: l.notes || '',
              attachments: typeof l.attachments === 'string' ? JSON.parse(l.attachments || '[]') : (l.attachments || []),
              completed: Boolean(l.completed),
              sortOrder: l.sort_order ?? l.sortOrder ?? 0,
            })),
          };
        });

      // Calculate total lessons and completed count
      const allLessons = courseModules.flatMap(m => m.lessons);
      const totalLessons = allLessons.length;
      const completedLessons = allLessons.filter(l => l.completed).length;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        id: c.id,
        title: c.title,
        description: c.description || '',
        thumbnailUrl: c.thumbnail_url ?? c.thumbnailUrl ?? '',
        category: c.category || 'general',
        instructor: c.instructor || 'Mark Emad',
        totalLessons,
        completedLessons,
        progressPercentage,
        modules: courseModules,
      };
    });

    return NextResponse.json({ courses: coursesData });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = getClient();
  try {
    await ensureCoursesTables(client);
    const body = await req.json();
    const { title, description = '', thumbnailUrl = '', category = 'general', instructor = 'Mark Emad' } = body;

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const createdAt = new Date().toISOString();
    const result = await client.execute({
      sql: `INSERT INTO courses (title, description, thumbnail_url, category, instructor, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [title, description, thumbnailUrl, category, instructor, createdAt],
    });

    const courseId = Number(result.lastInsertRowid);

    // Create an initial default module
    await client.execute({
      sql: `INSERT INTO course_modules (course_id, title, sort_order, created_at) VALUES (?, 'الفصل الأول: البداية والأساسيات', 1, ?)`,
      args: [courseId, createdAt],
    });

    return NextResponse.json({ success: true, courseId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { id, title, description, thumbnailUrl, category } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const fields: string[] = [];
    const args: any[] = [];

    if (title !== undefined) { fields.push('title = ?'); args.push(title); }
    if (description !== undefined) { fields.push('description = ?'); args.push(description); }
    if (thumbnailUrl !== undefined) { fields.push('thumbnail_url = ?'); args.push(thumbnailUrl); }
    if (category !== undefined) { fields.push('category = ?'); args.push(category); }

    if (fields.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    args.push(id);

    await client.execute({ sql: `UPDATE courses SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, args });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const client = getClient();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    await client.execute({ sql: `DELETE FROM course_lessons WHERE course_id = ?`, args: [id] });
    await client.execute({ sql: `DELETE FROM course_modules WHERE course_id = ?`, args: [id] });
    await client.execute({ sql: `DELETE FROM courses WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
