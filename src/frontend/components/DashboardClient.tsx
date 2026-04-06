"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Activity, Wallet, Shield, Menu, X, Settings, ExternalLink, Save, Target, Clock, AlertTriangle, Gem, Check, LayoutDashboard, Briefcase, ListTodo, HeartPulse, CreditCard, Banknote, Sparkles } from 'lucide-react';

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
  const [sidebar, setSidebar] = useState(false);
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

  return (
    <div className="flex h-screen bg-super-dark text-white overflow-hidden font-sans font-bold" dir="rtl">
      
      {/* BACKGROUND EFFECTS */}
      {panic && <div className="absolute inset-0 bg-red-500/10 z-0 pointer-events-none animate-pulse" />}

      {/* TOP NAVIGATION / MAIN HEADER */}
      <header className="fixed top-0 left-0 right-0 h-24 bg-white/5 backdrop-blur-3xl border-b border-white/10 z-40 flex items-center px-6 md:px-12 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 neon-text-emerald shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Shield size={30} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight eng-num">MARK OS</h1>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest leading-none">Financial Core</p>
          </div>
        </div>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-2 bg-black/40 p-2 rounded-3xl border border-white/5">
          {mainNavItems.map(item => (
            <button key={item.id} onClick={() => setMainTab(item.id)} className={`relative flex items-center gap-2 px-6 py-3 rounded-2xl text-lg font-bold transition-all duration-300 ${mainTab === item.id ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {mainTab === item.id && <motion.div layoutId="mainNav" className="absolute inset-0 bg-white/10 rounded-2xl border border-white/10" />}
              <span className="relative z-10 flex items-center gap-2">{item.icon} {item.label}</span>
            </button>
          ))}
        </nav>

        {/* QUICK ACTIONS */}
        <div className="hidden lg:flex gap-3">
          <button onClick={() => { setForm({ ...form }); setModal('transaction'); }} className="mega-action-btn bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"><Banknote size={20}/> صرف</button>
          <button onClick={() => { setForm({ ...form }); setModal('income'); }} className="mega-action-btn bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"><Wallet size={20}/> دخل</button>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button onClick={() => setSidebar(true)} className="lg:hidden p-3 rounded-xl bg-white/5 border border-white/10"><Menu size={24} /></button>
      </header>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {sidebar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex justify-end">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="w-80 h-full bg-super-dark border-l border-white/10 p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">القائمة</h2>
                <button onClick={() => setSidebar(false)} className="p-3 bg-white/5 rounded-xl"><X size={24}/></button>
              </div>
              <div className="flex flex-col gap-3">
                {mainNavItems.map(item => (
                  <button key={item.id} onClick={() => { setMainTab(item.id); setSidebar(false); }} className={`flex items-center gap-4 p-5 rounded-2xl text-xl font-bold transition-all ${mainTab === item.id ? 'bg-white/10 text-white border border-white/20' : 'text-gray-400 bg-white/5'}`}>
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-auto grid grid-cols-2 gap-3">
                <button onClick={() => { setForm({ ...form }); setModal('transaction'); setSidebar(false); }} className="p-4 rounded-xl font-black text-rose-300 bg-rose-500/20 border border-rose-500/30 text-center">صرف</button>
                <button onClick={() => { setForm({ ...form }); setModal('income'); setSidebar(false); }} className="p-4 rounded-xl font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 text-center">دخل</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="pt-28 pb-8 px-6 md:px-12 w-full h-full overflow-y-auto overflow-x-hidden relative scroll-smooth">
        <AnimatePresence mode="wait">

          {/* ===================== OVERVIEW / لوحة التحكم ===================== */}
          {mainTab === 'overview' && (
            <motion.div key="ov" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8 max-w-7xl mx-auto">
              
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black mb-2 flex items-center gap-3">مرحباً يا مارك <Sparkles className="text-amber-400" size={32}/></h2>
                  <p className="text-lg text-gray-400">نظرة سريعة ومريحة لملخص وضعك الحالي.</p>
                </div>
              </div>

              {/* QUICK HIGHLIGHTS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="grand-card p-8 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20">
                  <p className="text-emerald-400 font-black text-lg mb-2 flex items-center gap-2"><Wallet size={20}/> صافي الثروة</p>
                  <p className="text-4xl lg:text-5xl font-black">{fmt(netWorth.totalEGP)} <span className="text-xl text-emerald-500/50">EGP</span></p>
                </div>
                
                <div className="grand-card p-8 bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20">
                  <p className="text-rose-400 font-black text-lg mb-2 flex items-center gap-2"><CreditCard size={20}/> التوقع الشهري للصرف</p>
                  <p className="text-4xl lg:text-5xl font-black">{fmt(forecast.projectedEndMonthSpent)} <span className="text-xl text-rose-500/50">EGP</span></p>
                  {forecast.isBankruptcyRisk && <p className="text-sm font-bold text-rose-400 mt-2 bg-rose-500/20 p-2 rounded-lg inline-block">تحذير نفاد سيولة وشيك ⚠️</p>}
                </div>

                <div className="grand-card p-8 bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20">
                  <p className="text-blue-400 font-black text-lg mb-2 flex items-center gap-2"><Briefcase size={20}/> سعر ساعة وقتك</p>
                  <p className="text-4xl lg:text-5xl font-black">{fmt(hourlyRate)} <span className="text-xl text-blue-500/50">EGP / hr</span></p>
                </div>
              </div>

              {/* CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                <div className="grand-card p-8">
                  <h3 className="text-xl font-black mb-6 text-gray-300">الدخل والمصروفات</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <XAxis dataKey="name" stroke="#666" tick={{fill:'#999', fontSize: 12, fontWeight: 'bold', fontFamily: 'Cairo'}} />
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '16px', fontWeight: 'bold' }} />
                        <Bar dataKey="الدخل" fill="#10b981" radius={[8,8,0,0]} />
                        <Bar dataKey="المصروفات" fill="#f43f5e" radius={[8,8,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grand-card p-8">
                  <h3 className="text-xl font-black mb-6 text-gray-300">توزيع المصروفات (فئات)</h3>
                  <div className="h-64 flex items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData.length ? pieData : [{name:'لا يوجد', value:1}]} innerRadius={70} outerRadius={100} dataKey="value" paddingAngle={4}>
                          {(pieData.length?pieData:[{name:'لا يوجد',value:1}]).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '16px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-1/2 ml-4 flex flex-col justify-center gap-3">
                      {pieData.slice(0, 5).map((p, i) => (
                        <div key={p.name} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="font-bold">{p.name}</span>
                          </div>
                          <span className="font-black eng-num">{fmt(p.value)}</span>
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
            <motion.div key="fi" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8 max-w-[1400px] mx-auto min-h-[70vh] flex flex-col">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black mb-2">الإدارة المالية</h2>
                  <p className="text-lg text-gray-400">تحكم كامل في كل الأصول والأموال والمحافظ من مكان واحد.</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setForm({ ...form }); setModal('asset'); }} className="mega-action-btn bg-purple-500/20 text-purple-300 border-purple-500/30">+ أصل</button>
                    <button onClick={() => { setForm({ ...form }); setModal('investment'); }} className="mega-action-btn bg-amber-500/20 text-amber-300 border-amber-500/30">+ استثمار</button>
                </div>
              </div>

              {/* HORIZONTAL FINANCE TABS */}
              <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide py-4 w-full">
                {financeTabs.map(tab => (
                  <button key={tab.id} onClick={() => setFinanceTab(tab.id)} className={`relative flex items-center gap-3 px-8 py-4 rounded-3xl text-xl font-black transition-all whitespace-nowrap ${financeTab === tab.id ? 'text-black' : 'text-gray-400 bg-white/5 hover:text-white hover:bg-white/10'}`}>
                    {financeTab === tab.id && <motion.div layoutId="financeTabPill" className="absolute inset-0 bg-emerald-400 rounded-3xl" style={{ originY: "0px" }} />}
                    <span className="relative z-10 flex items-center gap-3">{tab.icon} {tab.label}</span>
                  </button>
                ))}
              </div>

              {/* FINANCE SUB-PAGES */}
              <div className="flex-1 mt-6">
                <AnimatePresence mode="wait">
                  
                  {financeTab === 'networth' && (
                    <motion.div key="fnw" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-3 grand-card p-10 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20 flex flex-col md:flex-row items-center justify-between">
                        <div>
                          <p className="text-emerald-400 font-bold text-xl uppercase tracking-widest mb-2">إجمالي صافي الثروة</p>
                          <p className="text-6xl md:text-7xl font-black">{fmt(netWorth.totalEGP)} <span className="text-2xl text-white/40">EGP</span></p>
                        </div>
                        <div className="mt-6 md:mt-0 bg-black/30 p-6 rounded-3xl border border-white/10 text-center">
                          <p className="text-gray-400 font-bold mb-2">ما يعادل بالدولار</p>
                          <p className="text-4xl font-black text-amber-400">{fmt(netWorth.totalUSD)} <span className="text-xl text-amber-400/50">USD</span></p>
                        </div>
                      </div>

                      <div className="grand-card p-8 bg-purple-500/5 border-purple-500/10">
                        <p className="text-purple-400 font-bold text-lg mb-2">إجمالي الأصول</p>
                        <p className="text-5xl font-black">{fmt(netWorth.assetsTotal)}</p>
                      </div>
                      <div className="grand-card p-8 bg-amber-500/5 border-amber-500/10">
                        <p className="text-amber-400 font-bold text-lg mb-2">إجمالي الاستثمارات</p>
                        <p className="text-5xl font-black">{fmt(netWorth.investmentsTotal)}</p>
                      </div>
                      <div className="grand-card p-8 bg-blue-500/5 border-blue-500/10">
                        <p className="text-blue-400 font-bold text-lg mb-2">الدخل السلبي السنوي</p>
                        <p className="text-5xl font-black">{fmt(netWorth.passiveIncomeAnnual)}</p>
                      </div>
                    </motion.div>
                  )}

                  {financeTab === 'assets' && (
                    <motion.div key="fa" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assets.map((a, i) => (
                          <div key={i} className="grand-card p-8 flex flex-col justify-between group cursor-pointer hover:border-emerald-500/50">
                            <div className="mb-6">
                              <h3 className="text-2xl font-black mb-2">{a.name}</h3>
                              <span className="px-4 py-1.5 rounded-full bg-white/10 text-gray-300 text-sm font-bold border border-white/10">{a.type} · {a.liquidType || 'مادي'}</span>
                            </div>
                            <div>
                              <p className="text-4xl font-black text-emerald-400">{fmt(a.value)} <span className="text-lg text-emerald-400/50">{a.currency}</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {assets.length === 0 && <div className="p-12 text-center text-gray-500 text-2xl font-bold grand-card">لا توجد أصول مضافة بعد. اضغط على الزر بالأعلى لإضافة أصل جديد.</div>}
                    </motion.div>
                  )}

                  {financeTab === 'investments' && (
                    <motion.div key="fi" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {investments.map((inv, i) => {
                          const roi = inv.roiPercentage || 0;
                          return (
                            <div key={i} className="grand-card p-8 flex flex-col justify-between">
                              <div className="mb-6">
                                <h3 className="text-2xl font-black mb-2">{inv.name}</h3>
                                <p className="text-gray-400 text-lg font-bold">{inv.platform}</p>
                              </div>
                              <div className="flex items-end justify-between">
                                <div>
                                  <p className="text-sm text-gray-500 font-bold mb-1">القيمة الحالية</p>
                                  <p className="text-4xl font-black">{fmt(inv.currentValue)}</p>
                                </div>
                                <div className={`text-2xl font-black px-4 py-2 rounded-xl flex items-center justify-center border ${roi >= 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                  <span className="eng-num">{roi >= 0 ? '+' : ''}{roi.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {investments.length === 0 && <div className="p-12 text-center text-gray-500 text-2xl font-bold grand-card">تعلم الاستثمار ثم ابدأ بإضافة استثماراتك هنا!</div>}
                    </motion.div>
                  )}

                  {financeTab === 'wallets' && (
                    <motion.div key="fw" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="space-y-8">
                       <div className="grand-card p-8 mb-8">
                        <h3 className="text-2xl font-black mb-4">نظام الدلو التلقائي (Distribution system)</h3>
                        <div className="h-16 w-full flex rounded-2xl overflow-hidden border border-white/20 font-black text-xl text-white">
                          <div style={{width:`${distributionSettings?.givingPercentage*100||10}%`}} className="h-full bg-emerald-500/80 flex items-center justify-center">عطاء</div>
                          <div style={{width:`${distributionSettings?.obligationsPercentage*100||20}%`}} className="h-full bg-blue-500/80 flex items-center justify-center">التزامات</div>
                          <div style={{width:`${distributionSettings?.personalPercentage*100||10}%`}} className="h-full bg-amber-500/80 flex items-center justify-center">شخصي</div>
                          <div style={{width:`${distributionSettings?.investmentPercentage*100||60}%`}} className="h-full bg-purple-500/80 flex items-center justify-center">استثمار</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {['عطاء (لله)', 'التزامات', 'شخصي', 'استثمار'].map((name, idx) => {
                          const wIds = ['giving', 'obligations', 'personal', 'investment'];
                          const cols = ['emerald', 'blue', 'amber', 'purple'];
                          const col = cols[idx];
                          const wallet = wallets.find((w:any) => w.id === wIds[idx]);
                          return (
                            <div key={idx} className={`grand-card p-8 bg-${col}-500/5 border-${col}-500/20 hover:bg-${col}-500/10 transition-all`}>
                              <h3 className={`text-2xl font-black text-${col}-400 mb-6 bg-${col}-500/10 inline-block px-4 py-2 rounded-xl`}>{name}</h3>
                              <p className="text-5xl font-black text-white">{fmt(wallet?.balance || 0)} <span className="text-xl text-gray-500 block mt-2">رصيد متراكم</span></p>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {financeTab === 'transactions' && (
                    <motion.div key="ft" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="space-y-6">
                       <div className="grand-card p-8 overflow-x-auto">
                         <table className="w-full text-lg">
                           <thead>
                             <tr className="text-gray-500 border-b border-white/10 uppercase tracking-widest text-sm">
                               <th className="py-4 text-right font-black w-1/3">البيان</th>
                               <th className="py-4 text-right font-black">الفئة</th>
                               <th className="py-4 text-right font-black">التاريخ</th>
                               <th className="py-4 text-left font-black">المبلغ</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                             {transactions.map((t, i) => (
                               <tr key={i} className="hover:bg-white/5 transition-colors group">
                                 <td className="py-5 font-bold text-white group-hover:text-emerald-400 transition-colors">{t.description}</td>
                                 <td className="py-5"><span className="bg-white/10 px-3 py-1.5 rounded-lg text-sm text-gray-300 font-bold border border-white/5">{t.category}</span></td>
                                 <td className="py-5 text-gray-400 font-bold eng-num">{new Date(t.date).toLocaleDateString('en-US')}</td>
                                 <td className="py-5 text-left font-black text-2xl text-rose-400 eng-num">- {fmt(t.amount)}</td>
                               </tr>
                             ))}
                             {transactions.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-gray-500 font-bold text-2xl">لا توجد معاملات مسجلة بعد</td></tr>}
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
             <motion.div key="wl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8 max-w-7xl mx-auto">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black mb-2 flex items-center gap-3">قائمة الأمنيات والتسوق <Target className="text-rose-400" size={32}/></h2>
                    <p className="text-lg text-gray-400">احسب تكلفة مشترياتك بوقت من حياتك بدلاً من المال.</p>
                  </div>
                  <button onClick={() => { setForm({ ...form }); setModal('wishlist'); }} className="mega-action-btn bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">+ أمنية</button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {wishlist.map((w, i) => {
                    const hours = w.hoursCost || 0;
                     return (
                       <div key={i} className={`grand-card p-8 flex flex-col justify-between ${w.isPurchased ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                         <div className="flex justify-between items-start mb-6">
                           <h3 className="text-3xl font-black">{w.name}</h3>
                           <span className={`px-4 py-2 font-black text-sm rounded-xl border ${w.priority === 1 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : w.priority === 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                             {w.priority === 1 ? 'أولوية قصوى' : w.priority === 2 ? 'رغبة عادية' : 'رفاهية زائدة'}
                           </span>
                         </div>
                         
                         <p className="text-5xl font-black text-white mb-6 bg-white/5 py-4 px-6 rounded-2xl border border-white/10 w-max">{fmt(w.price)} <span className="text-xl text-gray-500">{w.currency}</span></p>

                         <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex items-center gap-4">
                           <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><Clock size={24} /></div>
                           <div>
                             <p className="text-amber-400/80 font-bold mb-1 text-sm">تكلفة هذا العنصر من حياتك</p>
                             <p className="text-xl font-black text-amber-400">{hours > 0 ? <><span className="eng-num text-2xl">{hours.toFixed(1)}</span> ساعة عمل صافية</> : 'احسبها بتسجيل دخلك'}</p>
                           </div>
                         </div>
                       </div>
                     )
                  })}
               </div>
             </motion.div>
          )}

          {/* ===================== SETTINGS / الإعدادات ===================== */}
          {mainTab === 'settings' && (
            <motion.div key="se" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8 max-w-4xl mx-auto">
               <h2 className="text-4xl md:text-5xl font-black mb-8 flex items-center gap-3">إعدادات النظام <Settings className="text-blue-400" size={32}/></h2>

               <div className="grand-card p-10">
                 <h3 className="text-2xl font-black mb-6 text-emerald-400">سعر الصرف (الدولار)</h3>
                 <div className="flex gap-4">
                   <input type="number" className="flex-1 bg-black/50 border border-white/20 rounded-2xl p-6 text-4xl font-black eng-num focus:border-emerald-500 transition-colors placeholder-gray-600" defaultValue={settings.usdRate} onBlur={e => post('setting', { key: 'usd_rate', value: e.target.value })} />
                   <div className="bg-white/10 rounded-2xl p-6 flex items-center justify-center text-2xl font-black text-gray-400 border border-white/10">ج.م</div>
                 </div>
               </div>

               <div className="grand-card p-10 flex items-center justify-between">
                 <div>
                   <h3 className="text-2xl font-black mb-2 text-rose-400 flex items-center gap-2"><AlertTriangle size={24}/> وضع الطوارئ المالي</h3>
                   <p className="text-gray-400 font-bold text-lg">تفعيل هذا الوضع سيغير ألوان النظام للتحذير من الصرف الزائد ويقوم بتفعيل سياسات تقشفية في التوقعات.</p>
                 </div>
                 <button onClick={() => { setPanic(!panic); post('setting', { key: 'is_panic', value: !panic ? '1' : '0' }); }} className={`shrink-0 w-24 h-12 rounded-full relative transition-all duration-500 ${panic ? 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.6)]' : 'bg-gray-700'}`}>
                    <motion.div layout className={`absolute top-1 bottom-1 w-10 bg-white rounded-full ${panic ? 'right-1' : 'left-1'}`} />
                 </button>
               </div>

               <div className="grand-card p-10">
                 <h3 className="text-2xl font-black mb-6 text-blue-400">قاعدة بيانات Notion</h3>
                 <div className="flex gap-4">
                   <input type="url" placeholder="https://notion.so/..." className="flex-1 bg-black/50 border border-white/20 rounded-2xl p-6 text-xl font-bold focus:border-blue-500 transition-colors eng-num" value={notionUrl} onChange={e => setNotionUrl(e.target.value)} />
                   <button onClick={() => post('setting', { key: 'notion_url', value: notionUrl })} className="mega-action-btn bg-blue-500/20 text-blue-300 border-blue-500/30 w-48 justify-center"><Save size={24}/> حفظ الرابط</button>
                 </div>
               </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ===================== GIANT MODALS ===================== */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-super-dark/95 backdrop-blur-3xl overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full max-w-2xl bg-black border border-white/10 rounded-[3rem] p-10 shadow-2xl relative my-auto">
              
              <button type="button" onClick={() => setModal(null)} className="absolute top-8 left-8 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/10"><X size={32}/></button>
              
              <h2 className="text-4xl md:text-5xl font-black mb-10 text-emerald-400">
                {{transaction:'سجل مصروفاً جديداً', asset:'وثّق أصلاً جديداً', income:'سجل دخلاً جديداً', investment:'مرحباً بالاستثمار الجديد', hours:'وقت العمل', wishlist:'أمنية تستحق العمل'}[modal] || 'إضافة جديدة'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Big Main Number Input */}
                {!['hours','wishlist'].includes(modal) && (
                  <div>
                    <label className="text-xl font-black text-gray-400 mb-4 block">{modal==='investment'?'القيمة التي استثمرتها (الأساس)':'المبلغ'}</label>
                    <input required type="number" step="0.01" autoFocus className="w-full bg-white/5 border-2 border-white/10 focus:border-emerald-500 rounded-3xl p-8 text-6xl font-black text-center eng-num outline-none transition-all" value={modal==='investment'?form.initialValue:form.amount} onChange={e=>setForm({...form,[modal==='investment'?'initialValue':'amount']:e.target.value})} placeholder="0.00" />
                  </div>
                )}

                {/* Investment Current Value */}
                 {modal==='investment' && (
                  <div>
                    <label className="text-xl font-black text-gray-400 mb-4 block">القيمة الحالية في المنصة</label>
                    <input required type="number" step="0.01" className="w-full bg-white/5 border-2 border-white/10 focus:border-amber-500 rounded-3xl p-6 text-4xl font-black eng-num outline-none transition-all" value={form.currentValue} onChange={e=>setForm({...form,currentValue:e.target.value})} placeholder="0.00" />
                  </div>
                )}

                {/* Standard Name / Description Input */}
                {['asset','investment','wishlist','income','transaction'].includes(modal) && (
                  <div>
                    <label className="text-xl font-black text-gray-400 mb-4 block">{['transaction','income'].includes(modal) ? 'البيان (فيما أنفقت أو من أين؟)' : 'اسم العنصر'}</label>
                    <input required type="text" className="w-full bg-white/5 border-2 border-white/10 focus:border-emerald-500 rounded-3xl p-6 text-2xl font-black outline-none transition-all" value={['transaction','income'].includes(modal) ? form.description : form.name} onChange={e=>setForm({...form, [['transaction','income'].includes(modal)?'description':'name']:e.target.value})} placeholder="اكتب وصفاً واضحاً..." />
                  </div>
                )}

                {/* Wishlist Price */}
                {modal==='wishlist' && (
                  <div>
                    <label className="text-xl font-black text-gray-400 mb-4 block">السعر المستهدف</label>
                    <input required type="number" step="0.01" className="w-full bg-white/5 border-2 border-white/10 focus:border-rose-500 rounded-3xl p-6 text-4xl eng-num font-black outline-none transition-all text-center" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0.00" />
                  </div>
                )}

                {/* Grid for Selectors */}
                {!['hours'].includes(modal) && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xl font-black text-gray-400 mb-4 block">العملة</label>
                      <select className="w-full bg-white/5 border-2 border-white/10 focus:border-blue-500 rounded-2xl p-5 text-2xl font-black outline-none transition-all appearance-none" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>
                        <option value="EGP">EGP - جنيـه</option>
                        <option value="USD">USD - دولار</option>
                      </select>
                    </div>

                    {modal==='transaction' && (
                      <div>
                        <label className="text-xl font-black text-gray-400 mb-4 block">الفئة</label>
                        <select className="w-full bg-white/5 border-2 border-white/10 focus:border-rose-500 rounded-2xl p-5 text-2xl font-black outline-none transition-all appearance-none" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                          {['شخصي','طعام','سكن','مواصلات','ترفيه','صحة','استثمار','تعليم','أخرى'].map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                    )}
                    
                    {modal==='asset' && (
                      <div>
                        <label className="text-xl font-black text-gray-400 mb-4 block">نوع الأصل</label>
                        <select className="w-full bg-white/5 border-2 border-white/10 focus:border-blue-500 rounded-2xl p-5 text-2xl font-black outline-none transition-all appearance-none" value={form.liquidType} onChange={e=>setForm({...form,liquidType:e.target.value})}>
                          <option value="سائل">كاش / سيولة بنكية</option>
                          <option value="مادي">أصل مادي (ذهب، معدات)</option>
                          <option value="رقمي">أصل رقمي (كريبتو)</option>
                        </select>
                      </div>
                    )}

                    {modal==='wishlist' && (
                      <div>
                        <label className="text-xl font-black text-gray-400 mb-4 block">الأولوية</label>
                        <select className="w-full bg-white/5 border-2 border-white/10 focus:border-amber-500 rounded-2xl p-5 text-2xl font-black outline-none transition-all appearance-none" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                          <option value="1">أولوية قصوى واحتياج</option>
                          <option value="2">رغبة وتطوير</option>
                          <option value="3">رفاهية غير مستعجلة</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                 {/* Platform for investment */}
                 {modal==='investment' && (
                  <div>
                    <label className="text-xl font-black text-gray-400 mb-4 block">المنصة</label>
                    <input type="text" className="w-full bg-white/5 border-2 border-white/10 focus:border-blue-500 rounded-3xl p-6 text-2xl font-black outline-none transition-all" value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})} placeholder="مثال: البورصة، Thndr..." />
                  </div>
                )}

                <button type="submit" disabled={saving} className="w-full py-8 bg-emerald-500 hover:bg-emerald-400 text-super-dark disabled:opacity-60 rounded-[2.5rem] text-3xl font-black flex items-center justify-center gap-4 transition-all active:scale-95 mt-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                  {saving ? <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin"/> : <Check size={36}/>}
                  {saving ? 'جاري توثيق هذا بملفات النظام...' : 'تأكيد وحفظ'}
                </button>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
