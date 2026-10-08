import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

const TABLES = [
  'transactions',
  'incomes',
  'assets',
  'investments',
  'passive_income_sources',
  'wallets',
  'income_distribution',
  'work_tracking',
  'wishlist',
  'tasks',
  'people',
  'events',
  'subscriptions',
  'resources',
  'settings',
  'academic_subjects',
  'academic_materials',
  'academic_progress',
  'academic_users',
  'academic_settings'
];

export async function GET() {
  const client = getClient();
  const backupData: Record<string, any[]> = {};

  try {
    for (const table of TABLES) {
      try {
        const res = await client.execute(`SELECT * FROM ${table}`);
        backupData[table] = res.rows || [];
      } catch (_) {
        backupData[table] = [];
      }
    }

    const payload = {
      system: 'MARK OS',
      version: '4.0',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      tablesCount: Object.keys(backupData).length,
      data: backupData,
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const filename = `mark_os_full_backup_${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
