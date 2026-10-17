import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getUserSession, handleGuardedDeletion } from '@/backend/lib/deletionGuard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET(req: NextRequest) {
  const client = getClient();
  const session = await getUserSession(req);
  const userId = session?.userId ? String(session.userId) : 'owner';

  try {
    const term = req.nextUrl.searchParams.get('term');
    const examType = req.nextUrl.searchParams.get('exam_type');
    const subjectId = req.nextUrl.searchParams.get('subject_id');

    let sql = `SELECT * FROM academic_exams WHERE 1=1`;
    const args: any[] = [];

    if (term && term !== 'all') {
      sql += ` AND term = ?`;
      args.push(term);
    }
    if (examType && examType !== 'all') {
      sql += ` AND exam_type = ?`;
      args.push(examType);
    }
    if (subjectId) {
      sql += ` AND subject_id = ?`;
      args.push(subjectId);
    }

    sql += ` ORDER BY id ASC`;
    const res = await client.execute({ sql, args });

    // Attach latest attempt for each exam
    const examsWithAttempts = await Promise.all(
      res.rows.map(async (exam: any) => {
        const attemptRes = await client.execute({
          sql: `SELECT score, total_marks, percentage, completed_at FROM academic_exam_attempts WHERE exam_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1`,
          args: [exam.id, userId]
        });

        let parsedQuestions = [];
        try {
          parsedQuestions = typeof exam.questions === 'string' ? JSON.parse(exam.questions) : exam.questions;
        } catch (_) {}

        return {
          ...exam,
          questionsCount: parsedQuestions.length,
          questions: parsedQuestions,
          lastAttempt: attemptRes.rows[0] || null
        };
      })
    );

    return NextResponse.json({ success: true, exams: examsWithAttempts });
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
    const {
      term = 'term1',
      exam_type = 'midterm',
      subject_id = null,
      title,
      description = '',
      duration_minutes = 60,
      passing_score = 50,
      total_marks = 100,
      questions = [],
      scheduled_date = ''
    } = body;

    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ success: false, error: 'Title and questions array are required' }, { status: 400 });
    }

    const questionsStr = JSON.stringify(questions);
    const now = new Date().toISOString();

    const insertRes = await client.execute({
      sql: `
        INSERT INTO academic_exams 
        (term, exam_type, subject_id, title, description, duration_minutes, passing_score, total_marks, questions, scheduled_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        term,
        exam_type,
        subject_id || null,
        title,
        description,
        duration_minutes,
        passing_score,
        total_marks,
        questionsStr,
        scheduled_date || null,
        now
      ]
    });

    const exam = await client.execute({
      sql: `SELECT * FROM academic_exams WHERE id = ?`,
      args: [insertRes.lastInsertRowid!]
    });

    return NextResponse.json({
      success: true,
      exam: {
        ...exam.rows[0],
        questions,
        questionsCount: questions.length
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const client = getClient();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

  try {
    const itemRes = await client.execute({ sql: `SELECT * FROM academic_exams WHERE id = ?`, args: [id] });
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });

    return await handleGuardedDeletion(
      req,
      client,
      {
        itemType: 'exam',
        itemId: Number(id),
        itemTitle: String(item.title || `امتحان #${id}`),
        reason: 'طلب حذف اختبار / محاكي امتحان كلية',
      },
      async () => {
        await client.execute({ sql: `DELETE FROM academic_exam_attempts WHERE exam_id = ?`, args: [id] });
        await client.execute({ sql: `DELETE FROM academic_exams WHERE id = ?`, args: [id] });
      }
    );
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
