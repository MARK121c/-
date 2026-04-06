import { db } from '../db';
import { settings, transactions, incomes, assets, investments, passiveIncomeSources, wallets, incomeDistribution, workTracking } from '../db/schema';
import { eq, sql, desc, gte } from 'drizzle-orm';

// --- SETTINGS HELPERS ---
export async function getSetting(key: string, defaultValue: string = '0'): Promise<string> {
  const result = await db.select().from(settings).where(eq(settings.key, key));
  return result[0]?.value || defaultValue;
}

export async function setSetting(key: string, value: string) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({
    target: [settings.key],
    set: { value },
  });
}

// --- INCOME DISTRIBUTION ENGINE ---
export async function distributeIncome(amount: number, currency: string = 'EGP', forcedUsdRate?: number) {
  const usdRate = forcedUsdRate || parseFloat(await getSetting('usd_rate', '50'));
  const amountInEGP = currency === 'USD' ? amount * usdRate : amount;

  // Get current distribution ratios
  const dist = await db.select().from(incomeDistribution).limit(1);
  const ratios = dist[0] || { givingPercentage: 0.1, obligationsPercentage: 0.2, personalPercentage: 0.1, investmentPercentage: 0.6 };

  const splits = {
    giving: amountInEGP * (ratios.givingPercentage ?? 0.1),
    obligations: amountInEGP * (ratios.obligationsPercentage ?? 0.2),
    personal: amountInEGP * (ratios.personalPercentage ?? 0.1),
    investment: amountInEGP * (ratios.investmentPercentage ?? 0.6),
  };

  // Update wallet balances
  for (const [walletId, addAmount] of Object.entries(splits)) {
    const wallet = await db.select().from(wallets).where(eq(wallets.id, walletId));
    const currentBalance = wallet[0]?.balance ?? 0;
    await db.update(wallets)
      .set({ balance: currentBalance + addAmount })
      .where(eq(wallets.id, walletId));
  }

  return splits;
}

// --- NET WORTH CALCULATOR ---
// Formula: Assets + Investments + (Passive Income * 12)
export async function calculateNetWorth(
  prefetchedAssets?: any[],
  prefetchedInvestments?: any[],
  prefetchedPassive?: any[]
) {
  const usdRate = parseFloat(await getSetting('usd_rate', '50'));
  const allAssets = prefetchedAssets || await db.select().from(assets).catch(() => []);
  const allInvestments = prefetchedInvestments || await db.select().from(investments).catch(() => []);
  const allPassive = prefetchedPassive || await db.select().from(passiveIncomeSources).where(eq(passiveIncomeSources.isActive, true)).catch(() => []);

  let assetsTotal = 0;
  let investmentsTotal = 0;
  let passiveIncomeMonthly = 0;
  let passiveIncomeData = 0;

  allAssets.forEach(a => {
    const val = a.currency === 'USD' ? (a.value ?? 0) * usdRate : (a.value ?? 0);
    assetsTotal += val;
    passiveIncomeData += (a.passiveIncome ?? 0);
  });

  allInvestments.forEach(inv => {
    const val = inv.currency === 'USD' ? (inv.currentValue ?? 0) * usdRate : (inv.currentValue ?? 0);
    investmentsTotal += val;
  });

  allPassive.forEach(src => {
    const monthly = src.currency === 'USD' ? (src.monthlyAmount ?? 0) * usdRate : (src.monthlyAmount ?? 0);
    passiveIncomeMonthly += monthly;
  });

  const totalPassiveAnnual = (passiveIncomeMonthly + passiveIncomeData) * 12;
  const totalEGP = assetsTotal + investmentsTotal + totalPassiveAnnual;

  return {
    totalEGP,
    totalUSD: totalEGP / usdRate,
    assetsTotal,
    investmentsTotal,
    passiveIncomeMonthly: passiveIncomeMonthly + passiveIncomeData,
    passiveIncomeAnnual: totalPassiveAnnual,
  };
}

// --- DYNAMIC HOURLY RATE ---
// Formula: Net Profit / (Work Hours This Month)
export async function calculateHourlyRate() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Get total work hours this month from manual tracking
  const workRes = await db.select({ total: sql<number>`coalesce(sum(hours_worked), 0)` })
    .from(workTracking)
    .where(gte(workTracking.date, startOfMonth));
  const totalHours = workRes[0]?.total ?? 0;

  // Fallback: use stored settings if no tracking entries
  if (totalHours < 1) {
    const workHoursDay = parseFloat(await getSetting('work_hours_per_day', '8'));
    const workDaysMonth = parseFloat(await getSetting('work_days_per_month', '22'));
    const fallbackHours = workHoursDay * workDaysMonth;

    const incomeRes = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` }).from(incomes);
    const expenseRes = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` }).from(transactions);
    const profit = (incomeRes[0]?.total ?? 0) - (expenseRes[0]?.total ?? 0);
    return fallbackHours > 0 ? profit / fallbackHours : 0;
  }

  // Use actual tracked hours
  const incomeRes = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` }).from(incomes)
    .where(gte(incomes.date, startOfMonth));
  const expenseRes = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` }).from(transactions)
    .where(gte(transactions.date, startOfMonth));

  const profit = (incomeRes[0]?.total ?? 0) - (expenseRes[0]?.total ?? 0);
  return totalHours > 0 ? profit / totalHours : 0;
}

// --- LIFE-TIME VALUE: Hours cost for a price ---
export function calcHoursCost(price: number, hourlyRate: number): number {
  return hourlyRate > 0 ? price / hourlyRate : 0;
}

// --- FORECASTING ENGINE ---
// Predicts when liquid assets will run out
export async function getForecasting(prefetchedAssets?: any[]) {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const spentRes = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` }).from(transactions)
    .where(gte(transactions.date, startOfMonth));
  const totalSpent = spentRes[0]?.total ?? 0;

  const avgDailySpent = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const projectedEndMonthSpent = avgDailySpent * daysInMonth;
  const remainingDays = daysInMonth - dayOfMonth;

  // Get liquid assets (cash + bank)
  const allAssets = prefetchedAssets || await db.select().from(assets).catch(() => []);
  const liquidAssets = allAssets.filter(a => a.liquidType === 'سائل' || (a.liquidType !== 'مادي' && (a.type === 'بنك' || a.type === 'كاش')));
  const usdRate = parseFloat(await getSetting('usd_rate', '50'));
  let liquidTotal = 0;
  liquidAssets.forEach(a => {
    liquidTotal += a.currency === 'USD' ? (a.value ?? 0) * usdRate : (a.value ?? 0);
  });

  const daysUntilEmpty = avgDailySpent > 0 ? Math.floor(liquidTotal / avgDailySpent) : 999;
  const emptyDate = new Date(today);
  emptyDate.setDate(today.getDate() + daysUntilEmpty);

  return {
    avgDailySpent,
    projectedEndMonthSpent,
    liquidTotal,
    daysUntilEmpty,
    emptyDate: emptyDate.toLocaleDateString('ar-EG'),
    isBankruptcyRisk: daysUntilEmpty < 30,
    remainingDays,
  };
}

// --- WALLETS SUMMARY ---
export async function getWallets() {
  return await db.select().from(wallets);
}

// --- DISTRIBUTION SETTINGS ---
export async function getDistributionSettings() {
  const dist = await db.select().from(incomeDistribution).limit(1);
  return dist[0] || { givingPercentage: 0.1, obligationsPercentage: 0.2, personalPercentage: 0.1, investmentPercentage: 0.6 };
}
