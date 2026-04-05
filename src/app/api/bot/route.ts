import { NextResponse } from 'next/server';
import { db } from '@/db';
import { finances, tasks, assets } from '@/db/schema';
// Keep notion as optional assistant
import * as notion from '@/lib/notion'; 

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MY_ID = process.env.MY_TELEGRAM_ID;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Bot Webhook Received:', JSON.stringify(body, null, 2));

    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const { text, chat, from } = body.message;

    // Security check
    if (MY_ID && from.id.toString() !== MY_ID) {
      console.warn('Unauthorized access attempt from:', from.id);
      return NextResponse.json({ ok: true });
    }

    const messageText = text.trim();
    let responseText = 'تم استلام الرسالة، جاري المعالجة...';

    // 1. تحليل المصروفات (رقم + وصف)
    const expenseMatch = messageText.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (expenseMatch) {
      const amount = parseFloat(expenseMatch[1]);
      const description = expenseMatch[2];

      // حفظ في SQLite (المحرك الأساسي)
      await db.insert(finances).values({
        amount,
        name: description,
        date: new Date().toISOString(),
        category: 'Telegram',
      });

      // محاولة الحفظ في نوشن (مساعد ثانوي)
      try { await notion.addExpense(amount, description); } catch (e) { console.error('Notion Sync Failed:', e); }

      responseText = `✅ تم تسجيل مصروف بقيمة ${amount} لـ "${description}" في قاعدة البيانات المحلية.`;
    } 
    // 2. تحليل المهام (كلمة "تاسك" أو "مهمة")
    else if (messageText.startsWith('تاسك ') || messageText.startsWith('مهمة ')) {
      const taskName = messageText.replace(/^(تاسك|مهمة)\s+/, '');

      // حفظ في SQLite
      await db.insert(tasks).values({
        name: taskName,
        status: 'Active',
        dueDate: new Date().toISOString(),
      });

      // محاولة الحفظ في نوشن
      try { await notion.addTask(taskName); } catch (e) { console.error('Notion Sync Failed:', e); }

      responseText = `📝 تمت إضافة المهمة: "${taskName}" بنجاح.`;
    }
    // 3. تحليل الأصول والروابط (رابط يبدأ بـ http)
    else if (messageText.startsWith('http')) {
      await db.insert(assets).values({
        name: messageText,
        date: new Date().toISOString(),
      });
      
      try { await notion.addAsset(messageText); } catch (e) { console.error('Notion Sync Failed:', e); }
      responseText = `🔗 تم حفظ الرابط في الأصول الرقمية.`;
    }
    else {
      responseText = 'لم أفهم الأمر. جرب إرسال مبلغ ووصف (مثل: 50 غداء) أو كلمة "تاسك" وبعدها المهمة.';
    }

    // إرسال رد للمستخدم عبر تليجرام
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat.id,
        text: responseText,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
