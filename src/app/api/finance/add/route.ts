import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { transactions, assets, incomes, settings, investments, passiveIncomeSources, workTracking, wishlist } from '@/backend/db/schema';
import { distributeIncome, calcHoursCost, calculateHourlyRate, setSetting } from '@/backend/lib/finance';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // --- TRANSACTION ---
    if (type === 'transaction') {
      await db.insert(transactions).values({
        amount: parseFloat(data.amount),
        currency: data.currency || 'EGP',
        category: data.category || 'شخصي',
        description: data.description || '',
        method: data.method || 'كاش',
        status: data.status || 'تم الصرف',
        isEssential: data.isEssential !== false,
        date: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    // --- ASSET ---
    if (type === 'asset') {
      await db.insert(assets).values({
        name: data.name || 'أصل جديد',
        type: data.assetType || data.type || 'كاش',
        liquidType: data.liquidType || 'مادي',
        value: parseFloat(data.amount),
        currency: data.currency || 'EGP',
        roi: parseFloat(data.roi || '0'),
        passiveIncome: parseFloat(data.passiveIncome || '0'),
        date: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    // --- INCOME (auto-distributes to wallets) ---
    if (type === 'income') {
      const amount = parseFloat(data.amount);
      const currency = data.currency || 'EGP';

      // Insert income record
      await db.insert(incomes).values({
        amount,
        currency,
        source: data.source || 'عام',
        description: data.description || 'دخل جديد',
        distributed: true,
        date: new Date().toISOString(),
      });

      // Auto-distribute to wallets
      const splits = await distributeIncome(amount, currency);
      return NextResponse.json({ success: true, splits });
    }

    // --- INVESTMENT ---
    if (type === 'investment') {
      const initial = parseFloat(data.initialValue || data.amount);
      const current = parseFloat(data.currentValue || data.amount);
      const roi = initial > 0 ? ((current - initial) / initial) * 100 : 0;
      await db.insert(investments).values({
        name: data.name,
        platform: data.platform || '',
        initialValue: initial,
        currentValue: current,
        roiPercentage: roi,
        currency: data.currency || 'EGP',
        date: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    // --- PASSIVE INCOME SOURCE ---
    if (type === 'passive_income') {
      await db.insert(passiveIncomeSources).values({
        source: data.source || data.name,
        monthlyAmount: parseFloat(data.amount),
        type: data.type || 'اشتراك',
        currency: data.currency || 'EGP',
        isActive: true,
      });
      return NextResponse.json({ success: true });
    }

    // --- WORK HOURS LOGGING ---
    if (type === 'hours') {
      await db.insert(workTracking).values({
        date: data.date || new Date().toISOString().split('T')[0],
        hoursWorked: parseFloat(data.hours),
        note: data.note || '',
      });
      return NextResponse.json({ success: true });
    }

    // --- WISHLIST ITEM ---
    if (type === 'wishlist') {
      const hourlyRate = await calculateHourlyRate();
      const price = parseFloat(data.price || '0');
      const hoursCost = calcHoursCost(price, hourlyRate);
      await db.insert(wishlist).values({
        name: data.name,
        price,
        currency: data.currency || 'EGP',
        link: data.link || null,
        hoursCost,
        priority: parseInt(data.priority || '1'),
        isPurchased: false,
        date: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, hoursCost });
    }

    // --- SETTINGS ---
    if (type === 'setting') {
      await setSetting(data.key, data.value);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('API ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
