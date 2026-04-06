import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { transactions, assets, incomes, settings, investments, passiveIncomeSources, workTracking, wishlist } from '@/backend/db/schema';
import { distributeIncome, calcHoursCost, calculateHourlyRate, setSetting, deductFromWallet } from '@/backend/lib/finance';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // --- TRANSACTION ---
    if (type === 'transaction') {
      const amount = parseFloat(data.amount);
      const category = data.category || 'شخصي';
      
      await db.insert(transactions).values({
        amount,
        currency: 'EGP',
        category,
        description: data.description || '',
        method: data.method || 'كاش',
        status: data.status || 'تم الصرف',
        isEssential: data.isEssential !== false,
        date: new Date().toISOString(),
      });

      // Deduct from wallet
      await deductFromWallet(amount, category);

      return NextResponse.json({ success: true });
    }

    // --- ASSET ---
    if (type === 'asset') {
      await db.insert(assets).values({
        name: data.name || 'أصل جديد',
        type: data.assetType || data.type || 'كاش',
        liquidType: data.liquidType || 'مادي',
        value: parseFloat(data.amount),
        currency: 'EGP',
        roi: parseFloat(data.roi || '0'),
        passiveIncome: parseFloat(data.passiveIncome || '0'),
        date: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    // --- INCOME (auto-distributes to wallets) ---
    if (type === 'income') {
      const amount = parseFloat(data.amount);

      // Insert income record
      await db.insert(incomes).values({
        amount,
        currency: 'EGP',
        source: data.source || 'عام',
        description: data.description || 'دخل جديد',
        distributed: true,
        date: new Date().toISOString(),
      });

      // Auto-distribute to wallets
      const splits = await distributeIncome(amount);
      return NextResponse.json({ success: true, splits });
    }

    // --- INVESTMENT ---
    if (type === 'investment') {
      const initial = parseFloat(data.initialValue || data.amount);
      const current = parseFloat(data.currentValue || data.initialValue || data.amount);
      const roi = initial > 0 ? ((current - initial) / initial) * 100 : 0;
      await db.insert(investments).values({
        name: data.name,
        platform: data.platform || '',
        initialValue: initial,
        currentValue: current,
        roiPercentage: roi,
        currency: 'EGP',
        date: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    // --- PASSIVE INCOME SOURCE ---
    if (type === 'passive_income') {
      await db.insert(passiveIncomeSources).values({
        source: data.source || data.name || 'دخل سلبي',
        monthlyAmount: parseFloat(data.monthlyAmount || data.amount),
        type: data.type || 'اشتراك',
        currency: 'EGP',
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
        currency: 'EGP',
        link: data.link || null,
        hoursCost,
        priority: parseInt(data.priority || '1'),
        isPurchased: false,
        date: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, hoursCost });
    }

    // --- INCOME DISTRIBUTION SETTINGS ---
    if (type === 'dist_update') {
      const { incomeDistribution } = await import('@/backend/db/schema');
      const existing = await db.select().from(incomeDistribution).limit(1);
      
      const values = {
        givingPercentage: parseFloat(data.giving),
        obligationsPercentage: parseFloat(data.obs),
        personalPercentage: parseFloat(data.pers),
        investmentPercentage: parseFloat(data.inv),
      };

      if (existing.length > 0) {
        await db.update(incomeDistribution).set(values).where(eq(incomeDistribution.id, existing[0].id));
      } else {
        await db.insert(incomeDistribution).values(values);
      }
      return NextResponse.json({ success: true });
    }

    // --- SETTINGS ---
    if (type === 'setting') {
      await setSetting(data.key, data.value);
      return NextResponse.json({ success: true });
    }

    // --- PROFIT UPDATE (ASSETS) ---
    if (type === 'profit') {
      const assetId = parseInt(data.selectedId as string);
      const profit = parseFloat(data.profitAmount);
      const profitInEGP = profit;

      const asset = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
      if (asset.length > 0) {
        // Update asset value
        await db.update(assets).set({ value: (asset[0].value || 0) + profitInEGP }).where(eq(assets.id, assetId));
        
        // Add to incomes and distribute
        await db.insert(incomes).values({
          amount: profitInEGP,
          currency: 'EGP',
          source: `ربح أصل: ${asset[0].name}`,
          description: data.duration || 'ربح دوري',
          distributed: true,
          date: new Date().toISOString(),
        });
        await distributeIncome(profitInEGP);
      }
      return NextResponse.json({ success: true });
    }

    // --- PROFIT UPDATE (INVESTMENTS) ---
    if (type === 'profit_inv') {
      const invId = parseInt(data.selectedId as string);
      const profit = parseFloat(data.profitAmount);
      const profitInEGP = profit;

      const inv = await db.select().from(investments).where(eq(investments.id, invId)).limit(1);
      if (inv.length > 0) {
        const newTotalValue = (inv[0].currentValue || 0) + profitInEGP;
        const newROI = inv[0].initialValue && inv[0].initialValue > 0 ? ((newTotalValue - inv[0].initialValue) / inv[0].initialValue) * 100 : 0;

        await db.update(investments).set({ currentValue: newTotalValue, roiPercentage: newROI }).where(eq(investments.id, invId));
        
        // Add to incomes and distribute
        await db.insert(incomes).values({
          amount: profitInEGP,
          currency: 'EGP',
          source: `ربح استثمار: ${inv[0].name}`,
          description: data.duration || 'توزيع أرباح',
          distributed: true,
          date: new Date().toISOString(),
        });
        await distributeIncome(profitInEGP);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('API ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
