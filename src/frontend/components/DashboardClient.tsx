"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { 
  Activity, Wallet, Shield, Menu, X, Settings, ExternalLink, Target, 
  Gem, LayoutDashboard, Briefcase, ListTodo, HeartPulse, CreditCard, 
  Banknote, Sparkles, Users, BookOpen, Wrench, Video, Brain, Link as LinkIcon,
  Plus, Trash2, History, Clock, AlertTriangle, Save, Check, ChevronLeft, Coffee, Compass,
  Edit, CheckCircle, GraduationCap, Eye, EyeOff, Globe, Flame, Zap, ArrowUpRight, ArrowDownRight,
  UploadCloud, Filter
} from 'lucide-react';
import TaskClient from './TaskClient';
import RoutineClient from './RoutineClient';
import SubscriptionClient from './SubscriptionClient';
import EventsClient from './EventsClient';
import LibraryClient from './LibraryClient';
import AcademicClient from './AcademicClient';
import DeepFocusClient from './DeepFocusClient';

interface Props {
  transactions: any[]; assets: any[]; incomes: any[]; wishlist: any[];
  investments: any[]; passiveSources: any[]; wallets: any[]; workTracking: any[];
  resources: any[];
  tasksToday: any[]; activeRoutines: any[]; upcomingEvents: any[]; activeSubscriptions: any[];
  netWorth: any; forecast: any; hourlyRate: number; distributionSettings: any;
  settings: { isPanic: boolean; notionUrl: string };
}

const COLORS = ['#FF5500', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'];
const MONTHS = ['ALL', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const T = {
  ar: {
    systemTitle: 'MARK OS',
    systemSub: 'نظام التحكم والإنتاجية الذكي',
    blurOn: 'Blur On',
    blurOff: 'Blur Off',
    privacyActiveText: 'وضع الخصوصية مفعل',
    privacyDisabledText: 'البيانات مكشوفة',
    tabGoals: 'الأهداف (GOALS)',
    tabFocus: 'التركيز (DEEP FOCUS)',
    tabHabits: 'العادات والروتين',
    tabTasks: 'المهام (TASKS)',
    tabFinance: 'الإدارة المالية',
    tabAcademic: 'الدراسة والكلية',
    tabSubscriptions: 'الاشتراكات',
    tabWishlist: 'الأمنيات',
    tabLibrary: 'مكتبة المعرفة',
    tabEvents: 'المواعيد والأصدقاء',
    tabSettings: 'الإعدادات',
    goalsAtGlance: 'نظرة عامة على الأهداف الشاملة (All Goals - At a Glance)',
    addIncome: '+ إضافة مورد دخل',
    addExpense: '- إضافة مصروف',
    totalIncome: 'إجمالي الدخل',
    totalExpense: 'إجمالي المصروفات',
    netBalance: 'صافي الرصيد',
    dailyHabitsScore: 'إنجاز العادات اليومية',
    activeTasks: 'المهام النشطة اليوم',
    quickLinks: 'روابط واختصارات سريعة',
    profileAvatar: 'الصورة الشخصية',
    changeAvatar: 'تغيير صورة البروفايل',
    uploadHeroPrompt: 'اختر صورة مفرغة لتظهر في شاشة تسجيل الدخول والبروفايل',
  },
  en: {
    systemTitle: 'MARK OS',
    systemSub: 'Personal Intelligence & High-Performance Hub',
    blurOn: 'Blur On',
    blurOff: 'Blur Off',
    privacyActiveText: 'Privacy Mode Active',
    privacyDisabledText: 'Data Visible',
    tabGoals: 'GOALS',
    tabFocus: 'DEEP FOCUS',
    tabHabits: 'DAILY HABITS',
    tabTasks: 'TASKS',
    tabFinance: 'FINANCE',
    tabAcademic: 'ACADEMIC HUB',
    tabSubscriptions: 'SUBSCRIPTIONS',
    tabWishlist: 'WISHLIST',
    tabLibrary: 'LIBRARY',
    tabEvents: 'SCHEDULE & NETWORK',
    tabSettings: 'SETTINGS',
    goalsAtGlance: 'All Goals - At a Glance',
    addIncome: '+ Add Income',
    addExpense: '- Add Expense',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expenses',
    netBalance: 'Net Balance',
    dailyHabitsScore: 'Daily Habits Score',
    activeTasks: 'Active Tasks Today',
    quickLinks: 'Quick Shortcuts',
    profileAvatar: 'Profile Avatar',
    changeAvatar: 'Change Profile Avatar',
    uploadHeroPrompt: 'Upload a cutout image for login screen and profile',
  }
};

export default function DashboardClient({ 
  transactions, assets, incomes, wishlist, investments, 
  passiveSources, wallets, workTracking, resources, 
  tasksToday, activeRoutines, upcomingEvents, activeSubscriptions,
  netWorth, forecast, hourlyRate, distributionSettings, settings 
}: Props) {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = T[lang];
  const isRtl = lang === 'ar';

  const [mainTab, setMainTab] = useState('overview');
  const [financeTab, setFinanceTab] = useState('networth');
  const [selectedMonth, setSelectedMonth] = useState('OCT');
  const [privacyActive, setPrivacyActive] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  // Persistent Tab & Privacy State
  useEffect(() => {
    const savedMain = localStorage.getItem('mainTab');
    const savedFinance = localStorage.getItem('financeTab');
    const savedPrivacy = localStorage.getItem('privacyActive');
    const savedLang = localStorage.getItem('lang');
    if (savedMain) setMainTab(savedMain);
    if (savedFinance) setFinanceTab(savedFinance);
    if (savedPrivacy) setPrivacyActive(savedPrivacy === 'true');
    if (savedLang === 'ar' || savedLang === 'en') setLang(savedLang);
  }, []);

  useEffect(() => {
    localStorage.setItem('mainTab', mainTab);
    localStorage.setItem('financeTab', financeTab);
    localStorage.setItem('privacyActive', String(privacyActive));
    localStorage.setItem('lang', lang);
  }, [mainTab, financeTab, privacyActive, lang]);

  // Financial Aggregations
  const totalIncome = incomes?.reduce((acc, current) => acc + (current.amount || 0), 0) || 0;
  const totalExpenses = transactions?.reduce((acc, current) => acc + (current.amount || 0), 0) || 0;
  const netBalance = totalIncome - totalExpenses;

  const [modal, setModal] = useState<string|null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [panic, setPanic] = useState(settings.isPanic);
  const [notionUrl, setNotionUrl] = useState(settings.notionUrl);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ amount:'', currency:'EGP', description:'', name:'', category:'شخصي', method:'كاش', status:'تم الصرف', source:'عام', hours:'', date: new Date().toISOString().split('T')[0], assetType:'كاش', liquidType:'سائل', initialValue:'', currentValue:'', platform:'', price:'', priority:'1', notes: '', profitAmount:'', duration:'', monthlyAmount:'', type: 'اشتراك' });
  const [selectedId, setSelectedId] = useState<number|string|null>(null);
  const [avatarUpload, setAvatarUpload] = useState<File | null>(null);

  const fmt = (n: number) => (
    <span className={`eng-num font-mono ${privacyActive ? 'privacy-blurred' : ''}`}>
      {Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
    </span>
  );

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

  const handleSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    post(modal!, form); 
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await fetch('/api/academic/materials/lectures', {
        method: 'POST',
        body: formData,
      });
      alert('تم تحديث الصورة بنجاح!');
    } catch {
      alert('حدث خطأ أثناء الرفع.');
    }
  };

  const mainNavItems = [
    { id: 'overview', icon: <Target size={22} />, label: t.tabGoals },
    { id: 'focus', icon: <Brain size={22} />, label: t.tabFocus, badge: 'PRO' },
    { id: 'habits', icon: <HeartPulse size={22} />, label: t.tabHabits },
    { id: 'tasks', icon: <ListTodo size={22} />, label: t.tabTasks },
    { id: 'finance', icon: <Wallet size={22} />, label: t.tabFinance },
    { id: 'academic', icon: <GraduationCap size={22} />, label: t.tabAcademic, badge: 'NEW' },
    { id: 'subscriptions', icon: <CreditCard size={22} />, label: t.tabSubscriptions },
    { id: 'wishlist', icon: <Sparkles size={22} />, label: t.tabWishlist },
    { id: 'library', icon: <BookOpen size={22} />, label: t.tabLibrary },
    { id: 'events', icon: <Users size={22} />, label: t.tabEvents },
    { id: 'settings', icon: <Settings size={22} />, label: t.tabSettings },
  ];

  // Life Pillars Goals Mockup / Cards for Goal Tracker
  const lifeGoals = [
    { title: 'Personal Brand & VUV Agency', category: 'Business', progress: 78, target: '100K Monthly ARR', icon: '🚀', color: '#FF5500' },
    { title: 'Academic Excellence (Engineering)', category: 'College', progress: 92, target: 'GPA 3.9+ Distinction', icon: '🎓', color: '#3B82F6' },
    { title: 'YouTube & Content Creation', category: 'Media', progress: 65, target: '50K Subscribers', icon: '🎥', color: '#EC4899' },
    { title: 'Physical Health & High Energy', category: 'Lifestyle', progress: 85, target: 'Daily Gym & Clean Nutrition', icon: '⚡', color: '#10B981' },
    { title: 'Financial Independence & Investment', category: 'Wealth', progress: 70, target: '1M EGP Asset Portfolio', icon: '💎', color: '#8B5CF6' },
    { title: 'Deep Learning & AI Engineering', category: 'Skills', progress: 88, target: 'Master Autonomous AI Agents', icon: '🧠', color: '#F59E0B' },
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-white selection:bg-orange-500/30 selection:text-orange-200" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ── TOP LUXURY NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050608]/85 backdrop-blur-2xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileSidebar(true)}
            className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white"
          >
            <Menu size={20} />
          </button>
          
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-[#FF3300] flex items-center justify-center text-white font-black shadow-[0_0_20px_rgba(255,85,0,0.5)]">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white">{t.systemTitle}</span>
              <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-mono text-[10px] font-black border border-orange-500/30">v4.0</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium hidden sm:block">{t.systemSub}</p>
          </div>
        </div>

        {/* Action Controls: Blur Toggle + Language + Profile */}
        <div className="flex items-center gap-3">
          {/* Privacy Blur Toggle Button (Prominent) */}
          <button
            onClick={() => setPrivacyActive(!privacyActive)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-black transition-all cursor-pointer shadow-lg ${
              privacyActive
                ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_20px_rgba(255,85,0,0.5)] scale-105'
                : 'bg-white/[0.04] text-gray-400 border-white/10 hover:text-white hover:border-orange-500/40'
            }`}
            title="إخفاء / إظهار الأرقام الحساسة بنظام التمويه"
          >
            {privacyActive ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="hidden sm:inline">{privacyActive ? t.blurOn : t.blurOff}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-black text-gray-300 hover:text-white hover:border-white/20 transition-all"
          >
            <Globe size={14} className="text-orange-400" />
            <span>{lang === 'ar' ? 'EN' : 'العربية'}</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-orange-500/40 bg-orange-500/20 flex items-center justify-center">
              <img src="/profile-hero.png" alt="Mark" className="w-full h-full object-cover" onError={(e:any)=>{e.target.src='/icon-192.png';}} />
            </div>
            <span className="text-xs font-black text-gray-200 hidden md:inline">Mark Emad</span>
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT: SIDEBAR + CONTENT ── */}
      <div className="max-w-7xl mx-auto flex gap-8 p-4 sm:p-6 lg:p-8">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-2 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
          <nav className="flex flex-col gap-1.5 p-2 rounded-[2.5rem] bg-white/[0.02] border border-white/10 backdrop-blur-2xl">
            {mainNavItems.map(item => {
              const isActive = mainTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setMainTab(item.id)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl text-sm font-black transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-[#FF3300] text-white shadow-[0_0_25px_rgba(255,85,0,0.4)] scale-102'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-orange-400 transition-colors'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-black ${
                      isActive ? 'bg-black/30 text-white' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Chrome / Local Experience Badge */}
          <div className="mt-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/google-chrome.svg" alt="Chrome" className="w-5 h-5" />
              <div>
                <span className="text-xs font-black text-white block">Google Chrome</span>
                <span className="text-[10px] text-emerald-400 font-bold">جاهز للاختبار المحلي</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-over Sidebar */}
        <AnimatePresence>
          {mobileSidebar && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileSidebar(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ x: isRtl ? 300 : -300 }}
                animate={{ x: 0 }}
                exit={{ x: isRtl ? 300 : -300 }}
                className="relative w-72 max-w-full bg-[#0c0d12] border-l border-white/10 h-full p-6 flex flex-col gap-4 z-10 overflow-y-auto"
              >
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="font-black text-lg text-white">قائمة السستم</span>
                  <button onClick={() => setMobileSidebar(false)} className="p-2 text-gray-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <nav className="flex flex-col gap-1.5">
                  {mainNavItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setMainTab(item.id); setMobileSidebar(false); }}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl text-sm font-black transition-all ${
                        mainTab === item.id
                          ? 'bg-orange-500 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── MAIN DYNAMIC VIEW AREA ── */}
        <main className="flex-1 min-w-0 space-y-8">
          
          {/* ===================== 1. GOALS & OVERVIEW (MAIN TRACKER) ===================== */}
          {mainTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              {/* Top Hero Banner */}
              <div className="relative overflow-hidden rounded-[2.5rem] border border-orange-500/30 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(255,85,0,0.12)]">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5500]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="text-xs font-mono font-black text-orange-400 uppercase tracking-widest block mb-1">CENTRAL OVERVIEW</span>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">GOAL TRACKER & LIFE OS</h1>
                    <p className="text-sm font-bold text-gray-400 mt-1">تتبع أهدافك الكبرى، العادات اليومية، وساعات التركيز في واجهة موحدة</p>
                  </div>

                  {/* Month Timeline Filter Bar */}
                  <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
                    {MONTHS.map(m => (
                      <button
                        key={m}
                        onClick={() => setSelectedMonth(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition-all cursor-pointer ${
                          selectedMonth === m
                            ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(255,85,0,0.5)]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick 3 Financial & Productivity Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 privacy-hover-reveal">
                    <span className="text-xs text-gray-400 block font-bold">{t.totalIncome}</span>
                    <strong className="text-2xl font-black text-emerald-400 font-mono">
                      {fmt(totalIncome)} <span className="text-xs text-gray-500">EGP</span>
                    </strong>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 privacy-hover-reveal">
                    <span className="text-xs text-gray-400 block font-bold">{t.totalExpense}</span>
                    <strong className="text-2xl font-black text-rose-400 font-mono">
                      {fmt(totalExpenses)} <span className="text-xs text-gray-500">EGP</span>
                    </strong>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 privacy-hover-reveal">
                    <span className="text-xs text-gray-400 block font-bold">{t.netBalance}</span>
                    <strong className="text-2xl font-black text-orange-400 font-mono">
                      {fmt(netBalance)} <span className="text-xs text-gray-500">EGP</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* ── ALL GOALS - AT A GLANCE (WIDE ORANGE GLOW CARDS) ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Flame size={20} className="text-orange-400" />
                    <span>{t.goalsAtGlance}</span>
                  </h2>
                  <span className="text-xs font-mono font-bold text-gray-500">{lifeGoals.length} Life Pillars</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lifeGoals.map((g, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -4 }}
                      className="goal-card-orange privacy-hover-reveal cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{g.icon}</span>
                          <div>
                            <h3 className="text-base font-black text-white leading-tight">{g.title}</h3>
                            <span className="text-[11px] font-mono text-orange-400 font-bold uppercase">{g.category}</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 font-mono font-black text-xs border border-orange-500/30">
                          {g.progress}%
                        </span>
                      </div>

                      <p className={`text-xs text-gray-300 font-bold mb-4 ${privacyActive ? 'privacy-blurred' : ''}`}>
                        🎯 الهدف: {g.target}
                      </p>

                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-0.5">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-[#FF3300]"
                          style={{ width: `${g.progress}%`, boxShadow: '0 0 10px rgba(255,85,0,0.6)' }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Action Navigation Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                  onClick={() => setMainTab('focus')}
                  className="p-5 rounded-3xl bg-white/[0.03] hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/40 transition-all text-center group cursor-pointer"
                >
                  <Brain size={28} className="mx-auto text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
                  <strong className="text-sm font-black text-white block">مؤقت التركيز</strong>
                  <span className="text-[11px] text-gray-500">Deep Focus & Pomodoro</span>
                </button>

                <button
                  onClick={() => setMainTab('academic')}
                  className="p-5 rounded-3xl bg-white/[0.03] hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/40 transition-all text-center group cursor-pointer"
                >
                  <GraduationCap size={28} className="mx-auto text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <strong className="text-sm font-black text-white block">الدراسة والكلية</strong>
                  <span className="text-[11px] text-gray-500">المواد والمحاضرات</span>
                </button>

                <button
                  onClick={() => setMainTab('finance')}
                  className="p-5 rounded-3xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 transition-all text-center group cursor-pointer"
                >
                  <Wallet size={28} className="mx-auto text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <strong className="text-sm font-black text-white block">المالية السريعة</strong>
                  <span className="text-[11px] text-gray-500">الدخل والمصروفات</span>
                </button>

                <button
                  onClick={() => setMainTab('tasks')}
                  className="p-5 rounded-3xl bg-white/[0.03] hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/40 transition-all text-center group cursor-pointer"
                >
                  <ListTodo size={28} className="mx-auto text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                  <strong className="text-sm font-black text-white block">إدارة المهام</strong>
                  <span className="text-[11px] text-gray-500">Tasks Matrix</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================== 2. DEEP FOCUS & TIMER ===================== */}
          {mainTab === 'focus' && (
            <motion.div key="focus" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <DeepFocusClient workTracking={workTracking} privacyActive={privacyActive} />
            </motion.div>
          )}

          {/* ===================== 3. DAILY HABITS & ROUTINE ===================== */}
          {mainTab === 'habits' && (
            <motion.div key="habits" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <RoutineClient />
            </motion.div>
          )}

          {/* ===================== 4. TASKS MANAGEMENT ===================== */}
          {mainTab === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <TaskClient />
            </motion.div>
          )}

          {/* ===================== 5. FINANCIAL DASHBOARD ===================== */}
          {mainTab === 'finance' && (
            <motion.div key="finance" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              {/* Financial Hero Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">الإدارة المالية المباشرة</h2>
                  <p className="text-xs text-gray-400 mt-1">تتبع الدخل، المصروفات، وتوزيع السيولة بكل بساطة</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setForm({ amount: '', description: '', source: 'عام', date: new Date().toISOString().split('T')[0] }); setModal('income'); }}
                    className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                  >
                    {t.addIncome}
                  </button>
                  <button
                    onClick={() => { setForm({ amount: '', category: 'شخصي', method: 'كاش', description: '', date: new Date().toISOString().split('T')[0] }); setModal('transaction'); }}
                    className="px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-sm shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all cursor-pointer"
                  >
                    {t.addExpense}
                  </button>
                </div>
              </div>

              {/* 3 Main Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="grand-card p-6 privacy-hover-reveal">
                  <span className="text-xs text-gray-400 font-bold block mb-1">{t.totalIncome}</span>
                  <strong className="text-3xl font-black text-emerald-400 font-mono">
                    {fmt(totalIncome)} <span className="text-sm text-gray-500">EGP</span>
                  </strong>
                </div>
                <div className="grand-card p-6 privacy-hover-reveal">
                  <span className="text-xs text-gray-400 font-bold block mb-1">{t.totalExpense}</span>
                  <strong className="text-3xl font-black text-rose-400 font-mono">
                    {fmt(totalExpenses)} <span className="text-sm text-gray-500">EGP</span>
                  </strong>
                </div>
                <div className="grand-card p-6 privacy-hover-reveal">
                  <span className="text-xs text-gray-400 font-bold block mb-1">{t.netBalance}</span>
                  <strong className="text-3xl font-black text-orange-400 font-mono">
                    {fmt(netBalance)} <span className="text-sm text-gray-500">EGP</span>
                  </strong>
                </div>
              </div>

              {/* Simple Money Flow Chart */}
              <div className="grand-card p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Activity size={18} className="text-orange-400" />
                    تدفق الأموال البسيط
                  </h3>
                  <span className="text-xs font-mono text-gray-500">Income vs Expenses</span>
                </div>
                <div className="privacy-hover-reveal" style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'الدخل', value: totalIncome, fill: '#10B981' },
                      { name: 'المصروفات', value: totalExpenses, fill: '#F43F5E' },
                      { name: 'الصافي', value: Math.abs(netBalance), fill: '#FF5500' },
                    ]} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                      <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ background: '#0c0d12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 13 }} 
                        formatter={(value: number) => [`${Number(value).toLocaleString('en-US')} EGP`, '']}
                      />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                        {[
                          { name: 'الدخل', value: totalIncome, fill: '#10B981' },
                          { name: 'المصروفات', value: totalExpenses, fill: '#F43F5E' },
                          { name: 'الصافي', value: Math.abs(netBalance), fill: '#FF5500' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Visual ratio bar */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden flex">
                    <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: `${totalIncome + totalExpenses > 0 ? (totalIncome / (totalIncome + totalExpenses)) * 100 : 50}%` }} />
                    <div className="h-full bg-rose-500 rounded-l-full" style={{ width: `${totalIncome + totalExpenses > 0 ? (totalExpenses / (totalIncome + totalExpenses)) * 100 : 50}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 shrink-0">
                    {totalIncome + totalExpenses > 0 ? Math.round((totalIncome / (totalIncome + totalExpenses)) * 100) : 50}% دخل
                  </span>
                </div>
              </div>

              {/* Two Column: Income List + Expenses List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income List */}
                <div className="grand-card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-base font-black text-emerald-400 flex items-center gap-2">
                      <ArrowUpRight size={16} />
                      مصادر الدخل
                    </h3>
                    <span className="text-xs font-mono text-gray-500">{incomes?.length || 0}</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {(incomes || []).slice(0, 10).map((inc: any) => (
                      <div key={inc.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/20 transition-all privacy-hover-reveal">
                        <div>
                          <strong className={`text-sm text-white block font-bold ${privacyActive ? 'privacy-blurred' : ''}`}>
                            {inc.description || inc.source || 'دخل'}
                          </strong>
                          <span className="text-[11px] font-mono text-gray-500">{inc.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black font-mono text-emerald-400 ${privacyActive ? 'privacy-blurred' : ''}`}>
                            +{fmt(inc.amount)} EGP
                          </span>
                          <button onClick={() => remove('incomes', inc.id)} className="p-1 text-gray-600 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!incomes || incomes.length === 0) && (
                      <p className="text-center text-gray-600 text-xs py-4">لا توجد مصادر دخل مسجلة</p>
                    )}
                  </div>
                </div>

                {/* Expenses (Transactions) List */}
                <div className="grand-card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-base font-black text-rose-400 flex items-center gap-2">
                      <ArrowDownRight size={16} />
                      آخر المصروفات
                    </h3>
                    <span className="text-xs font-mono text-gray-500">{transactions.length}</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {transactions.slice(0, 10).map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/20 transition-all privacy-hover-reveal">
                        <div>
                          <strong className={`text-sm text-white block font-bold ${privacyActive ? 'privacy-blurred' : ''}`}>
                            {t.description || 'مصروف'}
                          </strong>
                          <span className="text-[11px] font-mono text-gray-500">{t.date} • {t.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black font-mono text-rose-400 ${privacyActive ? 'privacy-blurred' : ''}`}>
                            -{fmt(t.amount)} EGP
                          </span>
                          <button onClick={() => remove('transactions', t.id)} className="p-1 text-gray-600 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-center text-gray-600 text-xs py-4">لا توجد مصروفات مسجلة</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===================== 6. ACADEMIC HUB ===================== */}
          {mainTab === 'academic' && (
            <motion.div key="academic" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <AcademicClient />
            </motion.div>
          )}

          {/* ===================== 7. SUBSCRIPTIONS ===================== */}
          {mainTab === 'subscriptions' && (
            <motion.div key="subs" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <SubscriptionClient />
            </motion.div>
          )}

          {/* ===================== 8. WISHLIST ===================== */}
          {mainTab === 'wishlist' && (
            <motion.div key="wishlist" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 sm:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                    <Sparkles size={24} className="text-orange-400" />
                    قائمة الأمنيات والأهداف
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">تتبع أهدافك المادية مع نسبة التقدم نحو تحقيقها</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 privacy-hover-reveal">
                    <span className="text-xs text-gray-400 block">إجمالي الأمنيات</span>
                    <strong className={`text-lg font-black font-mono text-orange-400 ${privacyActive ? 'privacy-blurred' : ''}`}>
                      {fmt(wishlist.reduce((s: number, w: any) => s + (w.price || 0), 0))} EGP
                    </strong>
                  </div>
                  <button
                    onClick={() => { setForm({ name: '', price: '', priority: 1, notes: '', url: '', date: new Date().toISOString().split('T')[0] }); setModal('wishlist'); }}
                    className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black text-sm shadow-[0_0_20px_rgba(255,85,0,0.3)] transition-all cursor-pointer"
                  >
                    + أمنية جديدة
                  </button>
                </div>
              </div>

              {/* Wishlist Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wishlist.map((w: any, idx: number) => {
                  const progress = w.saved ? Math.min(100, Math.round((w.saved / w.price) * 100)) : Math.round(Math.random() * 80 + 10);
                  const priorityLabel = w.priority == 1 ? '🔴 عالية' : w.priority == 2 ? '🟡 متوسطة' : '🟢 منخفضة';
                  const priorityColor = w.priority == 1 ? 'text-red-400 bg-red-500/10 border-red-500/20' : w.priority == 2 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-green-400 bg-green-500/10 border-green-500/20';
                  
                  return (
                    <motion.div 
                      key={w.id} 
                      whileHover={{ y: -3 }}
                      className="grand-card p-6 space-y-4 privacy-hover-reveal group"
                    >
                      {/* Top: Image placeholder + Title */}
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                          {w.image_url ? (
                            <img src={w.image_url} alt={w.name} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            <span>{'💎🎯🛍️🎮📱💻🎧🏠✈️🚗'[idx % 10]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-lg font-black text-white truncate">{w.name}</h3>
                            <button onClick={() => remove('wishlist', w.id)} className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${priorityColor}`}>{priorityLabel}</span>
                            {w.category && <span className="text-[10px] text-gray-500">{w.category}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xl font-black font-mono text-orange-400 ${privacyActive ? 'privacy-blurred' : ''}`}>
                          {fmt(w.price)} EGP
                        </span>
                        {w.url && (
                          <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                            <ExternalLink size={12} />
                            رابط الشراء
                          </a>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[11px] text-gray-400 font-bold">نسبة التقدم</span>
                          <span className="text-[11px] font-mono font-black text-orange-400">{progress}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-[#FF3300] transition-all duration-500"
                            style={{ width: `${progress}%`, boxShadow: '0 0 8px rgba(255,85,0,0.5)' }}
                          />
                        </div>
                      </div>

                      {/* Hours cost */}
                      {w.hoursCost > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            {w.hoursCost.toFixed(1)} ساعة عمل مطلوبة
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {wishlist.length === 0 && (
                <div className="text-center py-16 text-gray-600">
                  <Sparkles size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-bold">لا توجد أمنيات بعد</p>
                  <p className="text-xs mt-1">أضف أمنياتك وأهدافك المادية لتتبع تقدمك نحو تحقيقها</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ===================== 9. LIBRARY ===================== */}
          {mainTab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <LibraryClient />
            </motion.div>
          )}

          {/* ===================== 10. EVENTS & FRIENDS ===================== */}
          {mainTab === 'events' && (
            <motion.div key="events" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <EventsClient />
            </motion.div>
          )}

          {/* ===================== 11. SETTINGS ===================== */}
          {mainTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-4xl">
              <h2 className="text-2xl font-black text-white">إعدادات النظام والبروفايل</h2>

              {/* Profile Image Changer */}
              <div className="grand-card p-6 sm:p-8 space-y-4">
                <h3 className="text-lg font-black text-orange-400 flex items-center gap-2">
                  <Sparkles size={18} />
                  <span>{t.changeAvatar}</span>
                </h3>
                <p className="text-xs text-gray-400">{t.uploadHeroPrompt}</p>

                <div className="flex items-center gap-6 pt-2">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-500 shadow-lg bg-black/60 shrink-0">
                    <img src="/profile-hero.png" alt="Hero Avatar" className="w-full h-full object-cover" onError={(e:any)=>{e.target.src='/icon-512.png';}} />
                  </div>
                  <div>
                    <label className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-black text-white cursor-pointer inline-flex items-center gap-2">
                      <UploadCloud size={16} />
                      <span>اختيار صورة جديدة</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Panic Mode */}
              <div className="grand-card p-6 sm:p-8 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-rose-400">وضع الطوارئ (Panic Mode)</h3>
                  <p className="text-xs text-gray-400">يقفل الواجهة ويحمي البيانات المالية الحساسة</p>
                </div>
                <button
                  onClick={() => { setPanic(!panic); post('setting', { key: 'is_panic', value: !panic ? '1' : '0' }); }}
                  className={`w-16 h-8 rounded-full relative transition-all cursor-pointer ${panic ? 'bg-rose-500' : 'bg-gray-800'}`}
                >
                  <motion.div layout className={`absolute top-1 bottom-1 w-6 bg-white rounded-full ${panic ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </motion.div>
          )}

        </main>
      </div>

      {/* ── GLOBAL FINANCIAL MODAL ── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#0c0d12] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-orange-400">
                  {modal === 'income' ? t.addIncome : modal === 'transaction' ? t.addExpense : 'إضافة أمنية'}
                </h3>
                <button onClick={() => setModal(null)} className="p-2 text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">المبلغ المالي (EGP)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={modal === 'wishlist' ? form.price : form.amount}
                    onChange={e => setForm({ ...form, [modal === 'wishlist' ? 'price' : 'amount']: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-2xl font-black text-center font-mono text-white focus:outline-none focus:border-orange-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">الوصف أو التفاصيل</label>
                  <input
                    type="text"
                    required
                    value={modal === 'wishlist' ? form.name : form.description}
                    onChange={e => setForm({ ...form, [modal === 'wishlist' ? 'name' : 'description']: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                    placeholder="مثلاً: راتب / تسوق / كورس..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-gray-400">إلغاء</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-black text-xs hover:bg-orange-400 shadow-lg">حفظ</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
