import DashboardClient from '@/components/DashboardClient';
import { getFinances, getTasks } from '@/lib/notion';
import { Activity, AlertCircle } from 'lucide-react';

export const revalidate = 0; // Force dynamic SSR

export default async function Home() {
  try {
    const [finances, tasks] = await Promise.all([
      getFinances(),
      getTasks()
    ]);

    return (
      <DashboardClient finances={finances} tasks={tasks} />
    );
  } catch (error: any) {
    console.error('CRITICAL NOTION ERROR:', {
      message: error.message,
      code: error.code,
      status: error.status,
      body: error.body,
    });
    
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans p-6" dir="rtl">
        <div className="glass-panel p-10 rounded-3xl border border-red-500/20 max-w-xl w-full text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
          <div className="inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-2">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">حدث خطأ أثناء جلب البيانات</h1>
          <div className="space-y-4 text-gray-400">
            <p>يبدو أن هناك مشكلة في الربط مع Notion. يرجى التأكد من الآتي:</p>
            <ul className="text-sm space-y-2 list-disc list-inside bg-white/5 p-4 rounded-xl border border-white/5 text-right">
              <li>تمت إضافة الـ <span className="text-primary">Integration</span> لكل قاعدة بيانات عبر (Connect to).</li>
              <li>مفاتيح الـ <span className="text-primary">Environment Variables</span> في Coolify صحيحة.</li>
              <li>قواعد البيانات الأربعة متاحة ولم يتم حذفها.</li>
            </ul>
          </div>
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-6 p-4 bg-red-900/20 rounded-xl border border-red-900/30 text-xs font-mono text-red-300 text-left overflow-x-auto" dir="ltr">
              Error Profile: {error.message || 'Unknown Error'}
              {error.code && ` [Code: ${error.code}]`}
            </div>
          )}
          <a 
            href="https://developers.notion.com/docs/getting-started#step-2-share-a-database-with-your-integration" 
            target="_blank" 
            className="inline-block text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            كيفية ربط الـ Integration بقاعدة البيانات؟
          </a>
        </div>
      </div>
    );
  }
}
