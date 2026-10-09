import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET() {
  const client = getClient();
  try {
    const res = await client.execute(`SELECT * FROM settings WHERE key IN ('auth_email', 'notion_url', 'google_calendar_url', 'avatar_url')`);
    const settingsMap: Record<string, string> = {};
    (res.rows || []).forEach((r: any) => {
      settingsMap[r.key] = r.value;
    });

    return NextResponse.json({
      email: settingsMap['auth_email'] || 'admin@os.com',
      notionUrl: settingsMap['notion_url'] || '',
      googleCalendarUrl: settingsMap['google_calendar_url'] || 'https://calendar.google.com',
      avatarUrl: settingsMap['avatar_url'] || '/profile-hero.png',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { email, password, notionUrl, googleCalendarUrl, avatarUrl } = body;

    if (email) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('auth_email', ?)`,
        args: [email.trim().toLowerCase()],
      });
    }

    if (password && password.trim()) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('auth_password', ?)`,
        args: [password.trim()],
      });
    }

    if (notionUrl !== undefined) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('notion_url', ?)`,
        args: [notionUrl.trim()],
      });
    }

    if (googleCalendarUrl !== undefined) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('google_calendar_url', ?)`,
        args: [googleCalendarUrl.trim()],
      });
    }

    if (avatarUrl !== undefined) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('avatar_url', ?)`,
        args: [avatarUrl.trim()],
      });
    }

    return NextResponse.json({ success: true, message: 'تم حفظ وتحديث الإعدادات بنجاح!' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
