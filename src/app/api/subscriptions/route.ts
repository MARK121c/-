import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

// Helper to determine status based on date
function getStatus(nextPaymentDate: string, currentStatus: string) {
  if (currentStatus === 'paused' || currentStatus === 'canceled') return currentStatus;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDate = new Date(nextPaymentDate);
  nextDate.setHours(0, 0, 0, 0);

  if (today >= nextDate) return 'due';
  
  const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return 'upcoming';
  
  return 'active';
}

export async function GET() {
  const client = getClient();
  try {
    const res = await client.execute(`SELECT * FROM subscriptions ORDER BY next_payment_date ASC`);
    
    // Update statuses dynamically
    const subscriptions = res.rows.map((r: any) => {
      const id = r.id;
      const amount = r.amount;
      const currency = r.currency;
      const billingCycle = r.billing_cycle;
      const billingInterval = r.billing_interval;
      const nextPaymentDate = r.next_payment_date;
      const currentStatus = r.status;

      const updatedStatus = getStatus(nextPaymentDate, currentStatus);

      return {
        id,
        name: r.name,
        category: r.category,
        amount,
        currency,
        billingCycle,
        billingInterval,
        startDate: r.start_date,
        nextPaymentDate,
        status: updatedStatus,
        isEssential: !!r.is_essential,
        linkedAccount: r.linked_account,
      };
    });

    return NextResponse.json({ subscriptions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = getClient();
  const body = await req.json();
  const { name, category, amount, currency = 'EGP', billingCycle = 'monthly', billingInterval = 1, startDate, isEssential = true, linkedAccount = 'cash' } = body;

  // Initial nextPaymentDate = startDate
  const nextPaymentDate = startDate;

  try {
    await client.execute({
      sql: `INSERT INTO subscriptions (name, category, amount, currency, billing_cycle, billing_interval, start_date, next_payment_date, status, is_essential, linked_account) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      args: [name, category, amount, currency, billingCycle, billingInterval, startDate, nextPaymentDate, isEssential ? 1 : 0, linkedAccount]
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const client = getClient();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    await client.execute({ sql: `DELETE FROM subscriptions WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
