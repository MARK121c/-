import DashboardClient from '@/components/DashboardClient';
import { getFinances, getTasks } from '@/lib/notion';

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
  } catch (error) {
    console.error('Error loading data from Notion:', error);
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-red-500">حدث خطأ أثناء تحميل البيانات</h1>
          <p className="text-gray-400">يرجى التأكد من أن مفاتيح Notion صحيحة وأن البوت متصل بالإنترنت.</p>
        </div>
      </div>
    );
  }
}
