import { db } from '../db';
import { settings, transactions, incomes, assets } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

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

// --- FINANCIAL CALCULATIONS ---

/**
 * Calculates the hourly rate based on monthly profit and work schedule.
 * Formula: (Total Incomes - Total Expenses) / (Days * Hours)
 */
export async function calculateHourlyRate() {
  const workHours = parseFloat(await getSetting('work_hours_per_day', '8'));
  const workDays = parseFloat(await getSetting('work_days_per_month', '22'));
  
  // Get current month's profit (simplified for now: total income - total expense)
  const totalIncomeResult = await db.select({ total: sql<number>`sum(amount)` }).from(incomes);
  const totalExpenseResult = await db.select({ total: sql<number>`sum(amount)` }).from(transactions);
  
  const profit = (totalIncomeResult[0].total || 0) - (totalExpenseResult[0].total || 0);
  const totalHours = workHours * workDays;
  
  return totalHours > 0 ? (profit / totalHours) : 0;
}

/**
 * Distributes incoming income according to the defined percentages.
 */
export async function getIncomeDistribution(amount: number) {
  const godRatio = parseFloat(await getSetting('ratio_god', '0.1')); // 10%
  const commitRatio = parseFloat(await getSetting('ratio_commitment', '0.2')); // 20%
  const personalRatio = parseFloat(await getSetting('ratio_personal', '0.1')); // 10%
  const investRatio = parseFloat(await getSetting('ratio_investment', '0.6')); // 60%

  return {
    god: amount * godRatio,
    commitment: amount * commitRatio,
    personal: amount * personalRatio,
    investment: amount * investRatio,
  };
}

/**
 * Calculates total Net Worth in EGP using the manual USD rate.
 */
export async function calculateNetWorth() {
  const usdRate = parseFloat(await getSetting('usd_rate', '50'));
  const allAssets = await db.select().from(assets);
  
  let totalEGP = 0;
  let passiveIncome = 0;

  allAssets.forEach(asset => {
    const value = asset.value || 0;
    const valueInEGP = asset.currency === 'USD' ? value * usdRate : value;
    totalEGP += valueInEGP;
    passiveIncome += (asset.passiveIncome || 0);
  });

  return {
    totalEGP,
    totalUSD: totalEGP / usdRate,
    passiveIncome,
  };
}

/**
 * Forecasts balance for the end of the month based on average daily spending.
 */
export async function getForecasting() {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  
  const totalSpentResult = await db.select({ total: sql<number>`sum(amount)` }).from(transactions);
  const totalSpent = totalSpentResult[0].total || 0;
  
  const avgDailySpent = totalSpent / dayOfMonth;
  const projectedEndMonthSpent = avgDailySpent * daysInMonth;
  
  return {
    avgDailySpent,
    projectedEndMonthSpent,
    isBankruptcyRisk: projectedEndMonthSpent > (await calculateNetWorth()).totalEGP * 0.5, // Arbitrary 50% threshold
  };
}
