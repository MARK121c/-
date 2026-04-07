import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export async function POST(req: NextRequest) {
  const client = getClient();
  const body = await req.json();
  const { subscriptionId } = body;

  try {
    const res = await client.execute({ sql: `SELECT * FROM subscriptions WHERE id = ?`, args: [subscriptionId] });
    const sub = res.rows[0];

    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    const amount = Number(sub.amount);
    const currency = sub.currency || 'EGP';
    const billingCycle = sub.billing_cycle || 'monthly';
    const billingInterval = Number(sub.billing_interval) || 1;
    const nextPaymentDate = sub.next_payment_date;
    const status = sub.status;

    // 1. Log Transaction
    await client.execute({
      sql: `INSERT INTO transactions (amount, currency, category, method, status, description, date) VALUES (?, ?, 'التزامات', 'فيزا', 'تم الصرف', ?, ?)`,
      args: [amount, currency, `اشتراك: ${sub.name}`, new Date().toISOString().split('T')[0]]
    });

    // 2. Log Payment
    await client.execute({
      sql: `INSERT INTO subscription_payments (subscription_id, amount, currency, payment_date) VALUES (?, ?, ?, ?)`,
      args: [subscriptionId, amount, currency, new Date().toISOString().split('T')[0]]
    });

    // 3. Deduct from Obligations Wallet
    const walletRes = await client.execute({ sql: `SELECT balance FROM wallets WHERE id = 'obligations'`, args: [] });
    const currentBalance = Number(walletRes.rows[0]?.balance || 0);

    // Assuming EGP for now, if it was USD we'd need conversion logic
    await client.execute({
      sql: `UPDATE wallets SET balance = ? WHERE id = 'obligations'`,
      args: [currentBalance - amount]
    });

    // 4. Update next_payment_date
    const nextDate = new Date(String(nextPaymentDate));
    if (billingCycle === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + billingInterval);
    } else if (billingCycle === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + billingInterval);
    } else {
      nextDate.setDate(nextDate.getDate() + billingInterval);
    }

    const nextPaymentDateStr = nextDate.toISOString().split('T')[0];

    await client.execute({
      sql: `UPDATE subscriptions SET next_payment_date = ?, status = 'active' WHERE id = ?`,
      args: [nextPaymentDateStr, subscriptionId]
    });

    return NextResponse.json({ success: true, nextPaymentDate: nextPaymentDateStr });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
