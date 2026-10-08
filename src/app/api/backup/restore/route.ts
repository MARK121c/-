import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function POST(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const data = body.data || body;

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'ملف النسخة الاحتياطية غير صالح' }, { status: 400 });
    }

    let restoredTables = 0;
    let totalRows = 0;

    for (const [table, rows] of Object.entries(data)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;

      try {
        // Clear existing table records
        await client.execute(`DELETE FROM ${table}`).catch(() => null);

        // Insert rows
        for (const row of rows) {
          if (row && typeof row === 'object') {
            const keys = Object.keys(row).filter(k => isNaN(Number(k))); // Exclude numeric indices
            if (keys.length === 0) continue;

            const placeholders = keys.map(() => '?').join(', ');
            const values = keys.map(k => row[k]);

            await client.execute({
              sql: `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
              args: values,
            });
            totalRows++;
          }
        }
        restoredTables++;
      } catch (tableErr: any) {
        console.error(`Error restoring table ${table}:`, tableErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم استعادة ${restoredTables} جدول بنجاح و ${totalRows} سجل بيانات!`,
      restoredTables,
      totalRows,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
