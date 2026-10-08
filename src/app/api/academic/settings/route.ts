import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET() {
  const client = getClient();
  try {
    const res = await client.execute(`SELECT * FROM academic_settings WHERE id = 1 LIMIT 1`);
    const settings = res.rows[0] || {
      college_name: '',
      department: '',
      academic_year: '',
      section_number: '',
    };
    return NextResponse.json({ success: true, settings });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const client = getClient();
  try {
    const body = await req.json();
    const { college_name, department, academic_year, section_number } = body;

    await client.execute({
      sql: `
        UPDATE academic_settings 
        SET college_name = ?, department = ?, academic_year = ?, section_number = ?, updated_at = datetime('now')
        WHERE id = 1
      `,
      args: [college_name || '', department || '', academic_year || '', section_number || '']
    });

    const res = await client.execute(`SELECT * FROM academic_settings WHERE id = 1 LIMIT 1`);
    return NextResponse.json({ success: true, settings: res.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
