"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Activity, Wallet, Shield, Menu, X, Settings, ExternalLink, Save, Target, Clock, AlertTriangle, Gem, Check, LayoutDashboard, Briefcase, ListTodo, HeartPulse, CreditCard, Banknote, Sparkles, ChevronLeft } from 'lucide-react';

interface Props {
  transactions: any[]; assets: any[]; incomes: any[]; wishlist: any[];
  investments: any[]; passiveSources: any[]; wallets: any[]; workTracking: any[];
  netWorth: any; forecast: any; hourlyRate: number; distributionSettings: any;
  settings: { usdRate: number; isPanic: boolean; notionUrl: string };
}

const COLORS = ['var(--color-emerald-glow)', 'var(--color-blue-glow)', 'var(--color-amber-glow)', 'var(--color-purple-glow)', 'var(--color-rose-glow)', '#06b6d4'];
const fmt = (n: number) => <span className="eng-num">{Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>;

export default function DashboardClient({ transactions, assets, incomes, wishlist, investments, passiveSources, wallets, workTracking, netWorth, forecast, hourlyRate, distributionSettings, settings }: Props) {
  const [mainTab, setMainTab] = useState('overview');
  const [financeTab, setFinanceTab] = useState('networth'); // sub-tab for finance
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [modal, setModal] = useState<string|null>(null);
  const [panic, setPanic] = useState(settings.isPanic);
  const [notionUrl, setNotionUrl] = useState(settings.notionUrl);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ amount:'', currency:'EGP', description:'', name:'', category:'شخصي', method:'كاش', source:'عام', hours:'', date: new Date().toISOString().split('T')[0], assetType:'كاش', liquidType:'سائل', initialValue:'', currentValue:'', platform:'', price:'', priority:'1' });

  const post = async (type: string, data: any) => {
    setSaving(true);
    await fetch('/api/finance/add', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type, data }) });
    setSaving(false);
    setModal(null);
    window.location.reload();
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); post(modal!, form); };

  const barData = [
    ...incomes.slice(0, 6).map((_, i) => ({ name: `شهر ${i + 1}`, الدخل: incomes[i]?.amount || 0, المصروفات: transactions[i]?.amount || 0 }))
  ].reverse();

  const pieData = Object.entries(transactions.reduce((acc: any, t: any) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {})).map(([name, val]) => ({ name, value: val as number }));

  const mainNavItems = [
    { id: 'overview', icon: <LayoutDashboard size={24} />, label: 'لوحة التحكم' },
    { id: 'finance', icon: <Wallet size={24} />, label: 'الإدارة المالية' },
    { id: 'wishlist', icon: <Target size={24} />, label: 'الأمنيات' },
    { id: 'settings', icon: <Settings size={24} />, label: 'الإعدادات' },
  ];

  const financeTabs = [
    { id: 'networth', label: 'صافي الثروة', icon: <Sparkles size={18}/> },
    { id: 'assets', label: 'الأصول', icon: <Briefcase size={18}/> },
    { id: 'investments', label: 'الاستثمارات', icon: <Activity size={18}/> },
    { id: 'wallets', label: 'المحافظ', icon: <Gem size={18}/> },
    { id: 'transactions', label: 'المعاملات', icon: <CreditCard size={18}/> },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full gap-8">
      {/* Branding */}
      <div className="flex items-center gap-4 px-2">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 neon-text-emerald shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          <Shield size={30} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight eng-num">MARK OS</h1>
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest leading-none">V 4.0 Core</p>
        </div>
      </div>

      {/* Main Nav */}
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

      {/* Quick Actions - In Sidebar */}
      <div className="mt-auto flex flex-col gap-3">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-2 mb-1">أوامر سريعة بنظام التشغيل</p>
        <button onClick={() => { setForm({ ...form }); setModal('transaction'); }} className="mega-action-btn bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 w-full justify-center py-5">
          <Banknote size={24}/> تسجيل صرف
        </button>
        <button onClick={() => { setForm({ ...form }); setModal('income'); }} className="mega-action-btn bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 w-full justify-center py-5">
          <Wallet size={24}/> تسجيل دخل
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-super-dark text-white overflow-hidden font-sans font-bold" dir="rtl">
      
      {/* BACKGROUND EFFECTS */}
      {panic && <div className="absolute inset-0 bg-red-500/10 z-0 pointer-events-none animate-pulse" />}

      {/* DESKTOP SIDEBAR (RIGHT) */}
      <aside className="hidden lg:flex flex-col w-[320px] h-full bg-white/2 border-l border-white/10 p-8 backdrop-blur-3xl z-40">
        <SidebarContent />
      </aside>

      {/* MOBILE HEADER (TOP) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white/5 backdrop-blur-3xl border-b border-white/10 z-30 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Shield size={20} />
           </div>
           <h1 className="text-xl font-black eng-num">MARK OS</h1>
        </div>
        <button onClick={() => setMobileSidebar(true)} className="p-3 rounded-xl bg-white/5 border border-white/10"><Menu size={24} /></button>
      </header>

      {/* MOBILE DRAWER SIDEBAR */}
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative scroll-smooth pt-28 lg:pt-12 px-6 md:px-12 pb-12">
        <AnimatePresence mode="wait">

          {/* ===================== OVERVIEW / لوحة التحكم ===================== */}
          {mainTab === 'overview' && (
            <motion.div key="ov" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-10 max-w-7xl mx-auto">
              
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black mb-2 flex items-center gap-4">نظرة عامة <Sparkles className="text-amber-400 md:w-10 md:h-10" /></h2>
                  <p className="text-lg text-gray-400 bg-white/5 px-4 py-1.5 rounded-xl inline-block">تحياتي يا مارك، إليك ملخص حي للنظام المالي.</p>
                </div>
              </div>

              {/* QUICK HIGHLIGHTS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="grand-card p-10 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 group relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl transition-all group-hover:scale-150" />
                  <p className="text-emerald-400 font-black text-lg mb-2 flex items-center gap-2"><Wallet size={20}/> صافي الثروة</p>
                  <p className="text-4xl lg:text-5xl font-black leading-none">{fmt(netWorth.totalEGP)} <span className="text-xl text-emerald-500/50">EGP</span></p>
                </div>
                
                <div className="grand-card p-10 bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 group relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-3xl transition-all group-hover:scale-150" />
                  <p className="text-rose-400 font-black text-lg mb-2 flex items-center gap-2"><CreditCard size={20}/> التوقع الشهري</p>
                  <p className="text-4xl lg:text-5xl font-black leading-none">{fmt(forecast.projectedEndMonthSpent)} <span className="text-xl text-rose-500/50">EGP</span></p>
                  {forecast.isBankruptcyRisk && <p className="text-xs font-bold text-rose-400 mt-3 bg-rose-500/20 p-2 rounded-xl inline-block border border-rose-500/30">تحذير نفاد سيولة وشيك ⚠️</p>}
                </div>

                <div className="grand-card p-10 bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 group relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl transition-all group-hover:scale-150" />
                  <p className="text-blue-400 font-black text-lg mb-2 flex items-center gap-2"><Briefcase size={20}/> سعر ساعة العمل</p>
                  <p className="text-4xl lg:text-5xl font-black leading-none">{fmt(hourlyRate)} <span className="text-xl text-blue-500/50">EGP/hr</span></p>
                </div>
              </div>

              {/* CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
                <div className="grand-card p-10">
                  <h3 className="text-2xl font-black mb-8 text-gray-300 border-r-4 border-emerald-500 pr-5">الدخل والمصروفات (آخر 6 أشهر)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <XAxis dataKey="name" stroke="#666" tick={{fill:'#999', fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo'}} />
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '16px', fontWeight: 'bold' }} />
                        <Bar dataKey="الدخل" fill="#10b981" radius={[12,12,0,0]} />
                        <Bar dataKey="المصروفات" fill="#f43f5e" radius={[12,12,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grand-card p-10">
                  <h3 className="text-2xl font-black mb-8 text-gray-300 border-r-4 border-rose-500 pr-5">تحليل فئات الصرف</h3>
                  <div className="h-80 flex flex-col md:flex-row items-center gap-10">
                    <div className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData.length ? pieData : [{name:'لا يوجد', value:1}]} innerRadius={85} outerRadius={120} dataKey="value" paddingAngle={5}>
                            {(pieData.length?pieData:[{name:'لا يوجد',value:1}]).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '16px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full flex flex-col justify-center gap-4">
                      {pieData.slice(0, 5).map((p, i) => (
                        <div key={p.name} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                          <div className="flex items-center gap-4">
                            <span className="w-5 h-5 rounded-full shadow-[0_0_10px] shadow-current" style={{ backgroundColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] }} />
                            <span className="font-bold text-lg">{p.name}</span>
                          </div>
                          <span className="font-black text-xl eng-num">{fmt(p.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===================== FINANCE / الإدارة المالية ===================== */}
          {mainTab === 'finance' && (
            <motion.div key="fi" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-10 max-w-[1400px] mx-auto flex flex-col h-full">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-4">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black mb-2">النظام المالي العميق</h2>
                  <p className="text-lg text-gray-500 mb-2">إدارة مركزية لكافة الأصول، الاستثمارات، والمحافظ بذكاء فائق.</p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                    <a href="https://www.notion.so/Personal-finances-685797555bc5459b9e437cb1a60d402a" target="_blank" rel="noopener noreferrer" className="mega-action-btn bg-blue-500/20 text-blue-300 border border-blue-500/30 px-8 hover:bg-blue-500/30">
                      <ExternalLink size={20}/> Notion المركزية
                    </a>
                    <button onClick={() => { setForm({ ...form }); setModal('asset'); }} className="mega-action-btn bg-white/5 text-emerald-400 border border-white/10 hover:bg-white/10 px-8">+ توثيق أصل</button>
                    <button onClick={() => { setForm({ ...form }); setModal('investment'); }} className="mega-action-btn bg-white/5 text-amber-400 border border-white/10 hover:bg-white/10 px-8">+ دخول استثمار</button>
                </div>
              </div>

              {/* HORIZONTAL FINANCE TABS - INSIDE COMPONENT */}
              <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide py-4 w-full border-b border-white/5">
                {financeTabs.map(tab => (
                  <button key={tab.id} onClick={() => setFinanceTab(tab.id)} className={`relative flex items-center gap-3 px-8 py-3 rounded-[2rem] text-xl font-black transition-all whitespace-nowrap ${financeTab === tab.id ? 'text-black' : 'text-gray-500 bg-white/2 hover:text-white hover:bg-white/5'}`}>
                    {financeTab === tab.id && <motion.div layoutId="financeTabPill" className="absolute inset-0 bg-emerald-400 rounded-[2rem] shadow-[0_10px_30px_rgba(16,185,129,0.3)]" style={{ originY: "0px" }} />}
                    <span className="relative z-10 flex items-center gap-2">{tab.icon} {tab.label}</span>
                  </button>
                ))}
              </div>

              {/* FINANCE SUB-PAGES */}
              <div className="flex-1 py-8">
                <AnimatePresence mode="wait">
                  
                  {financeTab === 'networth' && (
                    <motion.div key="fnw" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-3 grand-card p-12 bg-gradient-to-br from-emerald-500/10 via-super-dark to-blue-500/10 border-emerald-500/20 flex flex-col md:flex-row items-center justify-between">
                        <div>
                          <p className="text-emerald-400 font-black text-lg uppercase tracking-widest mb-3">صافي الثروة المجمّعة</p>
                          <p className="text-5xl md:text-6xl font-black text-white">{fmt(netWorth.totalEGP)} <span className="text-xl text-white/30">EGP</span></p>
                        </div>
                        <div className="mt-8 md:mt-0 bg-black/40 p-6 rounded-[2.5rem] border border-white/10 text-center shadow-xl">
                          <p className="text-gray-500 font-bold text-base mb-2">القيمة المعادلة بالدولار</p>
                          <p className="text-4xl font-black text-amber-400">{fmt(netWorth.totalUSD)} <span className="text-xl text-amber-400/40">USD</span></p>
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
                    <motion.div key="fa" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {assets.map((a, i) => (
                          <div key={i} className="grand-card p-10 flex flex-col justify-between group cursor-pointer hover:border-emerald-500/50">
                            <div className="mb-8">
                              <h3 className="text-3xl font-black mb-3 group-hover:text-emerald-400 transition-colors uppercase">{a.name}</h3>
                              <span className="px-5 py-2 rounded-2xl bg-white/10 text-gray-400 text-base font-bold border border-white/5 uppercase tracking-widest">{a.type} · {a.liquidType || 'مادي'}</span>
                            </div>
                            <div>
                               <p className="text-5xl font-black text-emerald-400">{fmt(a.value)} <span className="text-xl text-emerald-400/50">{a.currency}</span></p>
                            </div>
                          </div>
                        ))}
                        {assets.length === 0 && <div className="col-span-full p-24 text-center text-gray-600 text-3xl font-black grand-card border-dashed">لم يتم توثيق أي أصول بعد بنظام التشغيل الأساسي.</div>}
                    </motion.div>
                  )}

                  {financeTab === 'investments' && (
                    <motion.div key="fi" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {investments.map((inv, i) => {
                          const roi = inv.roiPercentage || 0;
                          return (
                            <div key={i} className="grand-card p-10 flex flex-col justify-between hover:scale-[1.02]">
                              <div className="mb-8">
                                <h3 className="text-3xl font-black mb-3">{inv.name}</h3>
                                <p className="text-gray-500 text-xl font-bold bg-white/5 inline-block px-4 py-1 rounded-xl">{inv.platform}</p>
                              </div>
                              <div className="flex items-end justify-between gap-4">
                                <div>
                                  <p className="text-sm text-gray-500 font-black uppercase tracking-widest mb-2">القيمة السوقية</p>
                                  <p className="text-5xl font-black">{fmt(inv.currentValue)}</p>
                                </div>
                                <div className={`text-2xl font-black px-6 py-4 rounded-3xl border shadow-xl ${roi >= 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                  <span className="eng-num">{roi >= 0 ? '+' : ''}{roi.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {investments.length === 0 && <div className="col-span-full p-24 text-center text-gray-600 text-3xl font-black grand-card border-dashed">تعلم الاستثمار لبناء إمبراطوريتك، ثم وثق صفقاتك هنا.</div>}
                    </motion.div>
                  )}

                  {financeTab === 'wallets' && (
                    <motion.div key="fw" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="space-y-12">
                       <div className="grand-card p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full" />
                        <h3 className="text-3xl font-black mb-10 text-white flex items-center gap-4">توزيع الدخل التلقائي الآلي <Gem className="text-purple-400" /></h3>
                        <div className="h-24 w-full flex rounded-3xl overflow-hidden border-2 border-white/10 font-black text-2xl text-white shadow-2xl">
                          <div style={{width:`${distributionSettings?.givingPercentage*100||10}%`}} className="h-full bg-emerald-500/90 flex items-center justify-center border-l border-white/10 hover:brightness-110 transition-all">عطاء</div>
                          <div style={{width:`${distributionSettings?.obligationsPercentage*100||20}%`}} className="h-full bg-blue-500/90 flex items-center justify-center border-l border-white/10 hover:brightness-110 transition-all">التزامات</div>
                          <div style={{width:`${distributionSettings?.personalPercentage*100||10}%`}} className="h-full bg-amber-500/90 flex items-center justify-center border-l border-white/10 hover:brightness-110 transition-all">شخصي</div>
                          <div style={{width:`${distributionSettings?.investmentPercentage*100||60}%`}} className="h-full bg-purple-500/90 flex items-center justify-center hover:brightness-110 transition-all">استثمار</div>
                        </div>
                        <p className="mt-8 text-gray-500 text-lg font-bold text-center">كل جنيه يدخل النظام يتم تقسيمه تلقائياً حسب الموازين المحددة أعلاه.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {['عطاء (وفاء)', 'الالتزامات', 'شخصي', 'الاستثمار'].map((name, idx) => {
                          const wIds = ['giving', 'obligations', 'personal', 'investment'];
                          const cols = ['emerald', 'blue', 'amber', 'purple'];
                          const col = cols[idx];
                          const wallet = wallets.find((w:any) => w.id === wIds[idx]);
                          return (
                            <div key={idx} className={`grand-card p-10 bg-${col}-500/[0.03] border-${col}-500/20 hover:bg-${col}-500/[0.08] transition-all hover:-translate-y-2`}>
                              <div className={`w-12 h-12 rounded-2xl bg-${col}-500/20 border border-${col}-500/30 flex items-center justify-center mb-10`}>
                                 <Gem className={`text-${col}-400`} size={24} />
                              </div>
                              <h3 className={`text-3xl font-black text-white mb-2`}>{fmt(wallet?.balance || 0)}</h3>
                              <p className={`text-lg font-black text-${col}-400 uppercase tracking-widest`}>{name}</p>
                            </div>
                          );
                        })}
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
                                 <td className="py-8 font-black text-white group-hover:text-emerald-400 transition-colors">{t.description}</td>
                                 <td className="py-8"><span className="bg-white/5 px-5 py-2.5 rounded-2xl text-lg text-gray-400 font-black border border-white/10 uppercase">{t.category}</span></td>
                                 <td className="py-8 text-gray-500 font-bold eng-num">{new Date(t.date).toLocaleDateString('en-US')}</td>
                                 <td className="py-8 text-left font-black text-3xl text-rose-400 eng-num truncate">- {fmt(t.amount)}</td>
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
                       <div key={i} className={`grand-card p-10 flex flex-col justify-between group ${w.isPurchased ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                         <div className="flex justify-between items-start mb-8">
                           <h3 className="text-4xl font-black group-hover:text-amber-400 transition-colors uppercase leading-tight">{w.name}</h3>
                           <span className={`px-5 py-2.5 font-black text-sm rounded-2xl border uppercase tracking-widest ${w.priority === 1 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : w.priority === 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                             {w.priority === 1 ? 'أولوية قصوى' : w.priority === 2 ? 'رغبة عامة' : 'ترفيه غير ملزِم'}
                           </span>
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
                  <div className="grand-card p-10 hover:border-emerald-500/30 transition-all">
                    <h3 className="text-xl font-black mb-6 text-emerald-400 flex items-center gap-3">سعر الصرف العالمي (EGP/USD)</h3>
                    <div className="flex gap-4">
                      <input type="number" className="flex-1 bg-black/40 border-2 border-white/10 rounded-2xl p-6 text-4xl font-black eng-num focus:border-emerald-500 outline-none transition-all" defaultValue={settings.usdRate} onBlur={e => post('setting', { key: 'usd_rate', value: e.target.value })} />
                    </div>
                  </div>

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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-super-dark/95 backdrop-blur-[60px] overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.85, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 100 }} transition={{ type: "spring", damping: 30, stiffness: 400 }} className="w-full max-w-3xl bg-black border border-white/10 rounded-[4rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative my-auto">
              
              <button type="button" onClick={() => setModal(null)} className="absolute top-12 left-12 p-5 bg-white/5 hover:bg-white/10 rounded-[2rem] transition-all border border-white/10 hover:scale-110 active:scale-90"><X size={40}/></button>
              
              <h2 className="text-5xl md:text-6xl font-black mb-12 text-emerald-400 border-r-8 border-emerald-500 pr-8">
                {{transaction:'توثيق مصروف مالي', asset:'إضافة لقفص الأصول', income:'تسجيل مورد دخل', investment:'فتح مركز استثماري', hours:'تتبع زمن العمل', wishlist:'تسجيل رغبة مستقبلية'}[modal] || 'إدخال بيانات'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* Visual Impact Number Input */}
                {!['hours','wishlist'].includes(modal) && (
                  <div>
                    <label className="text-xl font-black text-gray-500 mb-6 block uppercase tracking-widest text-center">{modal==='investment'?'قائمة التكلفة الأولية':'المبلغ المالي الصافي'}</label>
                    <input required type="number" step="0.01" autoFocus className="w-full bg-white/2 border-3 border-white/5 focus:border-emerald-500 rounded-[2.5rem] p-10 text-6xl font-black text-center eng-num outline-none transition-all placeholder-gray-800 shadow-inner" value={modal==='investment'?form.initialValue:form.amount} onChange={e=>setForm({...form,[modal==='investment'?'initialValue':'amount']:e.target.value})} placeholder="0.00" />
                  </div>
                )}

                {/* Investment Floating Value */}
                 {modal==='investment' && (
                  <div>
                    <label className="text-2xl font-black text-gray-500 mb-4 block">القيمة العادلة حالياً</label>
                    <input required type="number" step="0.01" className="w-full bg-white/2 border-2 border-white/10 focus:border-amber-500 rounded-[2.5rem] p-8 text-5xl font-black eng-num outline-none transition-all text-center" value={form.currentValue} onChange={e=>setForm({...form,currentValue:e.target.value})} placeholder="0.00" />
                  </div>
                )}

                {/* Item Identity */}
                {['asset','investment','wishlist','income','transaction'].includes(modal) && (
                  <div>
                    <select className="w-full bg-super-dark border-2 border-white/10 focus:border-blue-500 rounded-3xl p-6 text-3xl font-black outline-none transition-all appearance-none cursor-pointer text-white" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>
                      <option className="bg-super-dark" value="EGP">EGP - جنيه مصري</option>
                      <option className="bg-super-dark" value="USD">USD - دولار أمريكي</option>
                    </select>
                    <label className="text-2xl font-black text-gray-500 mb-4 block">{['transaction','income'].includes(modal) ? 'بيان المعاملة (السبب)' : 'اسم العنصر / الكيان'}</label>
                    <input required type="text" className="w-full bg-white/5 border-2 border-white/10 focus:border-emerald-500 rounded-[2.5rem] p-8 text-3xl font-black outline-none transition-all" value={['transaction','income'].includes(modal) ? form.description : form.name} onChange={e=>setForm({...form, [['transaction','income'].includes(modal)?'description':'name']:e.target.value})} placeholder="..." />
                  </div>
                )}

                {/* Selectors Grid */}
                {!['hours'].includes(modal) && (
                  <div className="grid grid-cols-2 gap-8">
                    <div className="relative group">
                      <label className="text-xl font-black text-gray-500 mb-4 block">عملة التداول</label>
                      <select className="w-full bg-white/5 border-2 border-white/10 focus:border-blue-500 rounded-3xl p-6 text-3xl font-black outline-none transition-all appearance-none cursor-pointer" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>
                        <option value="EGP">EGP - جنيه مصري</option>
                        <option value="USD">USD - دولار أمريكي</option>
                      </select>
                      <ChevronLeft className="absolute left-6 bottom-8 text-gray-500 pointer-events-none -rotate-90" />
                    </div>

                    {modal==='transaction' && (
                      <div className="relative">
                        <label className="text-xl font-black text-gray-500 mb-4 block">التصنيف المالي</label>
                        <select className="w-full bg-super-dark border-2 border-white/10 focus:border-rose-500 rounded-3xl p-6 text-3xl font-black outline-none transition-all appearance-none cursor-pointer text-white" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                          {['شخصي','طعام','سكن','مواصلات','ترفيه','صحة','استثمار','تعليم','أخرى'].map(c=><option className="bg-super-dark" key={c}>{c}</option>)}
                        </select>
                        <ChevronLeft className="absolute left-6 bottom-8 text-gray-500 pointer-events-none -rotate-90" />
                      </div>
                    )}
                    
                    {modal==='asset' && (
                      <div className="relative">
                         <label className="text-xl font-black text-gray-500 mb-4 block">سيولة الأصل</label>
                        <select className="w-full bg-super-dark border-2 border-white/10 focus:border-blue-500 rounded-3xl p-6 text-3xl font-black outline-none transition-all appearance-none cursor-pointer text-white" value={form.liquidType} onChange={e=>setForm({...form,liquidType:e.target.value})}>
                          <option className="bg-super-dark" value="سائل">كاش / بنك (سيولة)</option>
                          <option className="bg-super-dark" value="مادي">أصل مادي (ذهب/عقار)</option>
                          <option className="bg-super-dark" value="رقمي">أصول مشفرة (Crypto)</option>
                        </select>
                        <ChevronLeft className="absolute left-6 bottom-8 text-gray-500 pointer-events-none -rotate-90" />
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={saving} className="w-full py-10 bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-60 rounded-[3rem] text-4xl font-black flex items-center justify-center gap-6 transition-all active:scale-95 mt-10 shadow-[0_20px_80px_rgba(16,185,129,0.3)]">
                  {saving ? <div className="w-10 h-10 border-6 border-black/20 border-t-black rounded-full animate-spin"/> : <Check size={48}/>}
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
