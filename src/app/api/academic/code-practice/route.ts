import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getUserSession, handleGuardedDeletion } from '@/backend/lib/deletionGuard';

export const dynamic = 'force-dynamic';

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

function generateSmartExercises(fileName: string, language: string, code: string) {
  const lines = code.split('\n');
  const lineCount = lines.length;

  const exercises = [
    {
      id: 1,
      type: 'trace_output',
      title: 'تتبع المنطق وتوقع المخرجات (Trace Logic & Predict Output)',
      prompt: `عند تنفيذ هذا الكود المكتوب بلغة (${language})، ما هي النتيجة أو المخرجات المتوقعة في النهاية؟`,
      hint: 'قم بتتبع المتغيرات والشروط خطوة بخطوة بالترتيب.',
      solution: `يعتمد التنفيذ على منطق التحكم والعمليات الموضحة في السطور الأولى، تحقق من المتغيرات الابتدائية وحلقات التكرار (Loops) إن وجدت.`
    },
    {
      id: 2,
      type: 'find_bug',
      title: 'تحدي صيد الأخطاء والحالات الحدية (Bug Hunt & Edge Cases)',
      prompt: `هل توجد أي حالات قد تسبب خطأ وقت التشغيل (Runtime Error) أو Infinite Loop أو Division by Zero في هذا الملف (${fileName})؟`,
      hint: 'انظر إلى مدخلات المستخدم المحتملة والقيم الفارغة (null/empty) والحدود القصوى للمصفوفات.',
      solution: 'تأكد دائماً من التحقق من صحة المدخلات (Input Validation) ووجود شرط إنهاء صحيح في الدوال التكرارية أو الحلقات.'
    },
    {
      id: 3,
      type: 'complexity_analysis',
      title: 'تحليل الأداء والتعقيد الزمني (Time & Space Complexity)',
      prompt: `ما هو التقدير التقريبي للتعقيد الزمني (Big-O Notation) للعمليات الرئيسية في هذا الكود؟`,
      hint: 'عدّ الحلقات المتداخلة (Nested loops) وعمليات البحث أو الترتيب.',
      solution: lineCount > 50 ? 'إذا كان الكود يحتوي على حلقات متداخلة فالتعقيد غالباً O(n²) أو O(n log n)، وإلا فإنه يميل إلى O(n) أو O(1).' : 'الكود مختصر ومباشر، والتعقيد الزمني في أغلب دواله ينحصر بين O(1) و O(n).'
    },
    {
      id: 4,
      type: 'refactor_challenge',
      title: 'تحدي التحسين وإعادة الهيكلة (Clean Code & Refactoring)',
      prompt: `كيف يمكنك إعادة صياغة هذا الكود ليكون أكثر وضوحاً وكفاءة ومتبعاً لمبادئ Clean Code؟`,
      hint: 'استخدم أسماء متغيرات ذات معنى، وقسم الدوال الطويلة لدوال صغيرة محددة المسؤولية.',
      solution: 'تطبيق مبدأ Single Responsibility Principle، واستبدال الأرقام السحرية (Magic Numbers) بثوابت واضحة.'
    }
  ];

  return exercises;
}

export async function GET(req: NextRequest) {
  const client = getClient();
  const session = await getUserSession(req);
  const userId = session?.userId ? String(session.userId) : 'owner';

  try {
    const res = await client.execute({
      sql: `SELECT * FROM academic_code_practices WHERE user_id = ? ORDER BY id DESC`,
      args: [userId]
    });

    const practices = res.rows.map((row: any) => {
      let exercises = [];
      try {
        exercises = typeof row.exercises === 'string' ? JSON.parse(row.exercises) : row.exercises;
      } catch (_) {}
      return {
        ...row,
        exercises
      };
    });

    return NextResponse.json({ success: true, practices });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getUserSession(req);
  const userId = session?.userId ? String(session.userId) : 'owner';

  const client = getClient();
  try {
    const body = await req.json();
    const { file_name, language, code_content, subject_id } = body;

    if (!file_name || !code_content) {
      return NextResponse.json({ success: false, error: 'File name and code content are required' }, { status: 400 });
    }

    const detectedLanguage = language || (file_name.endsWith('.py') ? 'python' : file_name.endsWith('.js') ? 'javascript' : file_name.endsWith('.cpp') ? 'cpp' : file_name.endsWith('.java') ? 'java' : 'code');
    const exercises = generateSmartExercises(file_name, detectedLanguage, code_content);
    const exercisesStr = JSON.stringify(exercises);
    const now = new Date().toISOString();

    const insertRes = await client.execute({
      sql: `
        INSERT INTO academic_code_practices (user_id, subject_id, file_name, language, code_content, analysis, exercises, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        userId,
        subject_id || null,
        file_name,
        detectedLanguage,
        code_content,
        `تم تحليل الملف بنجاح (${code_content.split('\n').length} سطر كود). تتوفر 4 تمارين تدريبية تفاعلية.`,
        exercisesStr,
        now
      ]
    });

    const item = await client.execute({
      sql: `SELECT * FROM academic_code_practices WHERE id = ?`,
      args: [insertRes.lastInsertRowid!]
    });

    return NextResponse.json({
      success: true,
      practice: {
        ...item.rows[0],
        exercises
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
    const itemRes = await client.execute({ sql: `SELECT * FROM academic_code_practices WHERE id = ?`, args: [id] });
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ success: false, error: 'Practice session not found' }, { status: 404 });

    return await handleGuardedDeletion(
      req,
      client,
      {
        itemType: 'code_practice',
        itemId: Number(id),
        itemTitle: String(item.file_name || `تدريب كود #${id}`),
        reason: 'طلب حذف تدريب تفاعلي لملف كود',
      },
      async () => {
        await client.execute({ sql: `DELETE FROM academic_code_practices WHERE id = ?`, args: [id] });
      }
    );
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
