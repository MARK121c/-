import DashboardClient from '@/frontend/components/DashboardClient';
import { db } from '@/backend/db';
import { createClient } from '@libsql/client';
import { 
  transactions, assets, incomes, wishlist, investments, 
  passiveIncomeSources, wallets, workTracking, resources,
  tasks, routines, events, subscriptions
} from '@/backend/db/schema';
import { desc, eq } from 'drizzle-orm';
import { ShieldAlert } from 'lucide-react';
import { 
  calculateNetWorth, 
  getForecasting, 
  calculateHourlyRate, 
  getSetting,
  getWallets,
  getDistributionSettings,
} from '@/backend/lib/finance';
import { ensureTables } from '@/backend/db/migrate';

export const revalidate = 0;

const rawClient = createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

export default async function Home() {
  let migrationLogs: string[] = [];
  
  try {
    const result = await ensureTables();
    migrationLogs = result.logs;

    // Defensive query for assets to avoid DB schema inconsistencies crashing the page
    const assetData = await db.select().from(assets).orderBy(desc(assets.id)).catch(async () => {
      const r = await rawClient.execute(`SELECT id, name, type, value, currency, COALESCE(roi,0) as roi, COALESCE(passive_income,0) as passive_income, date FROM assets ORDER BY id DESC`);
      return r.rows.map((row: any) => ({
        id: row[0]??row.id, name: row[1]??row.name, type: row[2]??row.type,
        liquidType: 'مادي', value: row[3]??row.value, currency: row[4]??row.currency,
        roi: row[5]??0, passiveIncome: row[6]??0, date: row[7]??row.date
      }));
    });

    const investmentData = await db.select().from(investments).orderBy(desc(investments.id)).catch(() => []);
    const passiveSourcesData = await db.select().from(passiveIncomeSources).where(eq(passiveIncomeSources.isActive, true)).catch(() => []);

    // Always-safe queries
    const results = await Promise.all([
      db.select().from(transactions).orderBy(desc(transactions.id)).limit(50),
      db.select().from(incomes).orderBy(desc(incomes.id)).limit(20),
      db.select().from(wishlist).orderBy(desc(wishlist.id)),
      db.select().from(resources).orderBy(desc(resources.createdAt)).limit(10),
      db.select().from(tasks).where(eq(tasks.type, 'today')).orderBy(desc(tasks.priority)),
      db.select().from(routines).where(eq(routines.isActive, true)),
      db.select().from(events).orderBy(desc(events.date)).limit(10),
      db.select().from(subscriptions).where(eq(subscriptions.status, 'active')),
      calculateNetWorth(assetData, investmentData, passiveSourcesData),
      getForecasting(assetData),
      calculateHourlyRate(),
      getSetting('is_panic', '0'),
      getSetting('notion_url', ''),
      getDistributionSettings(),
    ]);

    const [
      transactionData, incomeData, wishlistData, resourceData, 
      tasksToday, activeRoutines, upcomingEvents, activeSubscriptions,
      netWorth, forecast, hourlyRate, panicMode, notionUrl, distSettings
    ] = results;

    const walletsData = await getWallets().catch(() => []);
    const workData = await db.select().from(workTracking).orderBy(desc(workTracking.id)).limit(30).catch(() => []);

    return (
      <DashboardClient 
        transactions={transactionData}
        assets={assetData}
        incomes={incomeData}
        wishlist={wishlistData}
        investments={investmentData}
        passiveSources={passiveSourcesData}
        wallets={walletsData}
        workTracking={workData}
        resources={resourceData}
        tasksToday={tasksToday}
        activeRoutines={activeRoutines}
        upcomingEvents={upcomingEvents}
        activeSubscriptions={activeSubscriptions}
        netWorth={netWorth}
        forecast={forecast}
        hourlyRate={hourlyRate}
        distributionSettings={distSettings}
        settings={{
          isPanic: panicMode === '1',
          notionUrl,
        }}
      />
    );
  } catch (error: any) {
    console.error('SYSTEM ERROR:', error);
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans select-none" dir="rtl">
        <div className="fixed inset-0 bg-red-500/5 blur-[120px] pointer-events-none" />
        <div className="p-12 rounded-[2.5rem] border border-red-500/20 max-w-2xl w-full text-center space-y-8 bg-white/[0.02]">
          <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse mx-auto" />
          <h1 className="text-4xl font-black tracking-tighter">System Error (V5)</h1>
          <div className="bg-black/50 p-4 rounded-2xl font-mono text-[10px] text-gray-500 text-left overflow-y-auto max-h-40 border border-white/5">
            {migrationLogs.map((log, i) => <div key={i}>{`> ${log}`}</div>)}
            <div className="mt-4 text-red-400 font-bold">{`ERROR: ${error.message}`}</div>
          </div>
        </div>
      </div>
    );
  }
}
