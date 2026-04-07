"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { 
  Activity, Wallet, Shield, Menu, X, Settings, ExternalLink, Target, 
  Gem, LayoutDashboard, Briefcase, ListTodo, HeartPulse, CreditCard, 
  Banknote, Sparkles, Users, BookOpen, Wrench, Video, Brain, Link as LinkIcon,
  Plus, Trash2, History, Clock, AlertTriangle, Save, Check, ChevronLeft
} from 'lucide-react';
import TaskClient from './TaskClient';
import RoutineClient from './RoutineClient';
import SubscriptionClient from './SubscriptionClient';
import EventsClient from './EventsClient';
import LibraryClient from './LibraryClient';

interface Props {
  transactions: any[]; assets: any[]; incomes: any[]; wishlist: any[];
  investments: any[]; passiveSources: any[]; wallets: any[]; workTracking: any[];
  resources: any[];
  tasksToday: any[]; activeRoutines: any[]; upcomingEvents: any[]; activeSubscriptions: any[];
  netWorth: any; forecast: any; hourlyRate: number; distributionSettings: any;
  settings: { isPanic: boolean; notionUrl: string };
}

const COLORS = ['var(--color-emerald-glow)', 'var(--color-blue-glow)', 'var(--color-amber-glow)', 'var(--color-purple-glow)', 'var(--color-rose-glow)', '#06b6d4'];
const fmt = (n: number) => <span className="eng-num">{Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>;

export default function DashboardClient({ 
  transactions, assets, incomes, wishlist, investments, 
  passiveSources, wallets, workTracking, resources, 
  tasksToday, activeRoutines, upcomingEvents, activeSubscriptions,
  netWorth, forecast, hourlyRate, distributionSettings, settings 
}: Props) {
  const [mainTab, setMainTab] = useState('overview');
  const [financeTab, setFinanceTab] = useState('networth'); // sub-tab for finance

  // Persistent Tab State
  useEffect(() => {
    const savedMain = localStorage.getItem('mainTab');
    const savedFinance = localStorage.getItem('financeTab');
    if (savedMain) setMainTab(savedMain);
    if (savedFinance) setFinanceTab(savedFinance);
  }, []);

  useEffect(() => {
    localStorage.setItem('mainTab', mainTab);
    localStorage.setItem('financeTab', financeTab);
  }, [mainTab, financeTab]);

  const [mobileSidebar, setMobileSidebar] = useState(false);

  // Financial Aggregations
  const totalIncome = incomes?.reduce((acc, current) => acc + (current.amount || 0), 0) || 0;
  const totalSpentGiving = transactions?.filter(t => t.category === 'عطاء' || t.category === 'شخصي لله').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const totalSpentInvest = transactions?.filter(t => t.category === 'استثمار').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const totalSpentPersonal = transactions?.filter(t => t.category === 'شخصي').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  const [modal, setModal] = useState<string|null>(null);
  const [panic, setPanic] = useState(settings.isPanic);
  const [notionUrl, setNotionUrl] = useState(settings.notionUrl);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ amount:'', currency:'EGP', description:'', name:'', category:'شخصي', method:'كاش', status:'تم الصرف', source:'عام', hours:'', date: new Date().toISOString().split('T')[0], assetType:'كاش', liquidType:'سائل', initialValue:'', currentValue:'', platform:'', price:'', priority:'1', notes: '', profitAmount:'', duration:'', monthlyAmount:'', type: 'اشتراك' });
  
  // Last Income Split Calculation
  const lastIncome = incomes?.[0]; // incomes are desc by date
  const lastSplits = lastIncome ? {
    giving: lastIncome.amount * (distributionSettings?.givingPercentage || 0.1),
    obligations: lastIncome.amount * (distributionSettings?.obligationsPercentage || 0.2),
    personal: lastIncome.amount * (distributionSettings?.personalPercentage || 0.1),
    investment: lastIncome.amount * (distributionSettings?.investmentPercentage || 0.6),
  } : null;
  
  const [selectedId, setSelectedId] = useState<number|string|null>(null);

  const post = async (type: string, data: any) => {
    setSaving(true);
    await fetch('/api/finance/add', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type, data: { ...data, selectedId } }) });
    setSaving(false);
    setModal(null);
    setSelectedId(null);
    window.location.reload();
  };

  const remove = async (table: string, id: number) => {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا السجل نهائياً؟')) return;
    setSaving(true);
    const res = await fetch('/api/finance/delete', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id }) 
    });
    if (res.ok) window.location.reload();
    else setSaving(false);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); post(modal!, form); };

  const barData = [
    ...incomes.slice(0, 6).map((_, i) => ({ name: `شهر ${i + 1}`, الدخل: incomes[i]?.amount || 0, المصروفات: transactions[i]?.amount || 0 }))
  ].reverse();

  const pieData = Object.entries(transactions.reduce((acc: any, t: any) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {})).map(([name, val]) => ({ name, value: val as number }));

  const getTypeIcon = (type: string) => {
    if (type === 'video') return <Video size={20} />;
    if (type === 'tool') return <Wrench size={20} />;
    if (type === 'idea') return <Brain size={20} />;
    return <LinkIcon size={20} />;
  };

  const mainNavItems = [
    { id: 'overview', icon: <LayoutDashboard size={24} />, label: 'لوحة التحكم' },
    { id: 'finance', icon: <Wallet size={24} />, label: 'الإدارة المالية' },
    { id: 'wishlist', icon: <Target size={24} />, label: 'الأمنيات' },
    { id: 'tasks', icon: <ListTodo size={24} />, label: 'المهام' },
    { id: 'routines', icon: <HeartPulse size={24} />, label: 'الروتين' },
    { id: 'subscriptions', icon: <CreditCard size={24} />, label: 'الاشتراكات' },
    { id: 'library', icon: <BookOpen size={24} />, label: 'مكتبة المعرفة' },
    { id: 'events', icon: <Users size={24} />, label: 'المواعيد والأصدقاء' },
    { id: 'settings', icon: <Settings size={24} />, label: 'الإعدادات' },
  ];

  const financeTabs = [
    { id: 'networth', label: 'صافي الثروة', icon: <Sparkles size={18}/> },
    { id: 'assets', label: 'الأصول', icon: <Briefcase size={18}/> },
    { id: 'investments', label: 'الاستثمارات', icon: <Activity size={18}/> },
    { id: 'passive', label: 'الدخل السلبي', icon: <Sparkles size={18}/> },
    { id: 'wallets', label: 'المحافظ', icon: <Gem size={18}/> },
    { id: 'transactions', label: 'المعاملات', icon: <CreditCard size={18}/> },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full gap-8">
      <div className="flex items-center gap-4 px-2">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 neon-text-emerald shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          <Shield size={30} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight eng-num">MARK OS</h1>
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest leading-none">V 4.0 Core</p>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {mainNavItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => { setMainTab(item.id); setMobileSidebar(false); }} 
            className={`flex items-center gap-4 p-5 rounded-3xl text-xl font-bold transition-all group ${mainTab === item.id ? 'bg-white/10 text-white border border-white/20 shadow-xl' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <div className={`transition-transform duration-300 ${mainTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</div>
            {item.label}
            {mainTab === item.id && <motion.div layoutId="sidebarPill" className="mr-auto w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest text-center">محرك التجربة CORE V4</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-super-dark text-white overflow-hidden font-sans font-bold" dir="rtl">
      
      {panic && <div className="absolute inset-0 bg-red-500/10 z-0 pointer-events-none animate-pulse" />}

      <aside className="hidden lg:flex flex-col w-[320px] h-full bg-white/2 border-l border-white/10 p-8 backdrop-blur-3xl z-40">
        <SidebarContent />
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white/5 backdrop-blur-3xl border-b border-white/10 z-30 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Shield size={20} />
           </div>
           <h1 className="text-xl font-black eng-num">MARK OS</h1>
        </div>
        <button onClick={() => setMobileSidebar(true)} className="p-3 rounded-xl bg-white/5 border border-white/10"><Menu size={24} /></button>
      </header>

      <AnimatePresence>
        {mobileSidebar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex justify-end">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="w-80 h-full bg-super-dark border-l border-white/10 p-6">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black">القائمة</h2>
                <button onClick={() => setMobileSidebar(false)} className="p-3 bg-white/5 rounded-xl border border-white/10"><X size={24}/></button>
              </div>
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative scroll-smooth pt-28 lg:pt-16 px-6 md:px-12 pb-60">
        <AnimatePresence mode="wait">

          {mainTab === 'overview' && (
            <motion.div key="ov" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-12 max-w-7xl mx-auto pb-20">
              
              {/* --- HERO SECTION --- */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black mb-3 flex items-center gap-4">مركز القيادة <Sparkles className="text-amber-400 w-10 h-10 animate-pulse" /></h2>
                  <p className="text-lg text-gray-400 bg-white/5 border border-white/10 px-4 py-1.5 rounded-2xl inline-block backdrop-blur-md">
                    مرحباً مارك، إليك حالة النظام الحالية وتوقعاتك المالية.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl">
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">صافي الثروة</p>
                      <p className="text-2xl font-black eng-num">{fmt(netWorth.totalEGP)} <span className="text-sm opacity-50">EGP</span></p>
                   </div>
                   <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-3 rounded-2xl">
                      <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mb-1">معدل الساعة</p>
                      <p className="text-2xl font-black eng-num">{fmt(hourlyRate)} <span className="text-sm opacity-50">EGP</span></p>
                   </div>
                </div>
              </div>

              {/* --- MAIN DASHBOARD MATRIX --- */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. TODAY'S FOCUS (TASKS) */}
                <div className="grand-card p-10 bg-white/[0.03] border-white/10 flex flex-col h-full ring-1 ring-white/5">
                   <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-black flex items-center gap-3 text-emerald-400"><Target size={24}/> تركيز اليوم</h3>
                      <button onClick={() => setMainTab('tasks')} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><ExternalLink size={18}/></button>
                   </div>
                   <div className="space-y-4 flex-1">
                      {tasksToday?.filter(t => t.status === 'pending').slice(0, 3).map((task, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 hover:bg-emerald-500/10 transition-all group">
                           <div className={`w-3 h-3 rounded-full ${task.priority === 'critical' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-emerald-400'}`} />
                           <span className="font-bold text-lg flex-1 truncate">{task.title}</span>
                           <span className="text-[10px] text-gray-500 font-black eng-num bg-black/20 px-2 py-1 rounded-lg">{task.estimatedTime}m</span>
                        </div>
                      ))}
                      {(!tasksToday || tasksToday.filter(t => t.status === 'pending').length === 0) && (
                        <div className="p-12 text-center text-gray-600 font-bold italic bg-black/20 rounded-2xl border border-dashed border-white/5">لا يوجد مهام محددة لليوم حالياً.</div>
                      )}
                   </div>
                   <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                      <p className="text-sm text-gray-500">المهام المنجزة</p>
                      <p className="text-xl font-black text-emerald-400 eng-num">{tasksToday?.filter(t => t.status === 'done').length} / {tasksToday?.length}</p>
                   </div>
                </div>

                {/* 2. NOTION HUB (THE USER REQUESTED ITEM) */}
                <div className="lg:col-span-2 grand-card p-0 bg-blue-500/5 border-blue-500/10 overflow-hidden relative group">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-50" />
                   <div className="relative p-10 flex flex-col md:flex-row gap-10 h-full">
                      <div className="flex-1 space-y-6">
                         <div className="flex items-center gap-4 text-blue-400">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                               <Activity size={28}/>
                            </div>
                            <h3 className="text-3xl font-black">Notion Workspace</h3>
                         </div>
                         <p className="text-gray-400 text-lg leading-relaxed max-w-md">إدارة مركزية متقدمة عبر Notion. يمكنك الوصول السريع لقواعد البيانات الأساسية والتعديل الفوري.</p>
                         <div className="flex flex-wrap gap-3">
                            {[
                               { label: 'المالية', url: 'https://www.notion.so/Personal-finances-685797555bc5459b9e437cb1a60d402a' },
                               { label: 'المهام', url: 'https://www.notion.so/TASKS-e3a2ec77ffc540789162476c555b8442' },
                               { label: 'الشركة', url: 'https://www.notion.so/Creziax-Team-538747555bc5459b9e437cb1a60d402a' }
                            ].map(link => (
                               <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm font-black hover:bg-blue-500/20 transition-all flex items-center gap-2">
                                  <ExternalLink size={14}/> {link.label}
                               </a>
                            ))}
                         </div>
                         <a href={settings.notionUrl || 'https://www.notion.so/HOME-PAGE-e3a2ec77ffc540789162476c555b8442'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black text-xl hover:bg-amber-400 transition-all active:scale-95 shadow-[0_10px_40px_rgba(255,255,255,0.2)]">
                            فتح لوحة Notion الكاملة <ChevronLeft size={24}/>
                         </a>
                      </div>
                      <div className="md:w-64 flex flex-col gap-4">
                         <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 p-6 flex flex-col justify-center text-center">
                            <p className="text-4xl font-black text-white mb-1 eng-num">{assets?.length + investments?.length}</p>
                            <p className="text-xs text-gray-500 uppercase font-black tracking-widest">أصول واستثمارات</p>
                         </div>
                         <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 p-6 flex flex-col justify-center text-center">
                            <p className="text-4xl font-black text-blue-400 mb-1 eng-num">{resources?.length}</p>
                            <p className="text-xs text-gray-500 uppercase font-black tracking-widest">معرفة محفوظة</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* 3. LIFESTYLE & ROUTINE */}
                <div className="grand-card p-10 bg-amber-500/5 border-amber-500/10 h-full">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-2xl font-black flex items-center gap-3 text-amber-400"><HeartPulse size={24}/> الروتين والعناية</h3>
                       <button onClick={() => setMainTab('routines')} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><ExternalLink size={18}/></button>
                    </div>
                    <div className="space-y-6">
                       <div className="p-6 bg-black/30 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">الروتينات النشطة</p>
                          <div className="flex items-center justify-between">
                             <p className="text-3xl font-black text-white eng-num">{activeRoutines?.length}</p>
                             <div className="flex gap-1">
                                {[1,2,3,4,5].map(i => <div key={i} className={`w-2 h-6 rounded-full ${i <= 3 ? 'bg-amber-400' : 'bg-white/10'}`} />)}
                             </div>
                          </div>
                       </div>
                       <div className="space-y-3">
                          {activeRoutines?.slice(0, 2).map((r, i) => (
                             <div key={i} className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 group hover:border-amber-500/30 transition-all">
                                <span className="font-bold text-lg">{r.name}</span>
                                <span className="text-[10px] text-amber-400 font-black uppercase px-2 py-1 bg-amber-400/10 rounded-lg">{r.category}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                </div>

                {/* 4. UPCOMING EVENTS */}
                <div className="grand-card p-10 bg-purple-500/5 border-purple-500/10 h-full">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-2xl font-black flex items-center gap-3 text-purple-400"><Users size={24}/> المواعيد القادمة</h3>
                       <button onClick={() => setMainTab('events')} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><ExternalLink size={18}/></button>
                    </div>
                    <div className="space-y-4">
                       {upcomingEvents?.slice(0, 3).map((ev, i) => (
                         <div key={i} className="flex items-center gap-5 p-5 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex flex-col items-center justify-center font-black">
                               <span className="text-xs eng-num">{new Date(ev.date).toLocaleString('ar-EG', { month: 'short' })}</span>
                               <span className="text-xl eng-num">{new Date(ev.date).getDate()}</span>
                            </div>
                            <div className="flex-1">
                               <p className="font-bold text-lg text-white leading-tight mb-0.5">{ev.title}</p>
                               <p className="text-xs text-gray-500 font-black uppercase">{ev.type} · <span className="eng-num">{ev.time || 'All Day'}</span></p>
                            </div>
                         </div>
                       ))}
                       {(!upcomingEvents || upcomingEvents.length === 0) && (
                         <div className="p-12 text-center text-gray-600 font-bold italic">لا توجد مواعيد قريبة.</div>
                       )}
                    </div>
                </div>

                {/* 5. SMART FINANCIAL ALERTS */}
                <div className="grand-card p-10 bg-rose-500/5 border-rose-500/10 flex flex-col">
                   <h3 className="text-2xl font-black flex items-center gap-3 text-rose-400 mb-8"><AlertTriangle size={24}/> تنبيهات ذكية</h3>
                   <div className="space-y-4 flex-1">
                      {forecast.isBankruptcyRisk && (
                        <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-pulse">
                           <p className="text-rose-400 font-black mb-1">تحذير سيولة!</p>
                           <p className="text-xs text-rose-400/70 font-bold">توقعات الصرف بنهاية الشهر تتخطى الرصيد الحالي المتاح.</p>
                        </div>
                      )}
                      {activeSubscriptions?.filter(s => s.status === 'due').map((sub, i) => (
                        <div key={i} className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                           <p className="text-amber-400 font-black mb-1">تجديد اشتراك: {sub.name}</p>
                           <p className="text-xs text-amber-400/70 font-bold">تاريخ الاستحقاق: <span className="eng-num">{sub.nextPaymentDate}</span></p>
                        </div>
                      ))}
                      {!forecast.isBankruptcyRisk && activeSubscriptions?.filter(s => s.status === 'due').length === 0 && (
                        <div className="p-12 flex flex-col items-center justify-center text-center">
                           <Check className="text-emerald-400 mb-4" size={48}/>
                           <p className="text-gray-500 font-bold">النظام المالي مستقر تماماً.</p>
                        </div>
                      )}
                   </div>
                   <div className="mt-8 pt-6 border-t border-white/5">
                      <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-2">التوقع المالي النهائي</p>
                      <p className="text-4xl font-black eng-num">{fmt(forecast.projectedEndMonthSpent)} <span className="text-sm opacity-40">EGP</span></p>
                   </div>
                </div>

              </div>

              {/* --- KNOWLEDGE STREAM --- */}
              <div className="grand-card p-10 bg-white/[0.02] border-white/5">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black flex items-center gap-4 text-white"><BookOpen className="text-emerald-400" size={28}/> من أحدث إضافات المعمل</h3>
                    <button onClick={() => setMainTab('library')} className="mega-action-btn bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-6 py-2 text-sm">عرض المكتبة</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {resources?.slice(0, 4).map((res, i) => (
                      <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:border-emerald-500/30 transition-all group cursor-pointer overflow-hidden relative">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl group-hover:scale-150 transition-all" />
                         <div className="flex justify-between items-start mb-6 relative">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/10">
                               {getTypeIcon(res.type)}
                            </div>
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{res.category}</span>
                         </div>
                         <p className="font-black text-xl text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight mb-2 relative">{res.title}</p>
                         <p className="text-xs text-gray-600 font-bold italic relative eng-num">{new Date(res.createdAt).toLocaleDateString('ar-EG')}</p>
                      </div>
                    ))}
                 </div>
              </div>

            </motion.div>
          )}

          {mainTab === 'finance' && (
            <motion.div key="fi" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-10 max-w-[1400px] mx-auto flex flex-col h-full">
              
              <div className="sticky top-0 z-40 bg-super-dark pt-4 pb-2 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 transition-all">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black mb-1">النظام المالي العميق</h2>
                    <p className="text-sm text-gray-500 mb-1">إدارة مركزية لكافة الأصول، الاستثمارات، والمحافظ بذكاء فائق.</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                      <a href="https://www.notion.so/Personal-finances-685797555bc5459b9e437cb1a60d402a" target="_blank" rel="noopener noreferrer" className="mega-action-btn bg-blue-500/10 text-blue-300 border border-blue-500/20 px-4 py-2 text-xs hover:bg-blue-500/20">
                        <ExternalLink size={14}/> Notion
                      </a>
                      <button onClick={() => { setForm({ ...form, currency: 'EGP' }); setModal('income'); }} className="mega-action-btn bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 text-xs hover:bg-emerald-500/20">
                        <Wallet size={14}/> تسجيل دخل
                      </button>
                      <button onClick={() => { setForm({ ...form, currency: 'EGP' }); setModal('transaction'); }} className="mega-action-btn bg-rose-500/10 text-rose-400 border border-rose-500/20 px-4 py-2 text-xs hover:bg-rose-500/20">
                        <Banknote size={14}/> تسجيل صرف
                      </button>
                      <button onClick={() => { setForm({ ...form }); setModal('asset'); }} className="mega-action-btn bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 px-4 py-2 text-xs">+ أصل</button>
                      <button onClick={() => { setForm({ ...form }); setModal('investment'); }} className="mega-action-btn bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 px-4 py-2 text-xs">+ استثمار</button>
                      <button onClick={() => { setForm({ ...form }); setModal('passive_income'); }} className="mega-action-btn bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 px-4 py-2 text-xs">+ دخل سلبي</button>
                  </div>
                </div>

                <div className="flex overflow-x-auto gap-4 scrollbar-hide py-4 w-full border-b border-white/5 bg-super-dark/50 backdrop-blur-md">
                  {financeTabs.map(tab => (
                    <button key={tab.id} onClick={() => setFinanceTab(tab.id)} className={`relative flex items-center gap-3 px-6 py-2 rounded-full text-lg font-black transition-all whitespace-nowrap ${financeTab === tab.id ? 'text-black' : 'text-gray-500 bg-white/2 hover:text-white hover:bg-white/5'}`}>
                      {financeTab === tab.id && <motion.div layoutId="financeTabPill" className="absolute inset-0 bg-emerald-400 rounded-full shadow-[0_5px_20px_rgba(16,185,129,0.3)]" style={{ originY: "0px" }} />}
                      <span className="relative z-10 flex items-center gap-2">{tab.icon} {tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 py-8 min-h-[1000px]">
                <AnimatePresence mode="wait">
                  
                  {financeTab === 'networth' && (
                    <motion.div key="fnw" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-3 grand-card p-12 bg-gradient-to-br from-emerald-500/10 via-super-dark to-blue-500/10 border-emerald-500/20 flex flex-col md:flex-row items-center justify-between">
                        <div>
                          <p className="text-emerald-400 font-black text-lg uppercase tracking-widest mb-3">صافي الثروة الحقيقية (أصول + استثمارات)</p>
                          <p className="text-5xl md:text-6xl font-black text-white">{fmt(netWorth.totalEGP)} <span className="text-xl text-white/30">EGP</span></p>
                        </div>
                      </div>

                      <div className="grand-card p-10 bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/10 transition-all">
                        <p className="text-purple-400 font-black text-xl mb-3">إجمالي الأصول</p>
                        <p className="text-5xl font-black text-white">{fmt(netWorth.assetsTotal)}</p>
                      </div>
                      <div className="grand-card p-10 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10 transition-all">
                        <p className="text-amber-400 font-black text-xl mb-3">قيمة الاستثمارات</p>
                        <p className="text-5xl font-black text-white">{fmt(netWorth.investmentsTotal)}</p>
                      </div>
                      <div className="grand-card p-10 bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/10 transition-all">
                        <p className="text-blue-400 font-black text-xl mb-3">دخل سلبي سنوي</p>
                        <p className="text-5xl font-black text-white">{fmt(netWorth.passiveIncomeAnnual)}</p>
                      </div>
                    </motion.div>
                  )}

                  {financeTab === 'assets' && (
                    <motion.div key="fa" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="space-y-8 pb-20">
                        {/* TOP SUMMARY CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="grand-card p-10 bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10 transition-all group">
                              <p className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 italic opacity-60 group-hover:opacity-100 transition-all"><Plus size={14}/> إجمالي رأس المال (Invested)</p>
                              <p className="text-4xl font-black text-white">{fmt(netWorth.assetsCapital)} <span className="text-sm opacity-30">EGP</span></p>
                           </div>
                           <div className="grand-card p-10 bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10 transition-all group">
                              <p className="text-blue-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 italic opacity-60 group-hover:opacity-100 transition-all"><Activity size={14}/> إجمالي الأرباح المضافة</p>
                              <p className="text-4xl font-black text-white">{fmt(netWorth.assetsProfit)} <span className="text-sm opacity-30">EGP</span></p>
                           </div>
                           <div className="grand-card p-10 bg-purple-500/5 border-purple-500/10 hover:bg-purple-500/10 transition-all group">
                              <p className="text-purple-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 italic opacity-60 group-hover:opacity-100 transition-all"><History size={14}/> سجل نمو الأصول</p>
                              <p className="text-4xl font-black text-white">{assets.length} <span className="text-sm opacity-30">عناصر نشطة</span></p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {assets.map((a, i) => (
                              <div key={i} className="grand-card p-8 flex flex-col justify-between group relative overflow-hidden hover:border-emerald-500/50">
                                <div className="absolute top-4 left-4 flex gap-2 z-10">
                                   <button onClick={() => { setSelectedId(a.id); setForm({ ...form, profitAmount: '', duration: '' }); setModal('profit'); }} className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 hover:scale-110 active:scale-95 transition-all shadow-lg" title="إضافة ربح لأساس هذا الأصل">
                                     <Plus size={18} />
                                   </button>
                                   <button onClick={() => remove('assets', a.id)} className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 hover:bg-rose-500 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-lg opacity-0 group-hover:opacity-100" title="حذف الأصل">
                                     <Trash2 size={18} />
                                   </button>
                                </div>
                                <div className="mb-6">
                                  <h3 className="text-xl font-black mb-2 group-hover:text-emerald-400 transition-colors uppercase">{a.name}</h3>
                                  <span className="px-3 py-1 rounded-lg bg-white/10 text-gray-400 text-xs font-bold border border-white/5 uppercase tracking-widest">{a.type} · {a.liquidType || 'مادي'}</span>
                                </div>
                                <div>
                                   <p className="text-3xl font-black text-emerald-400 leading-none">{fmt(a.value)} <span className="text-sm text-emerald-400/50">EGP</span></p>
                                </div>
                              </div>
                            ))}
                            {assets.length === 0 && <div className="col-span-full p-24 text-center text-gray-600 text-3xl font-black grand-card border-dashed">لم يتم توثيق أي أصول بعد بنظام التشغيل الأساسي.</div>}
                        </div>

                        {/* PROFIT LEDGER (SIJIL) */}
                        <div className="grand-card p-10 border-white/5 bg-white/[0.02]">
                             <h3 className="text-2xl font-black mb-8 text-white flex items-center gap-3"><History className="text-emerald-400" size={24}/> سجل أرباح الأصول المحققة</h3>
                             <div className="space-y-4">
                                {incomes.filter(inc => inc.source?.includes('أصل')).length > 0 ? incomes.filter(inc => inc.source?.includes('أصل')).map((inc, idx) => (
                                   <div key={idx} className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all group">
                                      <div className="flex items-center gap-6">
                                         <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                            <Sparkles size={20}/>
                                         </div>
                                         <div>
                                            <p className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">{inc.source}</p>
                                            <p className="text-sm text-gray-500 font-bold italic">{inc.description} · <span className="eng-num">{new Date(inc.date).toLocaleDateString('ar-EG')}</span></p>
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-6">
                                         <p className="text-2xl font-black text-emerald-400">+{fmt(inc.amount)} <span className="text-xs opacity-40">EGP</span></p>
                                         <button onClick={() => remove('incomes', inc.id)} className="p-2 text-gray-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                                      </div>
                                   </div>
                                )) : (
                                   <div className="p-12 text-center text-gray-700 font-black italic">لا يوجد سجل أرباح بعد.. ابدأ بإضافة أول ربح للأصل لإظهار البيانات هنا.</div>
                                )}
                             </div>
                        </div>
                    </motion.div>
                  )}

                  {financeTab === 'investments' && (
                    <motion.div key="f-inv" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="space-y-8 pb-20">
                        {/* TOP SUMMARY CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="grand-card p-10 bg-amber-500/5 border-amber-500/10 transition-all group">
                              <p className="text-amber-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 italic opacity-60"><Wallet size={14}/> رأس المال المستثمر</p>
                              <p className="text-4xl font-black text-white">{fmt(netWorth.investmentsCapital)} <span className="text-sm opacity-30">EGP</span></p>
                           </div>
                           <div className="grand-card p-10 bg-emerald-500/5 border-emerald-500/10 transition-all group">
                              <p className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 italic opacity-60"><Activity size={14}/> صافي الربح / الخسارة</p>
                              <p className={`text-4xl font-black ${netWorth.investmentsProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(netWorth.investmentsProfit)} <span className="text-sm opacity-30">EGP</span></p>
                           </div>
                           <div className="grand-card p-10 bg-blue-500/5 border-blue-500/10 transition-all group">
                              <p className="text-blue-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 italic opacity-60"><Target size={14}/> العائد الكلي (ROI)</p>
                              <p className="text-4xl font-black text-white">{netWorth.investmentsCapital > 0 ? ((netWorth.investmentsProfit / netWorth.investmentsCapital) * 100).toFixed(1) : '0.0'}%</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Array.isArray(investments) && investments.map((inv, i) => {
                              if (!inv) return null;
                              const roi = inv.roiPercentage || 0;
                              return (
                                <div key={inv.id || i} className="grand-card p-8 flex flex-col justify-between group relative overflow-hidden hover:scale-[1.02] transition-all border-white/5 hover:border-amber-500/30">
                                  <div className="absolute top-4 left-4 flex gap-2 z-10">
                                    <button onClick={() => { setSelectedId(inv.id); setForm({ ...form, profitAmount: '', duration: '' }); setModal('profit_inv'); }} className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 hover:scale-110 active:scale-95 transition-all shadow-lg" title="إضافة ربح لهذا الاستثمار">
                                      <Plus size={18} />
                                    </button>
                                    <button onClick={() => remove('investments', inv.id)} className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 hover:bg-rose-500 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-lg opacity-0 group-hover:opacity-100" title="حذف الاستثمار">
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                  <div className="mb-6">
                                    <h3 className="text-xl font-black mb-1 group-hover:text-amber-400 transition-colors">{inv.name}</h3>
                                    <p className="text-gray-500 text-sm font-bold bg-white/5 inline-block px-3 py-0.5 rounded-lg">{inv.platform}</p>
                                  </div>
                                  <div className="flex items-end justify-between gap-4">
                                    <div>
                                      <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1 leading-none">القيمة الحالية</p>
                                      <p className="text-3xl font-black leading-none">{fmt(inv.currentValue)}</p>
                                    </div>
                                    <div className={`text-lg font-black px-4 py-2 rounded-xl border shadow-xl ${roi >= 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                      <span className="eng-num">{roi >= 0 ? '+' : ''}{roi.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {(!investments || investments.length === 0) && <div className="col-span-full p-24 text-center text-gray-600 text-3xl font-black grand-card border-dashed">تعلم الاستثمار لبناء إمبراطوريتك، ثم وثق صفقاتك هنا.</div>}
                        </div>

                        {/* PROFIT LEDGER (SIJIL) */}
                        <div className="grand-card p-10 border-white/5 bg-white/[0.02]">
                             <h3 className="text-2xl font-black mb-8 text-white flex items-center gap-3"><History className="text-amber-400" size={24}/> سجل أرباح الاستثمارات والتدفقات</h3>
                             <div className="space-y-4">
                                {incomes.filter(inc => inc.source?.includes('استثمار')).length > 0 ? incomes.filter(inc => inc.source?.includes('استثمار')).map((inc, idx) => (
                                   <div key={idx} className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all group">
                                      <div className="flex items-center gap-6">
                                         <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                                            <Activity size={20}/>
                                         </div>
                                         <div>
                                            <p className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">{inc.source}</p>
                                            <p className="text-sm text-gray-500 font-bold italic">{inc.description} · <span className="eng-num">{new Date(inc.date).toLocaleDateString('ar-EG')}</span></p>
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-6">
                                         <p className="text-2xl font-black text-emerald-400">+{fmt(inc.amount)} <span className="text-xs opacity-40">EGP</span></p>
                                         <button onClick={() => remove('incomes', inc.id)} className="p-2 text-gray-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                                      </div>
                                   </div>
                                )) : (
                                   <div className="p-12 text-center text-gray-700 font-black italic">لا يوجد سجل أرباح استثمارية حتى الآن.</div>
                                )}
                             </div>
                        </div>
                    </motion.div>
                  )}

                  {financeTab === 'passive' && (
                    <motion.div key="f-pass" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="space-y-8 pb-20">
                         {/* TOP SUMMARY CARDS */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="grand-card p-10 bg-blue-500/5 border-blue-500/10 transition-all group">
                              <p className="text-blue-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 italic opacity-60"><Sparkles size={14}/> إجمالي الدخل الشهري</p>
                              <p className="text-4xl font-black text-white">{fmt(netWorth.passiveIncomeMonthly)} <span className="text-sm opacity-30">EGP</span></p>
                           </div>
                           <div className="grand-card p-10 bg-emerald-500/5 border-emerald-500/10 transition-all group">
                              <p className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 italic opacity-60"><Gem size={14}/> العائد السنوي المتوقع</p>
                              <p className="text-4xl font-black text-white">{fmt(netWorth.passiveIncomeAnnual)} <span className="text-sm opacity-30">EGP</span></p>
                           </div>
                           <div className="grand-card p-10 bg-purple-500/5 border-purple-500/10 transition-all group">
                              <p className="text-purple-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 italic opacity-60"><ListTodo size={14}/> عدد المصادر النشطة</p>
                              <p className="text-4xl font-black text-white">{passiveSources.length} <span className="text-sm opacity-30">قيد العمل</span></p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Array.isArray(passiveSources) && passiveSources.map((src, i) => (
                              <div key={i} className="grand-card p-8 flex flex-col justify-between group relative overflow-hidden hover:scale-[1.02] transition-all border-white/5 hover:border-blue-500/30">
                                <button onClick={() => remove('passiveIncomeSources', src.id)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 hover:bg-rose-500 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-lg opacity-0 group-hover:opacity-100 z-10" title="حذف مصدر الدخل">
                                  <Trash2 size={18} />
                                </button>
                                <div className="mb-6">
                                  <h3 className="text-xl font-black mb-1 group-hover:text-blue-400 transition-colors uppercase">{src.source}</h3>
                                  <p className="text-gray-500 text-sm font-bold bg-white/5 inline-block px-3 py-0.5 rounded-lg italic">{src.type || 'اشتراك'}</p>
                                </div>
                                <div className="flex items-end justify-between gap-4">
                                  <div>
                                    <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1 leading-none">العائد الشهري</p>
                                    <p className="text-3xl font-black text-emerald-400 leading-none">{fmt(src.monthlyAmount)} <span className="text-sm opacity-40">EGP</span></p>
                                  </div>
                                  <div className={`px-4 py-2 rounded-xl border text-xs font-black ${src.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                    {src.isActive ? 'نشط' : 'متوقف'}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {(!passiveSources || passiveSources.length === 0) && <div className="col-span-full p-24 text-center text-gray-600 text-3xl font-black grand-card border-dashed hover:border-white/20 transition-all cursor-pointer" onClick={() => setModal('passive_income')}>لا يوجد مصادر دخل سلبي مسجلة. اضغط هنا لإضافة أول مصدر.</div>}
                        </div>
                    </motion.div>
                  )}

                  {financeTab === 'wallets' && (
                    <motion.div key="fw" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="space-y-12 pb-20">
                      {/* ENHANCED AGGREGATE TOTALS CARD */}
                      {/* SIMPLIFIED EGP-ONLY AGGREGATE TOTALS CARD */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-4 grand-card p-6 bg-blue-500/10 border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                           <div>
                              <p className="text-blue-400 font-black text-sm uppercase tracking-widest mb-1">إجمالي السيولة النقدية (بنك + كاش)</p>
                              <p className="text-4xl font-black text-white">{fmt(netWorth.totalLiquidAssets)} <span className="text-lg opacity-40">EGP</span></p>
                              <p className="text-xs text-blue-400/60 mt-1 font-bold">هذه هي الأموال الملموسة التي تمتلكها الآن في الأصول.</p>
                           </div>
                           <div className="h-full w-px bg-white/10 hidden md:block" />
                           <div className="text-left md:text-right">
                              <p className="text-gray-500 font-black text-[10px] uppercase mb-1">مجموع أرصدة المحافظ</p>
                              <p className="text-2xl font-black text-emerald-400">{fmt(wallets?.reduce((acc:any, w:any) => acc + (w.balance || 0), 0))} <span className="text-xs opacity-40">EGP</span></p>
                              <div className="flex items-center gap-2 mt-1 justify-end">
                                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">حالة التزامن:</span>
                                 <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">متزامن 100%</span>
                              </div>
                           </div>
                        </div>

                        {[
                          { label:'إجمالي الدخل الوارد', val: totalIncome, cur:'EGP', col:'emerald' },
                          { label:'إجمالي الشخصي', val: totalSpentPersonal, cur:'EGP', col:'rose' },
                          { label:'ما خرج لله (عطاء)', val: totalSpentGiving, cur:'EGP', col:'amber' },
                          { label:'إجمالي الاستثمارات', val: totalSpentInvest, cur:'EGP', col:'purple' },
                        ].map((stat, idx) => {
                           const colors: any = {
                             emerald: 'border-emerald-500/10 bg-emerald-500/5 text-emerald-400',
                             rose: 'border-rose-500/10 bg-rose-500/5 text-rose-400',
                             amber: 'border-amber-500/10 bg-amber-500/5 text-amber-400',
                             purple: 'border-purple-500/10 bg-purple-500/5 text-purple-400',
                           };
                           const activeCol = colors[stat.col];
                           return (
                             <div key={idx} className={`grand-card p-4 border ${activeCol} transition-transform hover:scale-[1.03]`}>
                                <p className="text-[9px] font-black uppercase mb-1 opacity-70">{stat.label}</p>
                                <p className="text-xl font-black text-white">{fmt(stat.val)} <span className="text-[10px] opacity-40">{stat.cur}</span></p>
                             </div>
                           )
                        })}
                      </div>

                       <div className="grand-card p-10 relative overflow-hidden bg-white/2 border-white/10">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h3 className="text-xl font-black text-purple-400 flex items-center gap-3"><Gem size={20}/> نسب توزيع الدخل</h3>
                              <p className="text-gray-500 font-bold text-sm">تحكم في كيفية تقسيم الدخل القادم تلقائياً إلى محافظك.</p>
                            </div>
                            <button onClick={() => post('dist_update', {
                                giving: (document.getElementById('dist-giving') as HTMLInputElement).value,
                                obs: (document.getElementById('dist-obs') as HTMLInputElement).value,
                                pers: (document.getElementById('dist-pers') as HTMLInputElement).value,
                                inv: (document.getElementById('dist-inv') as HTMLInputElement).value,
                            })} className="mega-action-btn bg-purple-500/20 text-purple-300 border border-purple-500/30 px-6 py-2 text-sm">حفظ التوزيع</button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[
                              { id: 'dist-giving', label: 'عطاء', val: distributionSettings?.givingPercentage || 0.1, colText: 'text-emerald-400' },
                              { id: 'dist-obs', label: 'التزامات', val: distributionSettings?.obligationsPercentage || 0.2, colText: 'text-blue-400' },
                              { id: 'dist-pers', label: 'شخصي', val: distributionSettings?.personalPercentage || 0.1, colText: 'text-amber-400' },
                              { id: 'dist-inv', label: 'استثمار', val: distributionSettings?.investmentPercentage || 0.6, colText: 'text-purple-400' },
                            ].map(d => (
                              <div key={d.id} className="bg-black/30 p-3 rounded-xl border border-white/5">
                                <label className={`block text-[10px] font-black ${d.colText} mb-1 uppercase`}>{d.label}</label>
                                <div className="relative">
                                    <input id={d.id} type="number" step="0.01" className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-xl font-black eng-num focus:border-white outline-none transition-all text-center" defaultValue={d.val} />
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-700 font-black text-xs">%</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="h-16 w-full flex rounded-xl overflow-hidden border border-white/10 font-black text-lg text-white shadow-xl">
                            <div style={{ flex: distributionSettings?.givingPercentage || 0.1 }} className="h-full bg-emerald-500/90 flex items-center justify-center border-l border-white/10 hover:brightness-110 transition-all min-w-[30px]">عطاء</div>
                            <div style={{ flex: distributionSettings?.obligationsPercentage || 0.2 }} className="h-full bg-blue-500/90 flex items-center justify-center border-l border-white/10 hover:brightness-110 transition-all min-w-[30px]">التزامات</div>
                            <div style={{ flex: distributionSettings?.personalPercentage || 0.1 }} className="h-full bg-amber-500/90 flex items-center justify-center border-l border-white/10 hover:brightness-110 transition-all min-w-[30px]">شخصي</div>
                            <div style={{ flex: distributionSettings?.investmentPercentage || 0.6 }} className="h-full bg-purple-500/90 flex items-center justify-center hover:brightness-110 transition-all min-w-[30px]">استثمار</div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {['عطاء (وفاء)', 'الالتزامات', 'شخصي', 'الاستثمار'].map((name, idx) => {
                          const wIds = ['giving', 'obligations', 'personal', 'investment'];
                          const cols = [
                            { flat: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400', icon: 'text-emerald-400 bg-emerald-500/20' },
                            { flat: 'bg-blue-500/5 border-blue-500/20 text-blue-400', icon: 'text-blue-400 bg-blue-500/20' },
                            { flat: 'bg-amber-500/5 border-amber-500/20 text-amber-400', icon: 'text-amber-400 bg-amber-500/20' },
                            { flat: 'bg-purple-500/5 border-purple-500/20 text-purple-400', icon: 'text-purple-400 bg-purple-500/20' }
                          ];
                          const col = cols[idx];
                          const wallet = wallets?.find((w:any) => w.id === wIds[idx]);
                          const lastSplitVal = lastSplits ? (lastSplits as any)[wIds[idx]] : 0;
                          return (
                            <div key={idx} className={`grand-card p-6 border ${col.flat} transition-all hover:scale-[1.02]`}>
                              <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${col.icon}`}>
                                   <Gem size={20} />
                                </div>
                                <div className="text-left">
                                  <p className="text-[10px] opacity-40 font-black uppercase">إجمالي الرصيد</p>
                                  <p className="text-sm font-black text-white/60">{fmt(wallet?.balance || 0)}</p>
                                </div>
                              </div>
                              <h3 className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform">+{fmt(lastSplitVal)}</h3>
                              <p className="text-xs font-bold uppercase tracking-widest opacity-60">{name} (آخر إيداع)</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* COMBINED FINANCIAL CHRONICLE (INCOME + SPENDING) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                         {/* INCOME LOG */}
                         <div className="grand-card p-10 bg-white/2 border-white/10 relative overflow-hidden">
                            <h3 className="text-xl font-black text-emerald-400 mb-8 flex items-center gap-4"><History size={24}/> سجل تدفقات الدخل</h3>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 scrollbar-hide">
                               {incomes.map((inc, idx) => (
                               <div key={idx} className="bg-white/2 rounded-2xl border border-white/5 hover:bg-white/5 transition-all overflow-hidden">
                                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                                     <div className="text-right">
                                        <p className="font-black text-white text-lg">{inc.description}</p>
                                        <p className="text-[10px] text-gray-600 eng-num">{new Date(inc.date).toLocaleDateString('ar-EG')}</p>
                                     </div>
                                     <div className="text-left">
                                        <p className="text-emerald-400 font-black text-xl eng-num">+{fmt(inc.amount)} <span className="text-xs opacity-40">EGP</span></p>
                                        <p className="text-[10px] text-gray-700 font-bold uppercase">{inc.source}</p>
                                     </div>
                                  </div>
                                  <div className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 bg-emerald-500/5">
                                    {[
                                      { label: 'عطاء', val: (inc.amount * (distributionSettings?.givingPercentage || 0.1)), col: 'text-emerald-400' },
                                      { label: 'التزامات', val: (inc.amount * (distributionSettings?.obligationsPercentage || 0.2)), col: 'text-blue-400' },
                                      { label: 'شخصي', val: (inc.amount * (distributionSettings?.personalPercentage || 0.1)), col: 'text-amber-400' },
                                      { label: 'استثمار', val: (inc.amount * (distributionSettings?.investmentPercentage || 0.6)), col: 'text-purple-400' },
                                    ].map(s => (
                                      <div key={s.label} className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-black uppercase opacity-40">{s.label}</span>
                                        <span className={`text-[10px] font-black ${s.col} eng-num`}>{fmt(s.val)}</span>
                                      </div>
                                    ))}
                                  </div>
                               </div>
                               ))}
                               {incomes.length === 0 && <p className="text-center text-gray-700 py-12 italic">لا يوجد دخل مسجل.</p>}
                            </div>
                         </div>

                         {/* SPENDING LOG */}
                         <div className="grand-card p-10 bg-white/2 border-white/10 relative overflow-hidden">
                            <h3 className="text-xl font-black text-rose-400 mb-8 flex items-center gap-4"><CreditCard size={24}/> سجل مصروفات المحافظ</h3>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 scrollbar-hide">
                               {transactions.filter(t => !['profit','profit_inv'].includes(t.type)).map((t, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 hover:bg-white/5 transition-all">
                                     <div className="text-right">
                                        <p className="font-black text-white text-lg">{t.description}</p>
                                        <p className="text-[10px] text-gray-600 eng-num">{new Date(t.date).toLocaleDateString('ar-EG')}</p>
                                     </div>
                                     <div className="text-left">
                                        <p className="text-rose-400 font-black text-xl eng-num">-{fmt(t.amount)} <span className="text-xs opacity-40">EGP</span></p>
                                        <p className="text-[10px] text-gray-700 font-bold uppercase">{t.category}</p>
                                     </div>
                                  </div>
                               ))}
                               {transactions.length === 0 && <p className="text-center text-gray-700 py-12 italic">لا يوجد مصروفات مسجلة.</p>}
                            </div>
                         </div>
                      </div>

                    </motion.div>
                  )}

                  {financeTab === 'transactions' && (
                    <motion.div key="ft" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="grand-card p-10 overflow-hidden">
                       <div className="overflow-x-auto">
                         <table className="w-full text-xl">
                           <thead>
                             <tr className="text-gray-500 border-b border-white/5 uppercase tracking-widest text-base">
                               <th className="py-6 text-right font-black w-[40%]">تفاصيل المعاملة</th>
                               <th className="py-6 text-right font-black">تصنيف</th>
                               <th className="py-6 text-right font-black">تاريخ</th>
                               <th className="py-6 text-left font-black">المبلغ الرقمي</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-white/2">
                             {transactions.map((t, i) => (
                               <tr key={i} className="hover:bg-white/[0.03] transition-colors group">
                                 <td className="py-6 font-black text-white group-hover:text-emerald-400 transition-colors">
                                   <div className="flex flex-col">
                                     <span>{t.description}</span>
                                     <span className="text-[10px] text-gray-600 font-bold eng-num uppercase tracking-tighter">ID: {t.id} · {t.method}</span>
                                   </div>
                                 </td>
                                 <td className="py-6"><span className="bg-white/5 px-4 py-1.5 rounded-xl text-sm text-gray-500 font-black border border-white/5 uppercase">{t.category}</span></td>
                                 <td className="py-6">
                                   <div className="flex flex-col">
                                     <span className="text-gray-400 font-bold eng-num text-sm">{new Date(t.date).toLocaleDateString('ar-EG')}</span>
                                     <span className="text-[10px] text-gray-600 font-bold eng-num">{new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                   </div>
                                 </td>
                                 <td className="py-6 text-left font-black text-2xl text-rose-400 eng-num truncate flex items-center justify-end gap-3">- {fmt(t.amount)} <button onClick={() => remove('transactions', t.id)} className="p-2 text-gray-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" title="حذف المعاملة"><Trash2 size={18}/></button></td>
                               </tr>
                             ))}
                             {transactions.length === 0 && <tr><td colSpan={4} className="py-24 text-center text-gray-600 font-black text-3xl italic">دفتر المعاملات نظيف تماماً...</td></tr>}
                           </tbody>
                         </table>
                       </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </motion.div>
          )}

          {/* ===================== TASKS / المهام ===================== */}
          {mainTab === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <TaskClient />
            </motion.div>
          )}

          {/* ===================== ROUTINE & GROOMING / الروتين والعناية ===================== */}
          {mainTab === 'routines' && (
            <motion.div key="routines" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <RoutineClient />
            </motion.div>
          )}

          {/* ===================== SUBSCRIPTIONS / الاشتراكات ===================== */}
          {mainTab === 'subscriptions' && (
            <motion.div key="subs" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <SubscriptionClient />
            </motion.div>
          )}

          {/* ===================== EVENTS / المواعيد والأصدقاء ===================== */}
          {mainTab === 'events' && (
            <motion.div key="events" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <EventsClient />
            </motion.div>
          )}

          {/* ===================== LIBRARY / مكتبة المعرفة ===================== */}
          {mainTab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <LibraryClient />
            </motion.div>
          )}
          {/* ===================== WISHLIST / الأمنيات ===================== */}
          {mainTab === 'wishlist' && (
             <motion.div key="wl" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-12 max-w-7xl mx-auto">
               <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-4xl md:text-6xl font-black mb-3 flex items-center gap-4">قائمة الأمنيات الذكية <Target className="text-rose-400 md:w-12 md:h-12" /></h2>
                    <p className="text-xl text-gray-500">مشترياتك مقيّمة بالزمن من حياتك.. فكر جيداً قبل التنفيذ.</p>
                  </div>
                  <button onClick={() => { setForm({ ...form }); setModal('wishlist'); }} className="mega-action-btn bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-10">+ أمنية جديدة</button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {wishlist.map((w, i) => {
                    const hours = w.hoursCost || 0;
                     return (
                       <div key={i} className={`grand-card p-10 flex flex-col justify-between group relative overflow-hidden ${w.isPurchased ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                         <div className="flex justify-between items-start mb-8">
                           <h3 className="text-4xl font-black group-hover:text-amber-400 transition-colors uppercase leading-tight">{w.name}</h3>
                           <span className={`px-5 py-2.5 font-black text-sm rounded-2xl border uppercase tracking-widest ${w.priority === 1 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : w.priority === 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                             {w.priority === 1 ? 'أولوية قصوى' : w.priority === 2 ? 'رغبة عامة' : 'ترفيه غير ملزِم'}
                           </span>
                            <button onClick={() => remove('wishlist', w.id)} className="p-2 text-gray-600 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100" title="حذف الأمنية"><Trash2 size={24}/></button>
                         </div>
                         
                         <p className="text-5xl font-black text-white mb-10 bg-white/3 py-6 px-8 rounded-[2rem] border border-white/5 w-max eng-num">{fmt(w.price)} <span className="text-xl text-gray-500">EGP</span></p>

                         <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-[2.5rem] flex items-center gap-6 shadow-2xl relative overflow-hidden">
                           <div className="p-4 bg-amber-500/20 rounded-2xl text-amber-500 shadow-inner"><Clock size={32} /></div>
                           <div className="relative z-10">
                             <p className="text-amber-400/70 font-black mb-1 uppercase tracking-widest text-sm">التكلفة الزمنية البديلة</p>
                             <p className="text-3xl font-black text-amber-400">{hours > 0 ? <><span className="eng-num text-4xl">{hours.toFixed(1)}</span> ساعة عمل صافية</> : 'احسب دخلك لترجمتها لزمن'}</p>
                           </div>
                           <div className="absolute right-0 bottom-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
                         </div>
                       </div>
                     )
                  })}
                  {wishlist.length === 0 && <div className="col-span-full p-32 text-center text-gray-600 text-3xl font-black grand-card border-dashed">عالمك المادي خالٍ من الرغبات حالياً. استمتع بالحرية.</div>}
               </div>
             </motion.div>
          )}

          {/* ===================== SETTINGS / الإعدادات ===================== */}
          {mainTab === 'settings' && (
            <motion.div key="se" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-12 max-w-5xl mx-auto pb-20">
               <h2 className="text-3xl md:text-5xl font-black mb-10 flex items-center gap-4">إعدادات النواة المركزية <Settings className="text-blue-400 md:w-10 md:h-10" /></h2>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">


                  <div className="grand-card p-10 flex flex-col justify-between hover:border-rose-500/30 transition-all">
                    <div>
                      <h3 className="text-xl font-black mb-2 text-rose-400 flex items-center gap-3"><AlertTriangle size={20}/> وضع الهياج المالي (Panic)</h3>
                      <p className="text-gray-500 font-bold text-sm leading-relaxed">تفعيل وضع الطوارئ يغير الواجهة للتحذير ويقيد التوقعات.</p>
                    </div>
                    <div className="flex items-center gap-4 mt-8">
                      <button onClick={() => { setPanic(!panic); post('setting', { key: 'is_panic', value: !panic ? '1' : '0' }); }} className={`shrink-0 w-20 h-10 rounded-full relative transition-all duration-500 shadow-2xl ${panic ? 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]' : 'bg-gray-800'}`}>
                          <motion.div layout className={`absolute top-1 bottom-1 w-8 bg-white rounded-full ${panic ? 'right-1' : 'left-1'}`} />
                      </button>
                      <span className={`text-xl font-black ${panic ? 'text-rose-400' : 'text-gray-600'}`}>{panic ? 'نشط' : 'غير مفعّل'}</span>
                    </div>
                  </div>
               </div>

               {/* Wallet Distribution Control */}
               <div className="grand-card p-10 border-purple-500/10 hover:border-purple-500/30 transition-all">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-purple-400 flex items-center gap-3"><Gem size={24}/> نسب توزيع الدخل (المحافظ)</h3>
                      <p className="text-gray-500 font-bold text-base">تحكم في كيفية تقسيم الدخل القادم تلقائياً إلى محافظك.</p>
                    </div>
                    <button onClick={() => post('dist_update', {
                        giving: (document.getElementById('dist-giving') as HTMLInputElement).value,
                        obs: (document.getElementById('dist-obs') as HTMLInputElement).value,
                        pers: (document.getElementById('dist-pers') as HTMLInputElement).value,
                        inv: (document.getElementById('dist-inv') as HTMLInputElement).value,
                    })} className="mega-action-btn bg-purple-500/20 text-purple-300 border border-purple-500/30 px-8 py-3 text-lg"><Save size={20}/> حفظ التوزيع</button>
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { id: 'dist-giving', label: 'عطاء (لله)', val: distributionSettings.givingPercentage, col: 'emerald' },
                      { id: 'dist-obs', label: 'التزامات', val: distributionSettings.obligationsPercentage, col: 'blue' },
                      { id: 'dist-pers', label: 'شخصي', val: distributionSettings.personalPercentage, col: 'amber' },
                      { id: 'dist-inv', label: 'استثمار', val: distributionSettings.investmentPercentage, col: 'purple' },
                    ].map(d => (
                       <div key={d.id} className="bg-white/5 p-5 rounded-2xl border border-white/5">
                         <label className={`block text-sm font-black text-${d.col}-400 mb-2`}>{d.label}</label>
                         <div className="relative">
                            <input id={d.id} type="number" step="0.01" className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-2xl font-black eng-num focus:border-white transition-all text-center" defaultValue={d.val} />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-black">%</span>
                         </div>
                       </div>
                    ))}
                 </div>
               </div>

               <div className="grand-card p-10 border-blue-500/10 hover:border-blue-500/30 transition-all">
                 <h3 className="text-xl font-black mb-6 text-blue-400 flex items-center gap-3"><ExternalLink size={20}/> مستودع بيانات Notion</h3>
                 <div className="flex flex-col md:flex-row gap-4">
                   <input type="url" placeholder="https://notion.so/..." className="flex-1 bg-black/40 border-2 border-white/10 rounded-2xl p-6 text-base font-bold focus:border-blue-500 outline-none transition-all eng-num" value={notionUrl} onChange={e => setNotionUrl(e.target.value)} />
                   <button onClick={() => post('setting', { key: 'notion_url', value: notionUrl })} className="mega-action-btn bg-blue-500/20 text-blue-300 border border-blue-500/30 px-10 h-16 text-xl"><Save size={24}/> حفظ الرابط</button>
                 </div>
               </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ===================== GIANT MODALS - SYSTEM LEVEL ===================== */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-super-dark/95 backdrop-blur-[40px] overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} className="w-full max-w-xl bg-black border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_80px_rgba(0,0,0,0.9)] relative my-auto">
              
              <button type="button" onClick={() => setModal(null)} className="absolute top-8 left-8 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:scale-110 active:scale-90"><X size={24}/></button>
              
              <h2 className="text-3xl md:text-4xl font-black mb-8 text-emerald-400 border-r-4 border-emerald-500 pr-5">
                {{transaction:'توثيق مصروف مالي', asset:'إضافة لقفص الأصول', income:'تسجيل مورد دخل', investment:'فتح مركز استثمار', hours:'تتبع زمن العمل', wishlist:'تسجيل رغبة مستقبلية', profit:'تسجيل ربح للأصل', profit_inv:'تسجيل ربح استثمار', passive_income:'إضافة مصدر دخل سلبي'}[modal] || 'إدخال بيانات'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Visual Impact Number Input */}
                {!['hours','profit','profit_inv'].includes(modal) && (
                  <div>
                    <label className="text-lg font-black text-gray-500 mb-4 block uppercase tracking-widest text-center">
                      {modal==='investment'?'قائمة التكلفة الأولية': modal==='passive_income'?'العائد الشهري المتوقع' : modal === 'wishlist' ? 'سعر المنتج المرغوب' : 'المبلغ المالي الصافي'}
                    </label>
                    <input required type="number" step="0.01" autoFocus className="w-full bg-white/2 border-2 border-white/10 focus:border-emerald-500 rounded-2xl p-6 text-4xl font-black text-center eng-num outline-none transition-all placeholder-gray-800 shadow-inner" value={modal==='investment'?form.initialValue : modal==='passive_income' ? form.monthlyAmount : modal === 'wishlist' ? form.price : form.amount} onChange={e=>setForm({...form,[modal==='investment'?'initialValue': modal==='passive_income' ? 'monthlyAmount' : modal === 'wishlist' ? 'price' : 'amount']:e.target.value})} placeholder="0.00" />
                  </div>
                )}

                 {modal === 'profit' || modal === 'profit_inv' ? (
                    <div className="space-y-6">
                       <div>
                         <label className="text-lg font-black text-amber-400 mb-4 block uppercase tracking-widest text-center">مبلغ الربح المحقق</label>
                         <input required type="number" step="0.01" autoFocus className="w-full bg-white/2 border-2 border-amber-500/20 focus:border-amber-500 rounded-2xl p-6 text-4xl font-black text-center eng-num outline-none transition-all" value={form.profitAmount} onChange={e=>setForm({...form, profitAmount: e.target.value})} placeholder="0.00" />
                       </div>
                       <div>
                         <label className="text-sm font-black text-gray-500 mb-2 block">المدة / الفترة (اختياري)</label>
                         <input type="text" className="w-full bg-white/5 border-2 border-white/10 rounded-xl p-4 text-xl font-bold" value={form.duration} onChange={e=>setForm({...form, duration: e.target.value})} placeholder="مثلاً: شهر مارس 2024" />
                       </div>
                    </div>
                 ) : modal === 'passive_income' ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-black text-gray-500 mb-2 block uppercase tracking-widest">اسم المصدر</label>
                       <input required type="text" className="w-full bg-white/5 border-2 border-white/10 rounded-xl p-4 text-xl font-bold focus:border-emerald-500 outline-none transition-all" value={form.source} onChange={e=>setForm({...form, source: e.target.value})} placeholder="مثلاً: عقار إيجار" />
                     </div>
                     <div>
                       <label className="text-sm font-black text-gray-500 mb-2 block uppercase tracking-widest">نوع المصدر</label>
                       <input required type="text" className="w-full bg-white/5 border-2 border-white/10 rounded-xl p-4 text-xl font-bold focus:border-emerald-500 outline-none transition-all" value={form.type} onChange={e=>setForm({...form, type: e.target.value})} placeholder="مثلاً: اشتراك / إيجار" />
                     </div>
                   </div>
                 ) : null}


                {/* Selectors Grid */}
                {['transaction','income','asset', 'investment'].includes(modal!) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <label className="text-base font-black text-gray-500 mb-3 block">عملة التداول</label>
                      <div className="w-full bg-[#111] border-2 border-white/5 rounded-2xl p-5 text-xl font-black text-gray-400 flex items-center justify-between">
                        <span>EGP - جنيه مصري</span>
                        <Check size={20} className="text-emerald-500" />
                      </div>
                    </div>

                    {modal==='transaction' && (
                      <div className="relative">
                        <label className="text-base font-black text-gray-500 mb-3 block">التصنيف المالي</label>
                        <select className="w-full bg-[#111] border-2 border-white/10 focus:border-rose-500 rounded-2xl p-5 text-xl font-black outline-none transition-all appearance-none cursor-pointer text-white" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                          {['شخصي','طعام','سكن','مواصلات','ترفيه','صحة','عطاء','استثمار','تعليم','أخرى'].map(c=><option className="bg-[#111] text-white" key={c}>{c}</option>)}
                        </select>
                        <ChevronLeft className="absolute left-6 bottom-6 text-gray-500 pointer-events-none -rotate-90" />
                      </div>
                    )}
                    
                    {modal==='asset' && (
                      <div className="relative">
                         <label className="text-base font-black text-gray-500 mb-3 block">سيولة الأصل</label>
                        <select className="w-full bg-[#111] border-2 border-white/10 focus:border-blue-500 rounded-2xl p-5 text-xl font-black outline-none transition-all appearance-none cursor-pointer text-white" value={form.liquidType} onChange={e=>setForm({...form,liquidType:e.target.value})}>
                          <option className="bg-[#111] text-white" value="سائل">كاش / بنك (سيولة)</option>
                          <option className="bg-[#111] text-white" value="مادي">أصل مادي (ذهب/عقار)</option>
                          <option className="bg-[#111] text-white" value="رقمي">أصول مشفرة (Crypto)</option>
                        </select>
                        <ChevronLeft className="absolute left-6 bottom-6 text-gray-500 pointer-events-none -rotate-90" />
                      </div>
                    )}
                  </div>
                )}

                {/* Item Identity */}
                {['asset','investment','wishlist','income','transaction'].includes(modal!) && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-lg font-black text-gray-500 mb-3 block">{['transaction','income'].includes(modal!) ? 'بيان المعاملة (السبب)' : 'اسم العنصر / الكيان'}</label>
                      <input required type="text" className="w-full bg-white/5 border-2 border-white/10 focus:border-emerald-500 rounded-2xl p-5 text-xl font-black outline-none transition-all" value={['transaction','income'].includes(modal!) ? form.description : form.name} onChange={e=>setForm({...form, [['transaction','income'].includes(modal!)?'description':'name']:e.target.value})} placeholder="..." />
                    </div>

                    {modal === 'wishlist' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-black text-gray-500 mb-3 block">الأولوية (1-5)</label>
                            <select className="w-full bg-[#111] border-2 border-white/10 focus:border-amber-500 rounded-xl p-4 text-xl font-black outline-none text-white appearance-none cursor-pointer" value={form.priority} onChange={e=>setForm({...form, priority: e.target.value})}>
                              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} - {v === 5 ? 'رغبة بعيدة' : v === 1 ? 'أولوية قصوى' : 'درجة ' + v}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-black text-gray-500 mb-3 block">رابط المنتج (اختياري)</label>
                            <input type="url" className="w-full bg-white/5 border-2 border-white/10 rounded-xl p-4 text-xl font-bold" value={form.link} onChange={e=>setForm({...form, link: e.target.value})} placeholder="https://..." />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-black text-gray-500 mb-3 block">تفاصيل / خطة التنفيذ</label>
                          <textarea className="w-full bg-white/5 border-2 border-white/10 focus:border-emerald-500 rounded-xl p-4 text-xl font-bold outline-none h-24" value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} placeholder="اكتب تفاصيلك للفترة الجاية هنا..." />
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button type="submit" disabled={saving} className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-60 rounded-2xl text-2xl font-black flex items-center justify-center gap-4 transition-all active:scale-95 mt-6 shadow-[0_15px_60px_rgba(16,185,129,0.3)]">
                  {saving ? <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin"/> : <Check size={32}/>}
                  {saving ? 'جاري المزامنة...' : 'تأكيد وحفظ'}
                </button>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
