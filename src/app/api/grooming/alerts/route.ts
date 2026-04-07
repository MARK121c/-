import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function GET() {
  const client = getClient();
  try {
    const res = await client.execute(`SELECT * FROM grooming_products WHERE status = 'active' OR status = 'warning'`);
    const today = new Date();
    
    const alerts = [];
    
    for (const r of res.rows) {
      const id = r.id ?? r[0];
      const name = r.name ?? r[1];
      const startDateStr = r.start_date ?? r[4];
      const durationDays = Number(r.estimated_duration_days ?? r[6]);
      const reminderDays = Number(r.reminder_days_before ?? r[8]);
      
      if (!startDateStr) continue;

      const startDate = new Date(String(startDateStr));
      // Diff in days
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      const daysLeft = durationDays - daysPassed;
      
      let newStatus = 'active';
      if (daysLeft <= 0) {
        newStatus = 'finished';
      } else if (daysLeft <= reminderDays) {
        newStatus = 'warning';
      }

      const currentStatus = r.status ?? r[10];

      if (newStatus !== currentStatus) {
         await client.execute({
           sql: `UPDATE grooming_products SET status = ? WHERE id = ?`,
           args: [newStatus, id]
         });
      }

      if (newStatus === 'warning' || newStatus === 'finished') {
        alerts.push({
          id,
          name,
          daysLeft,
          status: newStatus
        });
      }
    }

    return NextResponse.json({ alerts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
