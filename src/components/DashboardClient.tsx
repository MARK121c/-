"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Activity, CreditCard, LayoutDashboard, Target, Link, Calendar, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardClient({ finances, tasks }: { finances: any[], tasks: any[] }) {
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
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  } as const;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans" dir="rtl">
      <motion.div 
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.header variants={itemVariants} className="flex justify-between items-end pb-6 border-b border-white/5">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
              Personal <span className="text-gradient">OS</span>
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              تمت المزامنة بنجاح مع Notion
            </p>
          </div>
          <div className="hidden sm:flex px-4 py-2 rounded-full glass-panel text-sm font-medium text-white/80 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <LayoutDashboard className="w-4 h-4 ml-2 text-primary" />
            Dashboard
          </div>
        </motion.header>

        {/* Top Cards */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-muted-foreground">إجمالي المصروفات</h3>
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">${totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">على مدار الفترة المسجلة</p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-secondary/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-muted-foreground">المهام المعلقة</h3>
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Target className="w-5 h-5 text-secondary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">مهام تنتظر التنفيذ</p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-muted-foreground">بوت تليجرام</h3>
              <div className="p-2 bg-white/5 rounded-lg flex items-center justify-center">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </div>
            </div>
            <div className="text-lg font-bold text-white mb-1 mt-3">Active (Webhook Ready)</div>
            <p className="text-xs text-muted-foreground mt-2">مستعد لتلقي الأوامر لحظياً</p>
          </motion.div>
        </motion.div>

        {/* Charts and Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Finance Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                تحليل المصروفات
              </h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 15, 18, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="hsl(217, 91%, 60%)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Tasks List */}
          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl flex flex-col">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-secondary" />
              المهام النشطة
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-70 mt-10">
                  <CheckCircle2 className="w-10 h-10 mb-3 text-secondary/50" />
                  <p>لا توجد مهام معلقة!</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <motion.div 
                    key={task.id} 
                    className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex items-start gap-3"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Circle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{task.name}</h4>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
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
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
