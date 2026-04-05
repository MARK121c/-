"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Activity, CreditCard, LayoutDashboard, Target, Calendar, 
  CheckCircle2, Circle, TrendingUp, Wallet, Zap, Shield
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardProps {
  finances: { id: number; name: string; amount: number; date: string; category: string }[];
  tasks: { id: number; name: string; status: string; dueDate: string | null }[];
}

export default function DashboardClient({ finances, tasks }: DashboardProps) {
  // Process finances for charts
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    finances.forEach(f => {
      const date = new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + f.amount;
    });
    return Object.keys(grouped).map(k => ({ name: k, amount: grouped[k] })).reverse();
  }, [finances]);

  const totalSpent = useMemo(() => finances.reduce((acc, f) => acc + f.amount, 0), [finances]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 260, damping: 20 } 
    }
  } as const;

  return (
    <div className="min-h-screen bg-black text-foreground md:p-8 p-4 overflow-x-hidden selection:bg-primary/30" dir="rtl">
      {/* Dynamic Background Noise/Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      <motion.div 
        className="max-w-7xl mx-auto space-y-10 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header Section */}
        <motion.header variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-white/[0.05]">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <Shield className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white">
                Personal <span className="text-gradient">OS</span>
              </h1>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 font-medium">
              <Zap className="w-4 h-4 text-secondary fill-secondary" />
              <span className="opacity-70">مركز القيادة والتحكم الرقمي</span>
              <span className="h-1 w-1 rounded-full bg-white/20 mx-2"></span>
              <span className="text-primary/80 font-bold">V 2.0 (Stable)</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/[0.02] p-2 rounded-2xl border border-white/[0.03]">
            <div className="flex -space-x-2 mr-2">
              <div className="w-8 h-8 rounded-full border border-black bg-gradient-to-tr from-primary to-blue-400"></div>
              <div className="w-8 h-8 rounded-full border border-black bg-gradient-to-tr from-secondary to-yellow-300"></div>
            </div>
            <div className="text-sm font-bold text-white/90 ml-2">MARK Dashboard</div>
          </div>
        </motion.header>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            title="إجمالي النفقات" 
            value={`$${totalSpent.toLocaleString()}`} 
            icon={<Wallet className="w-6 h-6" />}
            trend="+12% المتوقع"
            color="primary"
          />
          <StatCard 
            title="المهام المنجزة" 
            value={`${tasks.filter(t => t.status === 'Done').length}/${tasks.length}`} 
            icon={<CheckCircle2 className="w-6 h-6" />}
            trend="تحت السيطرة"
            color="secondary"
          />
          <StatCard 
            title="الحالة اللحظية" 
            value="Active" 
            icon={<Zap className="w-6 h-6" />}
            trend="جميع الأنظمة تعمل"
            color="blue"
          />
          <StatCard 
            title="الإشعارات" 
            value="0" 
            icon={<Shield className="w-6 h-6" />}
            trend="لا يوجد تهديدات"
            color="gray"
          />
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Finance Analytics Section */}
          <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-8 rounded-[2rem] glow-border">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  التحليل المالي الذكي
                </h2>
                <p className="text-sm text-muted-foreground mr-10">تتبع التدفقات المالية لحظياً من سيرفر SQLite</p>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-primary/50 animate-ping"></div>
                <div className="w-3 h-3 rounded-full bg-primary"></div>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '16px', border: '1px solid rgba(59,130,246,0.1)' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                    cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(217, 91%, 60%)" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Activity/Task Stream */}
          <motion.div variants={itemVariants} className="glass-panel p-8 rounded-[2rem] glow-border flex flex-col max-h-[500px]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.05]">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Target className="w-6 h-6 text-secondary" />
                المهمات
              </h2>
              <span className="text-xs bg-white/5 py-1 px-3 rounded-full text-muted-foreground uppercase tracking-widest">{tasks.length} Total</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {tasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex flex-col items-center justify-center h-full text-center py-10"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-secondary/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-secondary/40" />
                    </div>
                    <p className="text-muted-foreground font-medium">كل شيء تمام! لا يوجد مهام معلقة</p>
                  </motion.div>
                ) : (
                  tasks.map((task, idx) => (
                    <motion.div 
                      key={task.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-all group group-hover:border-secondary/20 flex items-start gap-4"
                    >
                      <div className="mt-1">
                        {task.status === 'Done' ? (
                          <CheckCircle2 className="w-5 h-5 text-secondary" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white mb-2 leading-tight">{task.name}</h4>
                        <div className="flex items-center gap-4 text-[10px] uppercase font-black text-muted-foreground/60 tracking-wider">
                          <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                            <Activity className="w-3 h-3" /> {task.status}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend: string, color: 'primary' | 'secondary' | 'blue' | 'gray' }) {
  const colorMap = {
    primary: "text-primary bg-primary/10 border-primary/20",
    secondary: "text-secondary bg-secondary/10 border-secondary/20",
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    gray: "text-gray-400 bg-gray-400/10 border-gray-400/20"
  };

  return (
    <motion.div 
      variants={{ 
        hidden: { opacity: 0, scale: 0.9 }, 
        show: { opacity: 1, scale: 1 } 
      }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-panel p-6 rounded-[2rem] relative overflow-hidden group border border-white/[0.05] hover:border-white/10"
    >
      <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -mr-16 -mt-16 opacity-20 transition-opacity group-hover:opacity-40", 
        color === 'primary' ? "bg-primary" : color === 'secondary' ? "bg-secondary" : "bg-white"
      )} />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className={cn("p-2.5 rounded-2xl border", colorMap[color])}>
          {icon}
        </div>
        <div className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-white/50">Details</div>
      </div>
      
      <div className="relative z-10 space-y-1">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
        <div className="text-3xl font-black text-white">{value}</div>
        <p className="text-[11px] font-bold text-primary/80 flex items-center gap-1 mt-3">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </p>
      </div>
    </motion.div>
  );
}
