"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  Activity, CreditCard, LayoutDashboard, Target, Calendar, 
  CheckCircle2, Circle, TrendingUp, Wallet, Zap, Shield,
  Menu, X, Settings, LogOut, ChevronLeft, Bell, Search,
  Briefcase, DollarSign, Clock, AlertTriangle, Flame, 
  ArrowUpRight, ArrowDownRight, Gem, Plus
} from 'lucide-react';

interface Financials {
  transactions: any[];
  assets: any[];
  incomes: any[];
  wishlist: any[];
  netWorth: { totalEGP: number; totalUSD: number; passiveIncome: number };
  forecast: { avgDailySpent: number; projectedEndMonthSpent: number; isBankruptcyRisk: boolean };
  hourlyRate: number;
  settings: { usdRate: number; isPanic: boolean };
}

export default function DashboardClient({ 
  transactions, 
  assets, 
  incomes, 
  wishlist, 
  netWorth, 
  forecast, 
  hourlyRate,
  settings 
}: Financials) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [panicMode, setPanicMode] = useState(settings.isPanic);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'Transaction' | 'Asset' | null>(null);

  // --- UI THEME HELPERS ---
  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#ef4444'];

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    transactions.forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    return Object.keys(grouped).map(k => ({ name: k, value: grouped[k] }));
  }, [transactions]);

  const sidebarItems = [
    { name: 'Overview', icon: <LayoutDashboard size={20} />, label: 'مركز القيادة' },
    { name: 'Finance', icon: <Wallet size={20} />, label: 'إدارة الثروة' },
    { name: 'Assets', icon: <Briefcase size={20} />, label: 'الأصول والاستثمار' },
    { name: 'Tasks', icon: <Target size={20} />, label: 'المهام الذكية' },
    { name: 'Settings', icon: <Settings size={20} />, label: 'الإعدادات' },
  ];

  return (
    <div className={`flex h-screen bg-black overflow-hidden font-sans text-white transition-all duration-700 ${panicMode ? 'selection:bg-red-500/30' : 'selection:bg-blue-500/30'}`} dir="rtl">
      {/* Panic Mode Visual Overlay */}
      <AnimatePresence>
        {panicMode && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 border-[10px] border-red-500/20 animate-pulse"
          />
        )}
      </AnimatePresence>

      {/* Dynamic Glow Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute top-0 right-0 w-[600px] h-[600px] blur-[150px] transition-colors duration-1000 ${panicMode ? 'bg-red-500/10' : 'bg-blue-500/10'}`} />
        <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] blur-[150px] transition-colors duration-1000 ${panicMode ? 'bg-orange-500/5' : 'bg-yellow-500/5'}`} />
      </div>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="relative z-50 h-full glass-card border-l border-white/5 flex flex-col p-8 m-4 ml-0 rounded-[3rem]"
          >
            <div className="flex items-center gap-4 mb-14 px-2">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${panicMode ? 'bg-red-600 shadow-red-500/50' : 'bg-blue-600 shadow-blue-500/50'}`}>
                {panicMode ? <AlertTriangle className="text-white" size={26} /> : <Shield className="text-white" size={26} />}
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter">MARK <span className={panicMode ? 'text-red-500' : 'text-blue-500'}>OS</span></h2>
                <p className="text-[9px] uppercase font-black text-white/30 tracking-[3px]">Command Center v4</p>
              </div>
            </div>

            <nav className="flex-1 space-y-3">
              {sidebarItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full group relative flex items-center gap-5 px-5 py-4 rounded-2xl transition-all duration-300 ${
                    activeTab === item.name 
                    ? (panicMode ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30') 
                    : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <span className="relative z-10">{item.icon}</span>
                  <span className="font-black text-sm relative z-10">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className={`mt-auto p-6 rounded-3xl border transition-all ${panicMode ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase text-gray-400">سعر الساعة</span>
                <span className="text-xs font-black text-white">{hourlyRate.toFixed(0)} ج</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className={`h-full ${panicMode ? 'bg-red-500' : 'bg-blue-500'}`} />
              </div>
              <p className="text-[9px] text-gray-500 mt-3 leading-relaxed">قيمة وقتك الحالية محسوبة بناءً على صافي الربح الشهري.</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto p-6 md:p-10 relative z-10 custom-scrollbar">
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between mb-12 gap-6 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">أهلاً، <span className="text-blue-500">مارك</span></h1>
              <p className="text-xs text-gray-500 mt-1">حالة السيرفر: <span className="text-green-500 font-bold">مستقر (v4.6)</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setModalType('Transaction'); setAddModalOpen(true); }}
                className="hidden sm:flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-xs transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus size={14} /> إضافة معاملة
              </button>
              <button 
                onClick={() => { setModalType('Asset'); setAddModalOpen(true); }}
                className="hidden sm:flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-xs transition-all"
              >
                <Briefcase size={14} /> إضافة أصل
              </button>
            </div>
            <div className="hidden lg:flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
              <DollarSign size={16} className="text-green-500" />
              <span className="text-xs font-black text-gray-400">سعر الصرف الداخلي:</span>
              <span className="text-sm font-black text-white">{settings.usdRate} ج</span>
            </div>
            
            <button 
              onClick={() => setPanicMode(!panicMode)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs transition-all border ${
                panicMode 
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-bounce' 
                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
              }`}
            >
              <Flame size={16} />
              {panicMode ? 'وضع الطوارئ نشط' : 'وضع الطوارئ'}
            </button>
          </div>
        </header>

        {/* Main Content Render based on Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'Overview' ? (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Summary Grid (Net Worth, Forex, Rate) - SAME AS BEFORE, keep it tight */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-80 h-80 blur-[120px] -mr-40 -mt-40 transition-colors ${panicMode ? 'bg-red-500/20' : 'bg-blue-600/20'}`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-500 uppercase tracking-widest">إجمالي الثروة (Net Worth)</span>
                      <Gem size={24} className="text-blue-500" />
                    </div>
                    <div className="flex items-baseline gap-4 mb-2">
                      <h2 className="text-6xl font-black tracking-tighter tabular-nums">
                        {netWorth.totalEGP.toLocaleString()} <span className="text-2xl text-blue-500/50">ج.م</span>
                      </h2>
                    </div>
                    <div className="flex gap-10 mt-8 pt-8 border-t border-white/5">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">بالدولار (USD)</p>
                        <p className="text-xl font-black">${netWorth.totalUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">دخل سلبي (Passive)</p>
                        <p className="text-xl font-black text-green-500">+{netWorth.passiveIncome.toLocaleString()} ج</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="glass-card p-8 rounded-[3rem] flex flex-col justify-between border-l-4 border-l-yellow-500/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-gray-400 text-sm">توقعات الصرف</h3>
                    <Activity size={20} className="text-yellow-500" />
                  </div>
                  <div className="py-6">
                    <p className="text-[10px] text-gray-500 mb-2">تقدير المصاريف لآخر الشهر</p>
                    <h4 className={`text-3xl font-black ${forecast.isBankruptcyRisk ? 'text-red-500' : 'text-white'}`}>
                      {forecast.projectedEndMonthSpent.toLocaleString()} ج
                    </h4>
                  </div>
                  <div className={`p-4 rounded-2xl flex items-center gap-3 ${forecast.isBankruptcyRisk ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                    {forecast.isBankruptcyRisk ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    <span className="text-xs font-black">{forecast.isBankruptcyRisk ? 'وضع السيولة: حرج' : 'السيولة في أمان'}</span>
                  </div>
                </div>
                <div className="glass-card p-8 rounded-[3rem] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-gray-400 text-sm">تثمين الوقت</h3>
                    <Clock size={20} className="text-purple-500" />
                  </div>
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500">سعر الساعة</p>
                    <p className="text-2xl font-black text-purple-400">{hourlyRate.toFixed(0)} ج</p>
                  </div>
                </div>
              </div>

              {/* Assets Brief Grid */}
              <div>
                 <h3 className="text-2xl font-black mb-8 flex items-center gap-4">توزيع الأصول الذكي</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {assets.slice(0, 3).map((asset, idx) => (
                      <div key={idx} className="glass-card p-6 rounded-[2rem] border-b border-white/5">
                        <p className="text-[10px] font-black text-gray-500 uppercase mb-4">{asset.type}</p>
                        <h4 className="text-lg font-black mb-1">{asset.name}</h4>
                        <p className="text-2xl font-black tabular-nums">{asset.value.toLocaleString()} <span className="text-xs text-gray-500">{asset.currency}</span></p>
                      </div>
                   ))}
                 </div>
              </div>
            </motion.div>
          ) : activeTab === 'Finance' ? (
            <motion.div 
               key="finance"
               initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
               className="space-y-10"
            >
               <h2 className="text-4xl font-black tracking-tighter">إدارة الثروة والمعاملات</h2>
               <div className="glass-card rounded-[3rem] overflow-hidden border border-white/5">
                  <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <h3 className="text-xl font-black">سجل المعاملات بالكامل</h3>
                    <button className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-black border border-blue-500/20">تصفية النتائج</button>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-right text-sm">
                        <thead className="text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5 bg-white/[0.01]">
                          <tr><th className="p-6">التاريخ</th><th className="p-6">الفئة</th><th className="p-6">الوصف</th><th className="p-6">المبلغ</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {transactions.map((t, idx) => (
                             <tr key={idx} className="hover:bg-white/[0.02]">
                               <td className="p-6 text-gray-500">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                               <td className="p-6"><span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-black">{t.category}</span></td>
                               <td className="p-6 font-bold">{t.description}</td>
                               <td className="p-6 font-black">{t.amount.toLocaleString()} {t.currency}</td>
                             </tr>
                          ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </motion.div>
          ) : activeTab === 'Assets' ? (
            <motion.div 
               key="assets"
               initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
               className="space-y-10"
            >
               <h2 className="text-4xl font-black tracking-tighter">المحفظة الاستثمارية والأصول</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {assets.map((asset, idx) => (
                   <div key={idx} className="glass-card p-10 rounded-[3rem] relative overflow-hidden group border border-white/5">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl group-hover:bg-blue-500/20 transition-all" />
                      <span className="text-[10px] font-black text-gray-500 uppercase mb-6 block">{asset.type}</span>
                      <h4 className="text-2xl font-black mb-2">{asset.name}</h4>
                      <div className="flex items-baseline gap-2 mb-8">
                        <p className="text-4xl font-black tabular-nums">{asset.value.toLocaleString()}</p>
                        <span className="text-sm text-blue-500/50 font-black">{asset.currency}</span>
                      </div>
                      <div className="border-t border-white/5 pt-6 flex justify-between items-center">
                        <span className="text-[10px] text-gray-500">العائد (ROI)</span>
                        <span className="text-green-500 font-black">%{asset.roi}</span>
                      </div>
                   </div>
                 ))}
               </div>
            </motion.div>
          ) : activeTab === 'Tasks' ? (
            <motion.div 
               key="tasks"
               initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
               className="space-y-10"
            >
               <h2 className="text-4xl font-black tracking-tighter">قائمة الأمنيات والمهام الذكية</h2>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {wishlist.map((item, idx) => {
                   const costInHours = (item.price / hourlyRate).toFixed(1);
                   return (
                     <div key={idx} className="glass-card p-8 rounded-[3rem] flex items-center justify-between border border-white/5 group hover:border-orange-500/30 transition-all">
                        <div className="space-y-2">
                           <h4 className="text-2xl font-black">{item.name}</h4>
                           <div className="flex items-center gap-3">
                              <span className="text-lg font-black text-orange-500">{item.price.toLocaleString()} ج</span>
                              <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-gray-500">الأولوية: {item.priority}</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-500">
                             <p className="text-[9px] font-black uppercase mb-1">تكلفة الحياة</p>
                             <p className="text-xl font-black">{costInHours} ساعة</p>
                           </div>
                        </div>
                     </div>
                   );
                 })}
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center h-[60vh] glass-card rounded-[3rem] p-20 text-center"
            >
              <Settings className="w-16 h-16 text-blue-500 mb-6 animate-spin-slow" />
              <h2 className="text-3xl font-black mb-4">إعدادات النظام (OS Settings)</h2>
              <p className="text-gray-500 max-w-sm">جاري مكاملة لوحة التحكم الإدارية لتعديل سعر الصرف والتحكم في الهوية بصلاحيات كاملة.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- QUICK ACTION MODALS --- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-lg glass-card p-10 rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.1)]"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-black tracking-tighter">
                  {modalType === 'Transaction' ? 'إضافة معاملة جديدة' : 'إضافة أصل جديد'}
                </h3>
                <button onClick={() => setAddModalOpen(false)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                  <X size={20} />
                </button>
              </div>

              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); /* API logic later */ }}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-2">المبلغ (Amount)</label>
                  <input type="number" step="0.01" className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-xl font-black text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700" placeholder="00.00" autoFocus />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2">العملة</label>
                    <select className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-black text-white focus:border-blue-500/50 outline-none transition-all cursor-pointer appearance-none">
                      <option>EGP</option>
                      <option>USD</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2">الفئة</label>
                    <select className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-black text-white focus:border-blue-500/50 outline-none transition-all cursor-pointer appearance-none">
                      {modalType === 'Transaction' ? (
                        <>
                          <option>التزامات</option>
                          <option>شخصي</option>
                          <option>استثمار</option>
                          <option>لله (بركة)</option>
                        </>
                      ) : (
                        <>
                          <option>ذهب</option>
                          <option>بنك</option>
                          <option>كاش</option>
                          <option>كريبتو</option>
                          <option>معدات</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-2">الوصف</label>
                  <input type="text" className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500/50 outline-none transition-all" placeholder="اكتب تفاصيل هنا..." />
                </div>

                <button type="submit" className="w-full p-6 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black text-lg transition-all shadow-xl shadow-blue-500/20 mt-4">
                  حفظ البيانات
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
