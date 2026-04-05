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
  ArrowUpRight, ArrowDownRight, Gem
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
              <p className="text-xs text-gray-500 mt-1">حالة السيرفر: <span className="text-green-500 font-bold">مستقر (v4.0)</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4">
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

        {/* Real-time Financial Engine Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          {/* Main Net Worth Card */}
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
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">بالدولار (USD)</p>
                  <p className="text-xl font-black">${netWorth.totalUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">دخل سلبي (Passive)</p>
                  <p className="text-xl font-black text-green-500">+{netWorth.passiveIncome.toLocaleString()} ج</p>
                </div>
              </div>
            </div>
          </div>

          {/* Forecasting & Risk Card */}
          <div className="glass-card p-8 rounded-[3rem] flex flex-col justify-between border-l-4 border-l-yellow-500/50">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-400 text-sm">توقعات الإفلاس (Forecasting)</h3>
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
              <span className="text-xs font-black">{forecast.isBankruptcyRisk ? 'تحذير: سيولة حرجة!' : 'السيولة في أمان'}</span>
            </div>
          </div>

          {/* Hourly Rate Tool */}
          <div className="glass-card p-8 rounded-[3rem] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-400 text-sm">تثمين الوقت</h3>
              <Clock size={20} className="text-purple-500" />
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-500">سعر ساعتك الحقيقي</p>
                <p className="text-2xl font-black text-purple-400">{hourlyRate.toFixed(0)} ج</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-500">كست الاستثمار اليومي</p>
                <p className="text-2xl font-black text-blue-400">60%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assets & Visual Analytics */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 mb-12">
          {/* Assets Grid */}
          <div className="xl:col-span-2 space-y-6">
            <h3 className="text-2xl font-black flex items-center gap-4">
              <Briefcase className="text-blue-500" />
              توزيع الأصول (Assets)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset, idx) => (
                <div key={idx} className="glass-card p-6 rounded-[2rem] hover:translate-y-[-5px] transition-all border-b border-b-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/5 rounded-xl text-blue-500">
                      {asset.type === 'Gold' ? <Gem size={20} /> : asset.type === 'Crypto' ? <TrendingUp size={20} /> : <Wallet size={20} />}
                    </div>
                    <span className="text-[9px] font-black p-1.5 bg-white/5 rounded-lg text-gray-500 uppercase">{asset.type}</span>
                  </div>
                  <h4 className="text-lg font-black mb-1">{asset.name}</h4>
                  <p className="text-2xl font-black tabular-nums">{asset.value.toLocaleString()} <span className="text-xs text-gray-500">{asset.currency}</span></p>
                  {asset.roi > 0 && <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-2">
                    <ArrowUpRight size={12} /> ROI: %{asset.roi}
                  </span>}
                </div>
              ))}
            </div>
          </div>

          {/* Spending Pie Chart */}
          <div className="glass-card p-10 rounded-[3rem] flex flex-col items-center">
            <h3 className="text-xl font-black mb-8 self-start">تحليل المصروفات</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mt-6">
              {categoryData.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs font-bold text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions & Wishlist */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* Recent Ledger */}
          <div className="xl:col-span-8 glass-card rounded-[3rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-2xl font-black">سجل المعاملات الذكي</h3>
              <span className="px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-full font-black text-xs">آخر 50 عملية</span>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-gray-500 text-[11px] uppercase font-black tracking-widest border-b border-white/5">
                    <th className="pb-6 px-4">التاريخ</th>
                    <th className="pb-6 px-4">الفئة</th>
                    <th className="pb-6 px-4">الوصف</th>
                    <th className="pb-6 px-4">وسيلة الدفع</th>
                    <th className="pb-6 px-4">الحالة</th>
                    <th className="pb-6 px-4">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-6 px-4 text-xs font-medium text-gray-500">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                      <td className="py-6 px-4">
                        <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-black">{t.category}</span>
                      </td>
                      <td className="py-6 px-4 font-bold text-sm">{t.description}</td>
                      <td className="py-6 px-4 text-xs text-gray-400">{t.method}</td>
                      <td className="py-6 px-4">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black ${
                          t.status === 'تم الصرف' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-6 px-4 font-black">
                        <span className={t.currency === 'USD' ? 'text-blue-500' : ''}>
                          {t.amount.toLocaleString()} {t.currency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic Wishlist (Hours of Life) */}
          <div className="xl:col-span-4 glass-card p-10 rounded-[3rem] bg-gradient-to-br from-white/[0.02] to-transparent">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
              <Flame className="text-orange-500" />
              قائمة الأمنيات (Wishlist)
            </h3>
            <div className="space-y-6">
              {wishlist.map((item, idx) => {
                const costInHours = (item.price / hourlyRate).toFixed(1);
                return (
                  <div key={idx} className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 relative group hover:border-orange-500/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-black text-lg">{item.name}</h4>
                      <Gem size={18} className="text-gray-600 group-hover:text-orange-500" />
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-black">{item.price.toLocaleString()}</span>
                      <span className="text-xs text-gray-600">ج.م</span>
                    </div>
                    <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-500">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} />
                        <span className="text-[10px] font-black uppercase">تكلفة الحياة (Hours of Life)</span>
                      </div>
                      <p className="text-base font-black">سيكلفك {costInHours} ساعة من عمرك</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
