"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Activity, CreditCard, LayoutDashboard, Target, Calendar, 
  CheckCircle2, Circle, TrendingUp, Wallet, Zap, Shield,
  Menu, X, Settings, LogOut, ChevronLeft, Bell, Search,
  PieChart, Briefcase
} from 'lucide-react';

interface DashboardProps {
  finances: { id: number; name: string; amount: number; date: string; category: string }[];
  tasks: { id: number; name: string; status: string; dueDate: string | null }[];
}

export default function DashboardClient({ finances, tasks }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Process data for charts
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    finances.forEach(f => {
      const date = new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + f.amount;
    });
    return Object.keys(grouped).map(k => ({ name: k, amount: grouped[k] })).reverse();
  }, [finances]);

  const totalSpent = useMemo(() => finances.reduce((acc, f) => acc + f.amount, 0), [finances]);

  const sidebarItems = [
    { name: 'Overview', icon: <LayoutDashboard size={20} />, label: 'نظرة عامة' },
    { name: 'Finance', icon: <Wallet size={20} />, label: 'المالية' },
    { name: 'Tasks', icon: <Target size={20} />, label: 'المهام' },
    { name: 'Assets', icon: <Briefcase size={20} />, label: 'الأصول' },
    { name: 'Analytics', icon: <PieChart size={20} />, label: 'التحليلات' },
  ];

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans text-white selection:bg-blue-500/30" dir="rtl">
      {/* Dynamic Glow Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-500/5 blur-[120px]" />
      </div>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="relative z-50 h-full glass-card border-l border-white/[0.05] flex flex-col p-6 m-4 ml-0 rounded-[2.5rem]"
          >
            <div className="flex items-center gap-3 mb-12 px-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">MARK <span className="text-blue-500">OS</span></h2>
                <p className="text-[10px] uppercase font-black text-white/30 tracking-widest">Personal Ecosystem</p>
              </div>
            </div>

            <nav className="flex-1 space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                    activeTab === item.name 
                    ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
                    : 'text-gray-400 hover:bg-white/[0.03] hover:text-white'
                  }`}
                >
                  <span className="relative z-10">{item.icon}</span>
                  <span className="font-bold relative z-10">{item.label}</span>
                  {activeTab === item.name && (
                    <motion.div layoutId="nav-bg" className="absolute inset-0 bg-blue-600 rounded-2xl -z-1" />
                  )}
                </button>
              ))}
            </nav>

            <div className="pt-6 border-t border-white/5 space-y-2">
              <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-400 hover:bg-white/[0.03] transition-all">
                <Settings size={20} />
                <span className="font-bold text-sm">الإعدادات</span>
              </button>
              <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400/70 hover:bg-red-500/10 transition-all">
                <LogOut size={20} />
                <span className="font-bold text-sm">تسجيل الخروج</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar">
        {/* Top Floating Header */}
        <header className="flex items-center justify-between mb-10 pb-6 border-b border-white/[0.05]">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden md:flex items-center gap-3 bg-white/[0.03] px-5 py-3 rounded-2xl border border-white/5">
              <Search size={18} className="text-gray-500" />
              <input 
                type="text" 
                placeholder="ابحث عن أي شيء..." 
                className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-gray-600 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-2xl">
              <Zap size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-black text-yellow-500 uppercase tracking-tighter">System Balanced</span>
            </div>
            <button className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 relative group">
              <Bell size={20} className="text-gray-400 group-hover:text-white transition-colors" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full border-2 border-black" />
            </button>
          </div>
        </header>

        {/* Dynamic Section Content */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* Hero Row / Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="إجمالي المصروفات" 
              value={`$${totalSpent.toLocaleString()}`} 
              trend="+12% المتوقع" 
              icon={<CreditCard className="text-blue-400" />}
              color="blue"
            />
            <StatCard 
              title="المهام المنجزة" 
              value={`${tasks.filter(t => t.status === 'Done').length}/${tasks.length}`}
              trend="تحت السيطرة" 
              icon={<CheckCircle2 className="text-yellow-400" />}
              color="yellow"
            />
            <StatCard 
              title="الأصول الرقمية" 
              value="12" 
              trend="مؤرشفة بكفاءة" 
              icon={<Shield className="text-emerald-400" />}
              color="emerald"
            />
            <StatCard 
              title="وقت التشغيل" 
              value="99.9%" 
              trend="اتصال مستقر" 
              icon={<Activity className="text-purple-400" />}
              color="purple"
            />
          </div>

          {/* Core Analytics Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            {/* Chart Container */}
            <div className="xl:col-span-2 glass-card p-8 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-blue-500/20" />
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black flex items-center gap-3">
                    <TrendingUp className="text-blue-500" />
                    التحليل المالي الذكي
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">تتبع التدفقات من محرك SQLite الداخلي</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl">
                  <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white/10">الأخير</button>
                  <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-500">الكل</button>
                </div>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gradientAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', padding: '15px' }}
                      itemStyle={{ color: '#3b82f6', fontWeight: '800' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={4} fill="url(#gradientAmount)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Task Stream Container */}
            <div className="glass-card p-8 rounded-[2.5rem] flex flex-col">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <h3 className="text-2xl font-black">المهمات</h3>
                <span className="text-[10px] font-black uppercase text-blue-500/70 border border-blue-500/20 px-3 py-1 rounded-full">{tasks.length} Total</span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-30">
                    <Circle className="w-12 h-12 mb-4" />
                    <p className="text-sm">لا يوجد مهام</p>
                  </div>
                ) : (
                  tasks.map((task, idx) => (
                    <motion.div 
                      key={task.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-all group group-hover:border-blue-500/20"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {task.status === 'Done' ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5 text-gray-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold truncate leading-tight">{task.name}</h4>
                          <span className="text-[10px] uppercase font-black text-white/20 mt-2 block tracking-widest">{task.status}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function StatCard({ title, value, trend, icon, color }: { title: string, value: string, trend: string, icon: React.ReactNode, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-7 rounded-[2.5rem] relative overflow-hidden group border border-white/5 hover:border-white/10"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 blur-3xl -mr-12 -mt-12 transition-all group-hover:bg-${color}-500/10`} />
      <div className="flex items-center justify-between mb-6">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
          {icon}
        </div>
        <ChevronLeft size={16} className="text-white/20 group-hover:text-white transition-colors" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black tracking-tight">{value}</h3>
        <p className={`text-[11px] font-black mt-3 text-${color}-400/80 flex items-center gap-1`}>
          <TrendingUp size={12} />
          {trend}
        </p>
      </div>
    </motion.div>
  );
}
