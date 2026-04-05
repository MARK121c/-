"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Activity, Wallet, Shield, Menu, X, Settings, Plus, ExternalLink, Save, Target, TrendingUp, Clock, AlertTriangle, Gem, ChevronDown, Check } from 'lucide-react';

interface Props {
  transactions: any[]; assets: any[]; incomes: any[]; wishlist: any[];
  investments: any[]; passiveSources: any[]; wallets: any[]; workTracking: any[];
  netWorth: any; forecast: any; hourlyRate: number; distributionSettings: any;
  settings: { usdRate: number; isPanic: boolean; notionUrl: string };
}

const COLORS = ['#10b981','#3b82f6','#f59e0b','#a855f7','#ef4444','#06b6d4'];
const fmt = (n: number) => (n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 0 });

export default function DashboardClient({ transactions, assets, incomes, wishlist, investments, passiveSources, wallets, workTracking, netWorth, forecast, hourlyRate, distributionSettings, settings }: Props) {
  const [tab, setTab] = useState('overview');
  const [sidebar, setSidebar] = useState(true);
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

  const navItems = [
    { id:'overview', icon:<Activity size={18}/>, label:'نظرة عامة' },
    { id:'finance', icon:<Wallet size={18}/>, label:'الإدارة المالية' },
    { id:'wallets', icon:<Gem size={18}/>, label:'المحافظ' },
    { id:'wishlist', icon:<Target size={18}/>, label:'قائمة الأمنيات' },
    { id:'settings', icon:<Settings size={18}/>, label:'الإعدادات' },
  ];

  const barData = [
    ...incomes.slice(0,6).map((_,i)=>({ name:`${i+1}`, income: incomes[i]?.amount||0, expenses: transactions[i]?.amount||0 }))
  ];
  const pieData = Object.entries(transactions.reduce((acc:any,t:any)=>{ acc[t.category]=(acc[t.category]||0)+t.amount; return acc; },{})).map(([name,val])=>({ name, value: val as number }));

  const distPct = {
    giving: Math.round((distributionSettings?.givingPercentage||0.1)*100),
    obligations: Math.round((distributionSettings?.obligationsPercentage||0.2)*100),
    personal: Math.round((distributionSettings?.personalPercentage||0.1)*100),
    investment: Math.round((distributionSettings?.investmentPercentage||0.6)*100),
  };

  return (
    <div className="flex h-screen bg-[#030303] text-white overflow-hidden" dir="rtl" style={{fontFamily:"'Outfit',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap');
        .g-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:1.5rem;}
        .neon{box-shadow:0 0 30px rgba(16,185,129,0.15);}
        .scrollbar::-webkit-scrollbar{width:3px} .scrollbar::-webkit-scrollbar-thumb{background:rgba(16,185,129,0.3);border-radius:10px}
        input,select{outline:none} input:focus,select:focus{border-color:rgba(16,185,129,0.5)!important}
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 20px rgba(239,68,68,0.3)}50%{box-shadow:0 0 50px rgba(239,68,68,0.6)}}
        .panic-glow{animation:pulse-glow 2s infinite}
      `}</style>

      {/* BG Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/[0.05] blur-[120px] rounded-full"/>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/[0.04] blur-[120px] rounded-full"/>
        {panic && <div className="absolute inset-0 bg-red-500/[0.03] panic-glow"/>}
      </div>

      {/* SIDEBAR */}
      <AnimatePresence>
        {sidebar && (
          <motion.aside initial={{x:280}} animate={{x:0}} exit={{x:280}} className="relative z-50 w-64 flex flex-col g-card m-3 rounded-[2rem] p-5 border-emerald-500/10">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center neon"><Shield size={18}/></div>
              <div><p className="font-black text-base leading-none">MARK OS</p><p className="text-[9px] text-emerald-500/70 uppercase tracking-widest mt-1">Financial Core</p></div>
            </div>
            <nav className="flex-1 space-y-1">
              {navItems.map(n=>(
                <button key={n.id} onClick={()=>setTab(n.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab===n.id?'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                  {n.icon} {n.label}
                </button>
              ))}
            </nav>
            {panic && <div className="g-card p-3 rounded-xl border-red-500/30 bg-red-500/5 text-red-400 text-[10px] font-black flex items-center gap-2 mb-3"><AlertTriangle size={14}/>وضع الطوارئ نشط</div>}
            <button onClick={()=>notionUrl?window.open(notionUrl,'_blank'):setTab('settings')} className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-gray-600 hover:text-emerald-400 hover:bg-white/5 transition-all w-full">
              <ExternalLink size={14}/><span className="font-bold uppercase tracking-widest text-[9px]">Notion Workspace</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="flex items-center justify-between p-5 pb-0">
          <button onClick={()=>setSidebar(!sidebar)} className="p-2.5 g-card rounded-xl hover:border-white/20 transition-all"><Menu size={18}/></button>
          <div className="flex gap-2">
            {[
              {label:'+ دخل', type:'income', color:'blue'},
              {label:'+ صرف', type:'transaction', color:'emerald'},
              {label:'+ أصل', type:'asset', color:'purple'},
              {label:'+ استثمار', type:'investment', color:'amber'},
            ].map(btn=>(
              <button key={btn.type} onClick={()=>{setForm({...form});setModal(btn.type);}} className={`px-4 py-2 text-xs font-black rounded-xl transition-all active:scale-95 bg-${btn.color}-500/10 border border-${btn.color}-500/20 text-${btn.color}-400 hover:bg-${btn.color}-500/20`}>
                {btn.label}
              </button>
            ))}
            <button onClick={()=>post('hours',{date:new Date().toISOString().split('T')[0],hours:'8'})} className="px-4 py-2 text-xs font-black rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              + ساعات
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar p-5 space-y-5">
          <AnimatePresence mode="wait">

            {/* ===== OVERVIEW ===== */}
            {tab==='overview' && (
              <motion.div key="ov" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} className="space-y-5">
                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {label:'صافي الثروة',val:`${fmt(netWorth.totalEGP)} ج.م`,sub:`$ ${fmt(netWorth.totalUSD)}`,color:'emerald'},
                    {label:'الدخل السلبي/شهر',val:`${fmt(netWorth.passiveIncomeMonthly)} ج.م`,sub:'تلقائي',color:'blue'},
                    {label:'سعر ساعتك',val:`${fmt(hourlyRate)} ج.م`,sub:'/ ساعة عمل',color:'amber'},
                    {label:'التوقع الشهري',val:`${fmt(forecast.projectedEndMonthSpent)} ج.م`,sub:forecast.isBankruptcyRisk?'⚠ خطر':'آمن',color:forecast.isBankruptcyRisk?'red':'emerald'},
                  ].map(k=>(
                    <div key={k.label} className={`g-card p-5 border-${k.color}-500/10 bg-${k.color}-500/[0.03] rounded-2xl`}>
                      <p className={`text-[9px] font-black uppercase tracking-widest text-${k.color}-500 mb-2`}>{k.label}</p>
                      <p className="text-2xl font-black leading-none">{k.val}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{k.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 g-card p-5">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">دخل مقابل مصاريف</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={barData}>
                        <XAxis dataKey="name" tick={{fill:'#555',fontSize:10}}/>
                        <Tooltip contentStyle={{background:'#0a0a0a',border:'1px solid #222',borderRadius:'12px',fontSize:11}}/>
                        <Bar dataKey="income" fill="#10b981" radius={[4,4,0,0]}/>
                        <Bar dataKey="expenses" fill="#3b82f6" radius={[4,4,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="g-card p-5">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">توزيع المصاريف</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData.length?pieData:[{name:'لا يوجد',value:1}]} innerRadius={50} outerRadius={72} dataKey="value" paddingAngle={3}>
                          {(pieData.length?pieData:[{name:'لا',value:1}]).map((_,i)=><Cell key={i} fill={COLORS[i%6]}/>)}
                        </Pie>
                        <Tooltip contentStyle={{background:'#0a0a0a',border:'1px solid #222',borderRadius:'12px',fontSize:11}}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-2">
                      {pieData.slice(0,4).map((p,i)=>(
                        <div key={p.name} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{background:COLORS[i%6]}}/><span className="text-gray-400">{p.name}</span></div>
                          <span className="font-black">{fmt(p.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Forecast Alert */}
                {forecast.isBankruptcyRisk && (
                  <div className="g-card p-5 border-red-500/30 bg-red-500/5 rounded-2xl flex items-start gap-4">
                    <AlertTriangle className="text-red-400 mt-0.5 shrink-0" size={20}/>
                    <div>
                      <p className="font-black text-red-400 mb-1">تحذير: خطر نفاد السيولة</p>
                      <p className="text-xs text-gray-400">بناءً على متوسط صرفك اليومي، <span className="text-red-400 font-black">ستنفد السيولة خلال {forecast.daysUntilEmpty} يوم</span> (تقريباً {forecast.emptyDate}). يُنصح بتفعيل وضع الطوارئ.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== FINANCE ===== */}
            {tab==='finance' && (
              <motion.div key="fi" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} className="space-y-5">
                {/* Net Worth Breakdown */}
                <div className="g-card p-6">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-5">تفصيل صافي الثروة</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-2">الأصول</p>
                      <p className="text-3xl font-black">{fmt(netWorth.assetsTotal)}</p>
                      <p className="text-[9px] text-gray-600 mt-1">ج.م</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-2">الاستثمارات</p>
                      <p className="text-3xl font-black">{fmt(netWorth.investmentsTotal)}</p>
                      <p className="text-[9px] text-gray-600 mt-1">ج.م</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                      <p className="text-[9px] text-purple-500 font-black uppercase tracking-widest mb-2">دخل سلبي سنوي</p>
                      <p className="text-3xl font-black">{fmt(netWorth.passiveIncomeAnnual)}</p>
                      <p className="text-[9px] text-gray-600 mt-1">ج.م</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Assets */}
                  <div className="g-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest">الأصول</p>
                      <button onClick={()=>setModal('asset')} className="text-[10px] text-emerald-400 font-black">+ إضافة</button>
                    </div>
                    <div className="space-y-2">
                      {assets.length===0 && <p className="text-xs text-gray-700 text-center py-4">لا توجد أصول مسجلة</p>}
                      {assets.map((a,i)=>(
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                          <div><p className="text-sm font-black">{a.name}</p><p className="text-[9px] text-gray-600">{a.type} · {a.liquidType||'مادي'}</p></div>
                          <div className="text-right"><p className="font-black text-emerald-400">{fmt(a.value)}</p><p className="text-[9px] text-gray-600">{a.currency}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Investments */}
                  <div className="g-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest">الاستثمارات</p>
                      <button onClick={()=>setModal('investment')} className="text-[10px] text-blue-400 font-black">+ إضافة</button>
                    </div>
                    <div className="space-y-2">
                      {investments.length===0 && <p className="text-xs text-gray-700 text-center py-4">لا توجد استثمارات</p>}
                      {investments.map((inv,i)=>{
                        const roi = inv.roiPercentage||0;
                        return (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                            <div><p className="text-sm font-black">{inv.name}</p><p className="text-[9px] text-gray-600">{inv.platform}</p></div>
                            <div className="text-right">
                              <p className="font-black">{fmt(inv.currentValue)}</p>
                              <p className={`text-[9px] font-black ${roi>=0?'text-emerald-400':'text-red-400'}`}>{roi>=0?'+':''}{roi.toFixed(1)}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Transactions */}
                <div className="g-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">آخر المعاملات</p>
                    <button onClick={()=>setModal('transaction')} className="text-[10px] text-emerald-400 font-black">+ إضافة</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-[9px] text-gray-600 uppercase tracking-widest border-b border-white/5">
                        <th className="pb-2 text-right font-black">البيان</th><th className="pb-2 text-right font-black">الفئة</th><th className="pb-2 text-right font-black">المبلغ</th><th className="pb-2 text-right font-black">التاريخ</th>
                      </tr></thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {transactions.slice(0,10).map((t,i)=>(
                          <tr key={i} className="hover:bg-white/[0.02] transition-all">
                            <td className="py-3 font-semibold">{t.description}</td>
                            <td className="py-3 text-[10px] text-gray-500">{t.category}</td>
                            <td className="py-3 font-black text-red-400">- {fmt(t.amount)}</td>
                            <td className="py-3 text-[10px] text-gray-600">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                          </tr>
                        ))}
                        {transactions.length===0 && <tr><td colSpan={4} className="py-8 text-center text-xs text-gray-700">لا توجد معاملات</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Income + Passive */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="g-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest">الدخل</p>
                      <button onClick={()=>setModal('income')} className="text-[10px] text-blue-400 font-black">+ إضافة</button>
                    </div>
                    <div className="space-y-2">
                      {incomes.slice(0,6).map((inc,i)=>(
                        <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02]">
                          <div><p className="text-sm font-black">{inc.description}</p><p className="text-[9px] text-gray-600">{inc.source}</p></div>
                          <p className="font-black text-emerald-400">+ {fmt(inc.amount)}</p>
                        </div>
                      ))}
                      {incomes.length===0 && <p className="text-xs text-gray-700 text-center py-4">لا يوجد دخل مسجل</p>}
                    </div>
                  </div>
                  <div className="g-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest">مصادر الدخل السلبي</p>
                      <button onClick={()=>setModal('passive_income')} className="text-[10px] text-purple-400 font-black">+ إضافة</button>
                    </div>
                    <div className="space-y-2">
                      {passiveSources.map((s,i)=>(
                        <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02]">
                          <div><p className="text-sm font-black">{s.source}</p><p className="text-[9px] text-gray-600">{s.type}</p></div>
                          <p className="font-black text-purple-400">{fmt(s.monthlyAmount)}/شهر</p>
                        </div>
                      ))}
                      {passiveSources.length===0 && <p className="text-xs text-gray-700 text-center py-4">لا توجد مصادر سلبية</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== WALLETS ===== */}
            {tab==='wallets' && (
              <motion.div key="wa" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} className="space-y-5">
                <div className="g-card p-6">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">التوزيع التلقائي للدخل</p>
                  <p className="text-[10px] text-gray-600 mb-6">كل مبلغ دخل يُوزَّع فوراً على المحافظ حسب النسب التالية</p>
                  <div className="flex gap-2 mb-6">
                    {[
                      {id:'giving',label:'عطاء (لله)',pct:distPct.giving,color:'#10b981'},
                      {id:'obligations',label:'التزامات',pct:distPct.obligations,color:'#3b82f6'},
                      {id:'personal',label:'شخصي',pct:distPct.personal,color:'#f59e0b'},
                      {id:'investment',label:'استثمار',pct:distPct.investment,color:'#a855f7'},
                    ].map(w=>(
                      <div key={w.id} style={{width:`${w.pct}%`,background:w.color+'22',borderColor:w.color+'44'}} className="h-10 rounded-xl border flex items-center justify-center text-[9px] font-black text-white transition-all" title={w.label}>
                        {w.pct}%
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {id:'giving',label:'عطاء (لله)',pct:distPct.giving,color:'emerald'},
                      {id:'obligations',label:'التزامات',pct:distPct.obligations,color:'blue'},
                      {id:'personal',label:'شخصي',pct:distPct.personal,color:'amber'},
                      {id:'investment',label:'استثمار',pct:distPct.investment,color:'purple'},
                    ].map(w=>{
                      const wallet = wallets.find((wl:any)=>wl.id===w.id);
                      return (
                        <div key={w.id} className={`g-card p-5 rounded-2xl border-${w.color}-500/10 bg-${w.color}-500/[0.03]`}>
                          <p className={`text-[9px] font-black text-${w.color}-500 uppercase tracking-widest mb-1`}>{w.label}</p>
                          <p className="text-[10px] text-gray-600 mb-3">{w.pct}% من كل دخل</p>
                          <p className="text-2xl font-black">{fmt(wallet?.balance||0)}</p>
                          <p className="text-[9px] text-gray-600 mt-1">ج.م مُراكَم</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Work Hours */}
                <div className="g-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">تتبع ساعات العمل</p>
                      <p className="text-[10px] text-gray-600">تحكم يدوي في ساعات عملك لحساب سعر ساعتك بدقة</p>
                    </div>
                    <button onClick={()=>setModal('hours')} className="px-4 py-2 text-xs font-black rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">+ تسجيل</button>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 mb-4 flex items-center gap-4">
                    <Clock className="text-orange-400 shrink-0" size={24}/>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">سعر ساعتك الحالي</p>
                      <p className="text-3xl font-black text-orange-400">{fmt(hourlyRate)} <span className="text-sm text-gray-600 font-normal">ج.م / ساعة</span></p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {workTracking.slice(0,7).map((w,i)=>(
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] text-sm">
                        <span className="text-gray-400">{w.date}</span>
                        <span className="font-black text-orange-400">{w.hoursWorked} ساعة</span>
                      </div>
                    ))}
                    {workTracking.length===0 && <p className="text-xs text-gray-700 text-center py-4">لا توجد ساعات مسجلة بعد</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== WISHLIST ===== */}
            {tab==='wishlist' && (
              <motion.div key="wl" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black">قائمة الأمنيات</h2>
                    <p className="text-xs text-gray-600 mt-1">كل منتج يُحسب بقيمة وقتك من حياتك</p>
                  </div>
                  <button onClick={()=>setModal('wishlist')} className="px-5 py-2.5 text-xs font-black rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">+ إضافة</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlist.map((w,i)=>{
                    const hours = w.hoursCost||0;
                    return (
                      <div key={i} className={`g-card p-5 rounded-2xl ${w.isPurchased?'opacity-50':''}`}>
                        <div className="flex items-start justify-between mb-3">
                          <p className="font-black text-base">{w.name}</p>
                          <div className={`text-[9px] px-2 py-1 rounded-lg font-black ${w.priority===1?'bg-red-500/10 text-red-400':w.priority===2?'bg-amber-500/10 text-amber-400':'bg-gray-500/10 text-gray-400'}`}>
                            {w.priority===1?'عالي':w.priority===2?'متوسط':'منخفض'}
                          </div>
                        </div>
                        <p className="text-2xl font-black text-emerald-400 mb-2">{fmt(w.price)} {w.currency}</p>
                        <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-2">
                          <Clock className="text-orange-400 shrink-0" size={14}/>
                          <p className="text-[10px] text-orange-300/80">
                            {hours>0?`هذا المنتج سيكلفك ${hours.toFixed(1)} ساعة من حياتك`:'احسب تكلفة الوقت بتسجيل دخلك'}
                          </p>
                        </div>
                        {w.link && <a href={w.link} target="_blank" className="text-[10px] text-blue-400 mt-2 flex items-center gap-1"><ExternalLink size={10}/>رابط المنتج</a>}
                      </div>
                    );
                  })}
                  {wishlist.length===0 && (
                    <div className="col-span-2 g-card p-10 rounded-2xl text-center">
                      <Target className="mx-auto mb-3 text-gray-700" size={40}/>
                      <p className="text-sm text-gray-600">قائمتك فارغة. أضف أشياء تريد شراءها وستعرف قيمتها بساعات حياتك.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ===== SETTINGS ===== */}
            {tab==='settings' && (
              <motion.div key="se" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} className="space-y-5 max-w-2xl">
                {/* Notion */}
                <div className="g-card p-6">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><ExternalLink size={12}/> تكامل Notion</p>
                  <div className="flex gap-3">
                    <input type="url" placeholder="https://notion.so/..." className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" value={notionUrl} onChange={e=>setNotionUrl(e.target.value)}/>
                    <button onClick={()=>post('setting',{key:'notion_url',value:notionUrl})} className="px-5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-sm flex items-center gap-2 transition-all"><Save size={16}/> حفظ</button>
                  </div>
                </div>

                {/* Currency + Panic */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="g-card p-5">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-3">سعر الدولار</p>
                    <div className="flex items-center gap-2">
                      <input type="number" className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 font-black text-xl" defaultValue={settings.usdRate} onBlur={e=>post('setting',{key:'usd_rate',value:e.target.value})}/>
                      <span className="text-xs text-emerald-500 font-black">ج.م</span>
                    </div>
                  </div>
                  <div className="g-card p-5 flex flex-col justify-between">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-3">وضع الطوارئ</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{panic?'مفعّل - الصرف محدود':'غير مفعّل'}</p>
                      <button onClick={()=>{setPanic(!panic);post('setting',{key:'is_panic',value:!panic?'1':'0'});}} className={`w-14 h-7 rounded-full relative transition-all ${panic?'bg-red-600':'bg-gray-800'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${panic?'right-1':'left-1'}`}/>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Work Settings */}
                <div className="g-card p-5">
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-4">إعدادات ساعات العمل الافتراضية</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-gray-600 mb-2">ساعات/يوم</p>
                      <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-black" defaultValue={8} onBlur={e=>post('setting',{key:'work_hours_per_day',value:e.target.value})}/>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-600 mb-2">أيام عمل/شهر</p>
                      <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-black" defaultValue={22} onBlur={e=>post('setting',{key:'work_days_per_month',value:e.target.value})}/>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ===== MODALS ===== */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{scale:0.85,opacity:0,y:30}} animate={{scale:1,opacity:0.99,y:0}} exit={{scale:0.85,opacity:0,y:30}} className="w-full max-w-md bg-[#080808] border border-white/10 rounded-[2rem] p-8 shadow-[0_0_80px_rgba(16,185,129,0.08)] relative">
              <button onClick={()=>setModal(null)} className="absolute top-5 right-5 p-2 hover:bg-white/5 rounded-xl transition-all"><X size={18}/></button>
              
              <h3 className="text-xl font-black mb-6">
                {{transaction:'إضافة مصرف',asset:'إضافة أصل',income:'تسجيل دخل',investment:'إضافة استثمار',passive_income:'إضافة مصدر دخل سلبي',hours:'تسجيل ساعات عمل',wishlist:'إضافة لقائمة الأمنيات'}[modal]||'إضافة'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount */}
                {!['hours','wishlist'].includes(modal) && (
                  <div>
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5">{modal==='investment'?'القيمة الأولية':modal==='passive_income'?'المبلغ الشهري':'المبلغ'}</label>
                    <input required type="number" step="0.01" autoFocus className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-2xl font-black text-center" value={modal==='investment'?form.initialValue:form.amount} onChange={e=>setForm({...form,[modal==='investment'?'initialValue':'amount']:e.target.value})}/>
                  </div>
                )}

                {/* Investment current value */}
                {modal==='investment' && (
                  <div>
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5">القيمة الحالية</label>
                    <input required type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-black" value={form.currentValue} onChange={e=>setForm({...form,currentValue:e.target.value})}/>
                  </div>
                )}

                {/* Name field */}
                {['asset','investment','passive_income','wishlist'].includes(modal) && (
                  <div>
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5">الاسم</label>
                    <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-bold" value={form.name||form.source} onChange={e=>setForm({...form,[modal==='passive_income'?'source':'name']:e.target.value})}/>
                  </div>
                )}

                {/* Wishlist price */}
                {modal==='wishlist' && (
                  <div>
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5">السعر</label>
                    <input required type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-black" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
                  </div>
                )}

                {/* Hours input */}
                {modal==='hours' && (
                  <>
                    <div>
                      <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5">التاريخ</label>
                      <input type="date" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-bold" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5">عدد الساعات</label>
                      <input required type="number" step="0.5" autoFocus className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-2xl font-black text-center" value={form.hours} onChange={e=>setForm({...form,hours:e.target.value})} placeholder="8"/>
                    </div>
                  </>
                )}

                {/* Description */}
                {['transaction','income'].includes(modal) && (
                  <div>
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5">البيان</label>
                    <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-bold" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                  </div>
                )}

                {/* Platform for investment */}
                {modal==='investment' && (
                  <div>
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5">المنصة</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-bold" value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})} placeholder="مثال: Binance, البورصة المصرية..."/>
                  </div>
                )}

                {/* Currency */}
                {!['hours'].includes(modal) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5">العملة</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-black" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>
                        <option value="EGP">EGP - جنيه</option>
                        <option value="USD">USD - دولار</option>
                      </select>
                    </div>
                    {modal==='transaction' && (
                      <div>
                        <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5">الفئة</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-black" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                          {['شخصي','طعام','سكن','مواصلات','ترفيه','صحة','استثمار','تعليم','أخرى'].map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                    )}
                    {modal==='asset' && (
                      <div>
                        <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5">النوع</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-black" value={form.liquidType} onChange={e=>setForm({...form,liquidType:e.target.value})}>
                          <option value="سائل">سائل (كاش/بنك)</option>
                          <option value="مادي">مادي (ذهب/معدات)</option>
                          <option value="رقمي">رقمي (كريبتو)</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={saving} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 mt-2">
                  {saving?<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Check size={18}/>}
                  {saving?'جارِ الحفظ...':'حفظ'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
