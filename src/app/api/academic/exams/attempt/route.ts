import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getUserSession } from '@/backend/lib/deletionGuard';

export const dynamic = 'force-dynamic';

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function POST(req: NextRequest) {
  const session = await getUserSession(req);
  const userId = session?.userId ? String(session.userId) : 'guest';

  const client = getClient();
  try {
    const body = await req.json();
    const { exam_id, answers = {} } = body; // answers: { [questionId]: selectedOptionIndex }

    if (!exam_id) {
      return NextResponse.json({ success: false, error: 'exam_id is required' }, { status: 400 });
    }

    const examRes = await client.execute({ sql: `SELECT * FROM academic_exams WHERE id = ?`, args: [exam_id] });
    const exam = examRes.rows[0];
    if (!exam) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }

    let questions: any[] = [];
    try {
      questions = typeof exam.questions === 'string' ? JSON.parse(exam.questions) : exam.questions;
    } catch (_) {}

    let earnedScore = 0;
    let totalMarks = Number(exam.total_marks) || 100;
    const pointsPerQuestion = questions.length > 0 ? (totalMarks / questions.length) : 0;

    const evaluationResults = questions.map((q: any, idx: number) => {
      const qId = q.id !== undefined ? q.id : idx;
      const selected = answers[qId] !== undefined ? Number(answers[qId]) : null;
      const isCorrect = selected !== null && selected === Number(q.correctIndex);
      const points = Number(q.points) || pointsPerQuestion;

      if (isCorrect) {
        earnedScore += points;
      }

      return {
        id: qId,
        question: q.question,
        options: q.options,
        selected,
        correctIndex: q.correctIndex,
        isCorrect,
        pointsAwarded: isCorrect ? points : 0,
        explanation: q.explanation || ''
      };
    });

    const percentage = totalMarks > 0 ? Math.round((earnedScore / totalMarks) * 100) : 0;
    const passed = percentage >= (Number(exam.passingScore) || 50);

    const now = new Date().toISOString();

    // Record attempt
    await client.execute({
      sql: `
        INSERT INTO academic_exam_attempts (exam_id, user_id, score, total_marks, percentage, answers, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [exam_id, userId, Math.round(earnedScore), totalMarks, percentage, JSON.stringify(answers), now]
    });

    return NextResponse.json({
      success: true,
      result: {
        examId: exam_id,
        title: exam.title,
        score: Math.round(earnedScore),
        totalMarks,
        percentage,
        passed,
        gradeLabel: percentage >= 85 ? 'امتياز (Excellent)' : percentage >= 75 ? 'جيد جداً (Very Good)' : percentage >= 65 ? 'جيد (Good)' : percentage >= 50 ? 'مقبول (Pass)' : 'راسب (Fail)',
        evaluation: evaluationResults,
        completedAt: now
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
