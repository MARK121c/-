import { NextRequest, NextResponse } from 'next/server';
import { addExpense, addTask, addAsset } from '@/lib/notion';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate telegram message
    if (!body.message || !body.message.text) {
      return NextResponse.json({ status: 'Ignored: No text' });
    }

    const chatId = body.message.chat.id.toString();
    const text = body.message.text.trim();

    // Security check
    if (chatId !== process.env.MY_TELEGRAM_ID) {
      console.warn(`Unauthorized access attempt from chat ID: ${chatId}`);
      // Don't reply to unauthorized users to avoid spam
      return NextResponse.json({ status: 'Unauthorized' }, { status: 403 });
    }

    let responseMessage = 'لم أفهم رسالتك. يرجى البدء برقم (للمصروفات)، أو كلمة "تاسك" (للمهام)، أو رابط (للأصول).';

    // 1. Finance parsing (starts with a number)
    const expenseMatch = text.match(/^([\d.]+)\s+(.*)/);
    if (expenseMatch) {
      const amount = parseFloat(expenseMatch[1]);
      const description = expenseMatch[2].trim();
      await addExpense(amount, description);
      responseMessage = `✅ تمت إضافة المصروف: ${amount} - ${description}`;
    }
    // 2. Task parsing (starts with 'تاسك')
    else if (text.startsWith('تاسك')) {
      const taskName = text.replace(/^تاسك\s*/, '').trim();
      if (taskName) {
        await addTask(taskName);
        responseMessage = `✅ تمت إضافة المهمة: ${taskName}`;
      } else {
        responseMessage = '⚠️ يجب كتابة اسم المهمة بعد كلمة "تاسك".';
      }
    }
    // 3. Asset parsing (is a URL)
    else if (/^(https?:\/\/[^\s]+)$/.test(text)) {
      await addAsset(text);
      responseMessage = `✅ تم حفظ الرابط في الأصول.`;
    }

    // Send response back to Telegram
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseMessage,
      }),
    });

    return NextResponse.json({ status: 'Success' });
  } catch (error) {
    console.error('Error in bot webhook:', error);
    return NextResponse.json({ status: 'Error', error: String(error) }, { status: 500 });
  }
}
