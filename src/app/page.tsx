import DashboardClient from '@/frontend/components/DashboardClient';
import { db } from '@/backend/db';
import { transactions, assets, incomes, settings, wishlist } from '@/backend/db/schema';
import { desc, sql } from 'drizzle-orm';
import { Activity, ShieldAlert } from 'lucide-react';
import { 
  calculateNetWorth, 
  getForecasting, 
  calculateHourlyRate, 
  getSetting 
} from '@/backend/lib/finance';

export const revalidate = 0; // Force dynamic SSR

export default async function Home() {
  try {
    // 1. Fetch Core Data
    const [
      transactionData, 
      assetData, 
      incomeData, 
      wishlistData,
      netWorth,
      forecast,
      hourlyRate,
      usdRate,
      panicMode
    ] = await Promise.all([
      db.select().from(transactions).orderBy(desc(transactions.id)).limit(50),
      db.select().from(assets).orderBy(desc(assets.id)),
      db.select().from(incomes).orderBy(desc(incomes.id)).limit(10),
      db.select().from(wishlist).orderBy(desc(wishlist.id)),
      calculateNetWorth(),
      getForecasting(),
      calculateHourlyRate(),
      getSetting('usd_rate', '50'),
      getSetting('is_panic', '0'),
    ]);

    // 2. Prepare Data for Frontend
    return (
      <DashboardClient 
        transactions={transactionData}
        assets={assetData}
        incomes={incomeData}
        wishlist={wishlistData}
        netWorth={netWorth}
        forecast={forecast}
        hourlyRate={hourlyRate}
        settings={{
          usdRate: parseFloat(usdRate),
          isPanic: panicMode === '1'
        }}
      />
    );
  } catch (error: any) {
    console.error('SYSTEM DATABASE ERROR:', error);
    
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans select-none" dir="rtl">
        <div className="fixed inset-0 bg-red-500/5 blur-[120px] pointer-events-none" />
        
        <div className="glass-panel p-12 rounded-[2.5rem] border border-red-500/20 max-w-2xl w-full text-center space-y-8 shadow-[0_0_100px_rgba(239,68,68,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-16 -mt-16" />
          
          <div className="inline-flex p-5 rounded-3xl bg-red-500/10 border border-red-500/20 mb-2 relative">
            <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tighter">System Malfunction</h1>
            <p className="text-gray-400 font-medium leading-relaxed">حدث خطأ في استدعاء المحرك المالي الذكي. يرجى التأكد من استقرار قاعدة البيانات.</p>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-right space-y-3">
            <div className="flex items-center gap-3 text-red-400 font-bold text-sm">
              <Activity className="w-4 h-4" />
              <span>فشل في الاتصال (LOG):</span>
            </div>
            <p className="text-xs font-mono text-gray-500 break-all leading-loose" dir="ltr">
              {error.message || 'Critical Storage Failure'}
            </p>
          </div>

          <p className="text-[10px] uppercase font-black tracking-[4px] text-white/20">Emergency Protocols Active</p>
        </div>
      </div>
    );
  }
}
