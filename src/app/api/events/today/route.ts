import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET() {
  const client = getClient();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  try {
    const res = await client.execute(`
      SELECT e.*, p.name as person_name 
      FROM events e 
      LEFT JOIN people p ON e.person_id = p.id
    `);

    const payload = res.rows.map((r: any) => {
      const id = r.id;
      const title = r.title;
      const type = r.type;
      const date = r.date;
      const repeat = r.repeat;
      const personName = r.person_name;
      const reminderBeforeDays = r.reminder_before_days;

      const eventDate = new Date(date);
      const eventMonth = eventDate.getMonth() + 1;
      const eventDay = eventDate.getDate();

      let isToday = false;
      let daysUntil = -1;

      if (repeat === 'yearly') {
         isToday = (eventMonth === currentMonth && eventDay === currentDay);
         // Calculate days until next occurrence
         const nextOccur = new Date(today.getFullYear(), eventMonth - 1, eventDay);
         if (nextOccur < today && !isToday) {
            nextOccur.setFullYear(today.getFullYear() + 1);
         }
         daysUntil = Math.ceil((nextOccur.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      } else if (repeat === 'monthly') {
         isToday = (eventDay === currentDay);
         const nextOccur = new Date(today.getFullYear(), today.getMonth(), eventDay);
         if (nextOccur < today && !isToday) {
            nextOccur.setMonth(today.getMonth() + 1);
         }
         daysUntil = Math.ceil((nextOccur.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      } else {
         isToday = (date === todayStr);
         daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        id, title, type, date, repeat, personName, reminderBeforeDays,
        isToday,
        daysUntil: daysUntil < 0 ? 0 : daysUntil
      };
    });

    const todayEvents = payload.filter(e => e.isToday);
    const upcomingEvents = payload.filter(e => !e.isToday && e.daysUntil > 0 && e.daysUntil <= 30).sort((a,b) => a.daysUntil - b.daysUntil);

    return NextResponse.json({ todayEvents, upcomingEvents });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
