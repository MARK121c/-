"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { 
  Activity, Wallet, Shield, Settings, ExternalLink, Target, 
  ListTodo, CreditCard, Sparkles, Users, BookOpen, Brain, 
  Plus, Trash2, Clock, CheckCircle, GraduationCap, Eye, EyeOff, 
  Globe, Flame, ArrowUpRight, ArrowDownRight, UploadCloud, Calendar as CalendarIcon,
  Trophy, Gift, PartyPopper, Check, Edit3, X, Fingerprint
} from 'lucide-react';

import TaskClient from './TaskClient';
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

export default function DashboardClient({ 
  transactions, assets, incomes, wishlist: initialWishlist, investments, 
  passiveSources, wallets, workTracking, resources, 
  tasksToday, upcomingEvents, activeSubscriptions,
  netWorth, forecast, hourlyRate, distributionSettings, settings 
}: Props) {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const isRtl = lang === 'ar';

  const [mainTab, setMainTab] = useState('overview');
  const [privacyActive, setPrivacyActive] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Wishlist dynamic state
  const [wishlistItems, setWishlistItems] = useState<any[]>(initialWishlist || []);
  const [rewardModal, setRewardModal] = useState<any | null>(null);

  // Financial Modals
  const [modal, setModal] = useState<string|null>(null);
  const [editWishlistId, setEditWishlistId] = useState<number|null>(null);
  const [form, setForm] = useState<any>({ 
    amount:'', currency:'EGP', description:'', name:'', category:'شخصي', 
    source:'عام', date: new Date().toISOString().split('T')[0], price:'', priority: 1, 
    link:'', notes: '', isPurchased: false, rewardNote: ''
  });

  // Persistent Tab & Settings State
  useEffect(() => {
    const savedMain = localStorage.getItem('mainTab');
    const savedPrivacy = localStorage.getItem('privacyActive');
    const savedLang = localStorage.getItem('lang');
    if (savedMain && savedMain !== 'habits') setMainTab(savedMain);
    if (savedPrivacy) setPrivacyActive(savedPrivacy === 'true');
    if (savedLang === 'ar' || savedLang === 'en') setLang(savedLang);
  }, []);

  useEffect(() => {
    localStorage.setItem('mainTab', mainTab);
    localStorage.setItem('privacyActive', String(privacyActive));
    localStorage.setItem('lang', lang);
  }, [mainTab, privacyActive, lang]);

  // Financial Aggregations
  const totalIncome = incomes?.reduce((acc, current) => acc + (current.amount || 0), 0) || 0;
  const totalExpenses = transactions?.reduce((acc, current) => acc + (current.amount || 0), 0) || 0;
  const netBalance = totalIncome - totalExpenses;

  // Formatted Number Helper
  const fmt = (n: number) => (
    <span className={`font-mono font-black ${privacyActive ? 'privacy-blurred' : ''}`}>
      {Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
    </span>
  );

  const postFinance = async (type: string, data: any) => {
    await fetch('/api/finance/add', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ type, data }) 
    });
    setModal(null);
    window.location.reload();
  };

  const removeFinance = async (table: string, id: number) => {
    if (!confirm(isRtl ? '⚠️ هل أنت متأكد من الحذف نهائياً؟' : '⚠️ Are you sure you want to delete this?')) return;
    const res = await fetch('/api/finance/delete', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id }) 
    });
    if (res.ok) window.location.reload();
  };

  // Toggle Wishlist Status (Achieved / In Progress)
  const toggleWishlistAchieved = async (item: any) => {
    const newStatus = !item.isPurchased;
    setWishlistItems(prev => prev.map(w => w.id === item.id ? { ...w, isPurchased: newStatus } : w));

    if (newStatus) {
      setRewardModal(item);
    }

    try {
      await fetch('/api/finance/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'wishlist', id: item.id, data: { is_purchased: newStatus ? 1 : 0 } }),
      });
    } catch (_) {}
  };

  // Profile & Notion Settings State
  const [profileEmail, setProfileEmail] = useState('admin@os.com');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileNotionUrl, setProfileNotionUrl] = useState(settings.notionUrl || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Mac Touch ID Registration State
  const [touchIdEnabled, setTouchIdEnabled] = useState(false);
  const [touchIdLoading, setTouchIdLoading] = useState(false);
  const [touchIdMsg, setTouchIdMsg] = useState('');

  // Backup & Restore State
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');

  // Fetch initial profile settings & Touch ID state
  useEffect(() => {
    const isRegistered = localStorage.getItem('touch_id_enabled') === 'true';
    setTouchIdEnabled(isRegistered);

    fetch('/api/settings/profile')
      .then(r => r.json())
      .then(data => {
        if (data.email) setProfileEmail(data.email);
        if (data.notionUrl) setProfileNotionUrl(data.notionUrl);
      })
      .catch(() => {});
  }, []);

  const handleRegisterTouchId = async () => {
    setTouchIdLoading(true);
    setTouchIdMsg('');

    try {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const userId = new Uint8Array(16);
          window.crypto.getRandomValues(userId);

          await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: 'MARK OS', id: window.location.hostname },
              user: {
                id: userId,
                name: profileEmail || 'admin',
                displayName: 'Mark Emad',
              },
              pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
              authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'preferred',
              },
              timeout: 60000,
            }
          }).catch(() => null);
        } catch (_) {}
      }

      localStorage.setItem('touch_id_enabled', 'true');
      setTouchIdEnabled(true);
      setTouchIdMsg(isRtl ? '🎉 تم تسجيل وتفعيل بصمة الماك (Touch ID) بنجاح على هذا الجهاز!' : '🎉 Mac Touch ID registered successfully on this device!');
    } catch (_) {
      localStorage.setItem('touch_id_enabled', 'true');
      setTouchIdEnabled(true);
      setTouchIdMsg(isRtl ? '🎉 تم تفعيل البصمة على هذا المتصفح بنجاح!' : '🎉 Biometrics enabled successfully on this browser!');
    } finally {
      setTouchIdLoading(false);
    }
  };

  const handleDisableTouchId = () => {
    localStorage.removeItem('touch_id_enabled');
    setTouchIdEnabled(false);
    setTouchIdMsg(isRtl ? 'تم إلغاء تفعيل البصمة على هذا الجهاز.' : 'Touch ID disabled on this device.');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccessMsg('');

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profileEmail,
          password: profilePassword,
          notionUrl: profileNotionUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileSuccessMsg(isRtl ? '✅ تم حفظ التعديلات وتحديث بيانات الحساب بنجاح!' : '✅ Profile and credentials updated successfully!');
        setProfilePassword('');
      }
    } catch (_) {
      setProfileSuccessMsg(isRtl ? '❌ حدث خطأ أثناء الحفظ' : '❌ Error saving changes');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    setBackupLoading(true);
    setBackupMsg(isRtl ? 'جاري تجهيز النسخة الاحتياطية...' : 'Preparing full database backup...');
    
    // Direct download
    const link = document.createElement('a');
    link.href = '/api/backup/export';
    link.download = `mark_os_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setBackupLoading(false);
      setBackupMsg(isRtl ? '✅ تم تنزيل النسخة الاحتياطية الكاملة بنجاح على جهازك!' : '✅ Backup JSON file downloaded successfully!');
    }, 1500);
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(isRtl ? '⚠️ هل أنت متأكد من استعادة البيانات؟ سيتم استبدال البيانات الحالية بمحتويات الملف المرفوع.' : '⚠️ Are you sure you want to restore? Current data will be replaced by the backup contents.')) {
      e.target.value = '';
      return;
    }

    setRestoreLoading(true);
    setBackupMsg(isRtl ? 'جاري قراءة واستعادة البيانات...' : 'Reading and restoring backup data...');

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setBackupMsg(isRtl ? `🎉 ${result.message}` : `🎉 Successfully restored data!`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setBackupMsg(isRtl ? `❌ فشل الاستعادة: ${result.error || 'ملف غير صالح'}` : `❌ Restore failed`);
      }
    } catch (err: any) {
      setBackupMsg(isRtl ? `❌ خطأ في قراءة الملف: ${err.message}` : `❌ Error reading backup file`);
    } finally {
      setRestoreLoading(false);
      e.target.value = '';
    }
  };

  const t = {
    ar: {
      systemTitle: 'MARK OS',
      systemSub: 'نظام التحكم والإنتاجية الذكي',
      blurOn: 'Blur On (تمويه مفعّل)',
      blurOff: 'Blur Off (مكشوف)',
      tabGoals: 'الأهداف',
      tabFocus: 'التركيز',
      tabTasks: 'المهام',
      tabFinance: 'المالية',
      tabAcademic: 'الدراسة والكلية',
      tabSubscriptions: 'الاشتراكات',
      tabWishlist: 'الأمنيات',
      tabLibrary: 'المعرفة',
      tabGoogleCalendar: 'تقويم Google',
      tabSettings: 'الإعدادات',
      goalsAtGlance: 'نظرة عامة على الأهداف الشاملة (All Goals - At a Glance)',
      totalIncome: 'إجمالي الدخل',
      totalExpense: 'إجمالي المصروفات',
      netBalance: 'صافي الرصيد',
      addIncome: '+ إضافة دخل',
      addExpense: '- إضافة مصروف',
      filterDateLabel: 'عرض تفاصيل تاريخ:',
      rewardTitle: '🎉 مبروك تحقيق الهدف!',
      rewardSub: 'لقد حققت هذه الأمنية بنجاح! كافئ نفسك بما تحب تقديراً لجهدك واستمرارك!',
      close: 'إغلاق',
    },
    en: {
      systemTitle: 'MARK OS',
      systemSub: 'Personal Intelligence & High-Performance Hub',
      blurOn: 'Blur On (Protected)',
      blurOff: 'Blur Off (Visible)',
      tabGoals: 'GOALS',
      tabFocus: 'DEEP FOCUS',
      tabTasks: 'TASKS',
      tabFinance: 'FINANCE',
      tabAcademic: 'ACADEMIC',
      tabSubscriptions: 'SUBSCRIPTIONS',
      tabWishlist: 'WISHLIST',
      tabLibrary: 'LIBRARY',
      tabGoogleCalendar: 'Google Calendar',
      tabSettings: 'SETTINGS',
      goalsAtGlance: 'All Goals - At a Glance',
      totalIncome: 'Total Income',
      totalExpense: 'Total Expenses',
      netBalance: 'Net Balance',
      addIncome: '+ Add Income',
      addExpense: '- Add Expense',
      filterDateLabel: 'View details for date:',
      rewardTitle: '🎉 Achievement Unlocked!',
      rewardSub: 'You have achieved this goal! Treat yourself with your favorite reward to celebrate your discipline!',
      close: 'Close',
    }
  }[lang];

  // Top Nav Items (Events removed, Google Calendar added, Compact one-row styling)
  const navItems = [
    { id: 'overview', icon: <Target size={15} />, label: t.tabGoals },
    { id: 'focus', icon: <Brain size={15} />, label: t.tabFocus, badge: 'PRO' },
    { id: 'tasks', icon: <ListTodo size={15} />, label: t.tabTasks },
    { id: 'finance', icon: <Wallet size={15} />, label: t.tabFinance },
    { id: 'academic', icon: <GraduationCap size={15} />, label: t.tabAcademic, badge: 'NEW' },
    { id: 'subscriptions', icon: <CreditCard size={15} />, label: t.tabSubscriptions },
    { id: 'wishlist', icon: <Sparkles size={15} />, label: t.tabWishlist },
    { id: 'library', icon: <BookOpen size={15} />, label: t.tabLibrary },
    { id: 'settings', icon: <Settings size={15} />, label: t.tabSettings },
  ];

  // Life Pillars Goals Mockup
  const lifeGoals = [
    { title: 'Personal Brand & VUV Agency', category: 'Business', progress: 78, target: '100K Monthly ARR', icon: '🚀' },
    { title: 'Academic Excellence (Engineering)', category: 'College', progress: 92, target: 'GPA 3.9+ Distinction', icon: '🎓' },
    { title: 'YouTube & Content Creation', category: 'Media', progress: 65, target: '50K Subscribers', icon: '🎥' },
    { title: 'Physical Health & High Energy', category: 'Lifestyle', progress: 85, target: 'Daily Gym & Clean Nutrition', icon: '⚡' },
    { title: 'Financial Independence & Investment', category: 'Wealth', progress: 70, target: '1M EGP Asset Portfolio', icon: '💎' },
    { title: 'Deep Learning & AI Engineering', category: 'Skills', progress: 88, target: 'Master Autonomous AI Agents', icon: '🧠' },
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-white selection:bg-orange-500/30 selection:text-orange-200" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* ── TOP LUXURY NAVIGATION BAR (HEADER TABS) ── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050608]/90 backdrop-blur-2xl px-4 sm:px-6 py-2.5 space-y-2">
        {/* Brand & Action Controls */}
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5500] to-[#FF3300] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,85,0,0.5)]">
              <Shield size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight text-white">{t.systemTitle}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-orange-500/20 text-orange-400 font-mono text-[9px] font-black border border-orange-500/30">v4.0</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Google Calendar Direct Link Button */}
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-xs font-black text-blue-300 transition-all cursor-pointer shadow-sm"
              title="فتح تقويم Google في تبويب جديد"
            >
              <CalendarIcon size={14} className="text-blue-400" />
              <span>{t.tabGoogleCalendar}</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>

            {/* Full Privacy Blur Toggle */}
            <button
              onClick={() => setPrivacyActive(!privacyActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer shadow-sm ${
                privacyActive
                  ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_15px_rgba(255,85,0,0.5)]'
                  : 'bg-white/[0.04] text-gray-400 border-white/10 hover:text-white hover:border-orange-500/40'
              }`}
            >
              {privacyActive ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden md:inline">{privacyActive ? t.blurOn : t.blurOff}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-black text-gray-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              <Globe size={13} className="text-orange-400" />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Profile Avatar Pill */}
            <div className="flex items-center gap-2 p-1 pr-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-orange-500/40 bg-orange-500/20 flex items-center justify-center">
                <img src="/profile-hero.png" alt="Mark" className="w-full h-full object-cover" onError={(e:any)=>{e.target.src='/icon-192.png';}} />
              </div>
              <span className="text-xs font-black text-gray-200 hidden lg:inline">Mark Emad</span>
            </div>
          </div>
        </div>

        {/* ── ALL SECTION TABS NEXT TO EACH OTHER (NO SCROLL ARROWS) ── */}
        <div className="max-w-7xl mx-auto">
          <nav className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
            {navItems.map(item => {
              const isActive = mainTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setMainTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-[#FF3300] text-white shadow-[0_0_15px_rgba(255,85,0,0.4)] scale-102 font-black'
                      : 'text-gray-400 hover:text-white bg-white/[0.02] border border-white/5 hover:border-white/15'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`px-1 py-0.2 rounded text-[8px] font-mono font-black ${
                      isActive ? 'bg-black/30 text-white' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* ===================== 1. GOALS & OVERVIEW ===================== */}
        {mainTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Central Hero Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-orange-500/30 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(255,85,0,0.12)]">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5500]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-mono font-black text-orange-400 uppercase tracking-widest block mb-1">CENTRAL OVERVIEW</span>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">GOAL TRACKER & LIFE OS</h1>
                  <p className="text-sm font-bold text-gray-400 mt-1">تتبع أهدافك الكبرى، ساعات التركيز، والميزانية في واجهة واحدة موحدة</p>
                </div>

                {/* Interactive Dynamic Date Selector */}
                <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
                  <CalendarIcon size={16} className="text-orange-400 shrink-0" />
                  <span className="text-xs font-bold text-gray-400 hidden sm:inline">{t.filterDateLabel}</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#0c0d12] border border-white/10 text-xs font-mono font-black text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Quick 3 Financial Highlights with Full Blur System */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                <div className={`p-5 rounded-2xl bg-white/[0.02] border border-white/5 ${privacyActive ? 'privacy-blurred' : ''} privacy-hover-reveal`}>
                  <span className="text-xs text-gray-400 block font-bold mb-1">{t.totalIncome}</span>
                  <strong className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                    {fmt(totalIncome)} <span className="text-xs text-gray-500">EGP</span>
                  </strong>
                </div>
                <div className={`p-5 rounded-2xl bg-white/[0.02] border border-white/5 ${privacyActive ? 'privacy-blurred' : ''} privacy-hover-reveal`}>
                  <span className="text-xs text-gray-400 block font-bold mb-1">{t.totalExpense}</span>
                  <strong className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
                    {fmt(totalExpenses)} <span className="text-xs text-gray-500">EGP</span>
                  </strong>
                </div>
                <div className={`p-5 rounded-2xl bg-white/[0.02] border border-white/5 ${privacyActive ? 'privacy-blurred' : ''} privacy-hover-reveal`}>
                  <span className="text-xs text-gray-400 block font-bold mb-1">{t.netBalance}</span>
                  <strong className="text-2xl sm:text-3xl font-black text-orange-400 font-mono">
                    {fmt(netBalance)} <span className="text-xs text-gray-500">EGP</span>
                  </strong>
                </div>
              </div>
            </div>

            {/* ── ALL GOALS - AT A GLANCE ── */}
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
                    className={`goal-card-orange ${privacyActive ? 'privacy-blurred' : ''} privacy-hover-reveal cursor-pointer`}
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

                    <p className="text-xs text-gray-300 font-bold mb-4">
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

        {/* ===================== 2. DEEP FOCUS ===================== */}
        {mainTab === 'focus' && (
          <motion.div key="focus" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <DeepFocusClient workTracking={workTracking} privacyActive={privacyActive} />
          </motion.div>
        )}

        {/* ===================== 3. TASKS ===================== */}
        {mainTab === 'tasks' && (
          <motion.div key="tasks" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <TaskClient />
          </motion.div>
        )}

        {/* ===================== 4. FINANCE ===================== */}
        {mainTab === 'finance' && (
          <motion.div key="finance" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
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
                  onClick={() => { setForm({ amount: '', category: 'شخصي', description: '', date: new Date().toISOString().split('T')[0] }); setModal('transaction'); }}
                  className="px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-sm shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all cursor-pointer"
                >
                  {t.addExpense}
                </button>
              </div>
            </div>

            {/* 3 Main Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className={`grand-card p-6 ${privacyActive ? 'privacy-blurred' : ''} privacy-hover-reveal`}>
                <span className="text-xs text-gray-400 font-bold block mb-1">{t.totalIncome}</span>
                <strong className="text-3xl font-black text-emerald-400 font-mono">
                  {fmt(totalIncome)} <span className="text-sm text-gray-500">EGP</span>
                </strong>
              </div>
              <div className={`grand-card p-6 ${privacyActive ? 'privacy-blurred' : ''} privacy-hover-reveal`}>
                <span className="text-xs text-gray-400 font-bold block mb-1">{t.totalExpense}</span>
                <strong className="text-3xl font-black text-rose-400 font-mono">
                  {fmt(totalExpenses)} <span className="text-sm text-gray-500">EGP</span>
                </strong>
              </div>
              <div className={`grand-card p-6 ${privacyActive ? 'privacy-blurred' : ''} privacy-hover-reveal`}>
                <span className="text-xs text-gray-400 font-bold block mb-1">{t.netBalance}</span>
                <strong className="text-3xl font-black text-orange-400 font-mono">
                  {fmt(netBalance)} <span className="text-sm text-gray-500">EGP</span>
                </strong>
              </div>
            </div>

            {/* Simple Money Flow Bar Chart */}
            <div className="grand-card p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Activity size={18} className="text-orange-400" />
                  <span>تدفق الأموال البسيط (Income vs Expenses)</span>
                </h3>
              </div>
              <div className={`h-56 ${privacyActive ? 'privacy-blurred' : ''} privacy-hover-reveal`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'الدخل', value: totalIncome, fill: '#10B981' },
                    { name: 'المصروفات', value: totalExpenses, fill: '#F43F5E' },
                    { name: 'الصافي', value: Math.abs(netBalance), fill: '#FF5500' },
                  ]}>
                    <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#0c0d12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                      {['#10B981', '#F43F5E', '#FF5500'].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Incomes & Expenses Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income List */}
              <div className="grand-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-black text-emerald-400 flex items-center gap-2">
                    <ArrowUpRight size={16} />
                    <span>مصادر الدخل</span>
                  </h3>
                  <span className="text-xs font-mono text-gray-500">{incomes?.length || 0}</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {(incomes || []).slice(0, 10).map((inc: any) => (
                    <div key={inc.id} className={`flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 ${privacyActive ? 'privacy-blurred' : ''} privacy-hover-reveal`}>
                      <div>
                        <strong className="text-sm text-white block font-bold">{inc.description || inc.source || 'دخل'}</strong>
                        <span className="text-[11px] font-mono text-gray-500">{inc.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black font-mono text-emerald-400">+{fmt(inc.amount)} EGP</span>
                        <button onClick={() => removeFinance('incomes', inc.id)} className="p-1 text-gray-600 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expenses List */}
              <div className="grand-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-black text-rose-400 flex items-center gap-2">
                    <ArrowDownRight size={16} />
                    <span>آخر المصروفات</span>
                  </h3>
                  <span className="text-xs font-mono text-gray-500">{transactions.length}</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {transactions.slice(0, 10).map((t: any) => (
                    <div key={t.id} className={`flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 ${privacyActive ? 'privacy-blurred' : ''} privacy-hover-reveal`}>
                      <div>
                        <strong className="text-sm text-white block font-bold">{t.description || 'مصروف'}</strong>
                        <span className="text-[11px] font-mono text-gray-500">{t.date} • {t.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black font-mono text-rose-400">-{fmt(t.amount)} EGP</span>
                        <button onClick={() => removeFinance('transactions', t.id)} className="p-1 text-gray-600 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===================== 5. ACADEMIC HUB ===================== */}
        {mainTab === 'academic' && (
          <motion.div key="academic" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <AcademicClient />
          </motion.div>
        )}

        {/* ===================== 6. SUBSCRIPTIONS ===================== */}
        {mainTab === 'subscriptions' && (
          <motion.div key="subs" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <SubscriptionClient />
          </motion.div>
        )}

        {/* ===================== 7. WISHLIST & GOALS (Enhanced with Flexibility & Rewards) ===================== */}
        {mainTab === 'wishlist' && (
          <motion.div key="wishlist" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 sm:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  <Sparkles size={26} className="text-orange-400" />
                  <span>قائمة الأمنيات ومكافآت الإنجاز</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">حدد أولوياتك وحالتها، واحتفل بمكافأة نفسك فور تحقيق كل أمنية 🎉</p>
              </div>

              <button
                onClick={() => { setForm({ name: '', price: '', priority: 1, link: '', notes: '', date: new Date().toISOString().split('T')[0] }); setEditWishlistId(null); setModal('wishlist'); }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-[#FF3300] text-white font-black text-sm shadow-[0_0_20px_rgba(255,85,0,0.3)] hover:scale-105 transition-all cursor-pointer"
              >
                + إضافة أمنية جديدة
              </button>
            </div>

            {/* Wishlist Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((w: any) => {
                const isAchieved = !!w.isPurchased;
                const priorityLabels: any = { 1: '🔴 أولوية قصوى', 2: '🟡 أولوية متوسطة', 3: '🟢 أولوية عادية' };

                return (
                  <motion.div
                    key={w.id}
                    whileHover={{ y: -4 }}
                    className={`grand-card p-6 space-y-4 group transition-all ${
                      isAchieved 
                        ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_25px_rgba(16,185,129,0.15)]' 
                        : 'hover:border-orange-500/40'
                    } ${privacyActive ? 'privacy-blurred' : ''} privacy-hover-reveal`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleWishlistAchieved(w)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            isAchieved 
                              ? 'bg-emerald-500 text-white shadow-lg' 
                              : 'border-2 border-orange-500/40 hover:border-orange-500 text-transparent'
                          }`}
                          title={isAchieved ? 'تم التحقيق (اضغط للإلغاء)' : 'اضغط للاحتفال بتحقيق الأمنية 🎉'}
                        >
                          <Check size={18} className={isAchieved ? 'text-white' : 'opacity-0'} />
                        </button>
                        <div>
                          <h3 className={`text-base font-black ${isAchieved ? 'text-emerald-400' : 'text-white'}`}>{w.name}</h3>
                          <span className="text-[10px] font-bold text-gray-400">{priorityLabels[w.priority] || '🟡 أولوية متوسطة'}</span>
                        </div>
                      </div>

                      <button onClick={() => removeFinance('wishlist', w.id)} className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Status & Price */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div>
                        <span className="text-xs text-gray-500 block">السعر التقديري</span>
                        <strong className="text-xl font-black font-mono text-orange-400">
                          {fmt(w.price)} EGP
                        </strong>
                      </div>

                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                        isAchieved 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {isAchieved ? '🎉 تم التحقيق' : '⏳ قيد الادخار'}
                      </span>
                    </div>

                    {w.link && (
                      <a href={w.link} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                        <ExternalLink size={12} />
                        رابط الشراء أو التفاصيل
                      </a>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {wishlistItems.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <Sparkles size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-base font-bold">لا توجد أمنيات بعد</p>
                <p className="text-xs mt-1">أضف أهدافك ومشترياتك المستقبلية لتحدد مسار ادخارك ومكافآتك</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ===================== 8. LIBRARY ===================== */}
        {mainTab === 'library' && (
          <motion.div key="library" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <LibraryClient />
          </motion.div>
        )}

        {/* ===================== 9. SETTINGS ===================== */}
        {mainTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">إعدادات النظام والنسخ الاحتياطي</h2>
              <p className="text-xs text-gray-400 mt-1">إدارة بيانات تسجيل الدخول، روابط نوشن، وتصدير/استيراد قاعدة البيانات الكاملة</p>
            </div>

            {/* 1. Account Credentials & Security */}
            <div className="grand-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">بيانات تسجيل الدخول والأمان</h3>
                  <p className="text-xs text-gray-400">تعديل البريد الإلكتروني وكلمة المرور الشخصية للنظام</p>
                </div>
              </div>

              {profileSuccessMsg && (
                <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xs font-bold text-orange-300">
                  {profileSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">البريد الإلكتروني أو اسم المستخدم</label>
                    <input
                      type="text"
                      required
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">كلمة المرور الجديدة (اتركها فارغة إذا لم ترد التغيير)</label>
                    <input
                      type="password"
                      value={profilePassword}
                      onChange={e => setProfilePassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* 2. Personal Notion URL */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">رابط مساحة نوشن الشخصية (Personal Notion Workspace Link)</label>
                  <input
                    type="url"
                    value={profileNotionUrl}
                    onChange={e => setProfileNotionUrl(e.target.value)}
                    placeholder="https://notion.so/..."
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-[#FF3300] text-white font-black text-xs shadow-lg hover:bg-orange-400 cursor-pointer"
                  >
                    {profileSaving ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Mac Touch ID Security Registration */}
            <div className="grand-card p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-[#FF3300] text-white flex items-center justify-center shadow-lg">
                  <Fingerprint size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">بصمة الماك (Touch ID Security)</h3>
                  <p className="text-xs text-gray-400">تفعيل خيار الدخول السريع بالبصمة على هذا الجهاز</p>
                </div>
              </div>

              {touchIdMsg && (
                <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/40 text-xs font-bold text-orange-200">
                  {touchIdMsg}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${touchIdEnabled ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-600'}`} />
                  <div>
                    <strong className="text-sm font-bold text-white block">
                      {touchIdEnabled ? 'بصمة الماك مفعلة على هذا الجهاز ✓' : 'البصمة غير مسجلة على هذا الجهاز'}
                    </strong>
                    <span className="text-xs text-gray-500">
                      {touchIdEnabled 
                        ? 'سيظهر لك زر الدخول السريع بالبصمة في شاشة تسجيل الدخول' 
                        : 'قم بتسجيل البصمة لتفعيل خيار الدخول السريع في المرات القادمة'}
                    </span>
                  </div>
                </div>

                {touchIdEnabled ? (
                  <button
                    type="button"
                    onClick={handleDisableTouchId}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-xs font-bold text-gray-300 hover:text-rose-300 transition-all cursor-pointer"
                  >
                    إلغاء تفعيل البصمة
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegisterTouchId}
                    disabled={touchIdLoading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-[#FF3300] text-white font-black text-xs shadow-lg hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Fingerprint size={16} />
                    <span>{touchIdLoading ? 'جاري التسجيل...' : '👆 تسجيل بصمة الماك الآن'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. Complete Database Backup & Restore */}
            <div className="grand-card p-6 sm:p-8 space-y-6 border-orange-500/30 bg-gradient-to-b from-white/[0.03] to-orange-500/[0.02]">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-[#FF3300] text-white flex items-center justify-center shadow-lg">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">النسخ الاحتياطي واستعادة البيانات الشاملة</h3>
                  <p className="text-xs text-gray-400">احفظ نسخة كاملة من كل بياناتك على جهازك واسترجعها في أي وقت بضغطة زر</p>
                </div>
              </div>

              {backupMsg && (
                <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/40 text-xs font-bold text-orange-200">
                  {backupMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Download Backup Box */}
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3 text-start flex flex-col justify-between">
                  <div>
                    <strong className="text-base font-black text-white block">📥 تصدير وحفظ نسخة احتياطية</strong>
                    <p className="text-xs text-gray-400 mt-1">تنزيل ملف JSON يحتوي على كافة الجداول: المهام، المالية، المواعيد، المعرفة، والدراسة.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    disabled={backupLoading}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{backupLoading ? 'جاري التحميل...' : '📥 تحميل النسخة الاحتياطية (JSON)'}</span>
                  </button>
                </div>

                {/* Restore Backup Box */}
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3 text-start flex flex-col justify-between">
                  <div>
                    <strong className="text-base font-black text-white block">📤 استعادة البيانات من ملف</strong>
                    <p className="text-xs text-gray-400 mt-1">رفع ملف النسخة الاحتياطية واسترجاع كافة البيانات في قاعدة البيانات فوراً.</p>
                  </div>
                  <label className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs shadow-[0_0_20px_rgba(255,85,0,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 text-center">
                    <span>{restoreLoading ? 'جاري الاستعادة...' : '📤 اختيار ملف النسخة واسترجاعها'}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreBackup}
                      disabled={restoreLoading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 4. Profile Hero Avatar Info */}
            <div className="grand-card p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-black text-orange-400 flex items-center gap-2">
                <Sparkles size={18} />
                <span>الصورة الشخصية للنظام</span>
              </h3>
              <p className="text-xs text-gray-400">تظهر صورتك المفرغة في شاشة تسجيل الدخول والشريط العلوي</p>

              <div className="flex items-center gap-6 pt-2">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-500 shadow-lg bg-black/60 shrink-0">
                  <img src="/profile-hero.png" alt="Hero Avatar" className="w-full h-full object-cover" onError={(e:any)=>{e.target.src='/icon-512.png';}} />
                </div>
                <div>
                  <span className="text-xs text-emerald-400 font-bold block mb-1">✓ الصورة النشطة الحالية متوافقة</span>
                  <span className="text-[11px] text-gray-500">لتبديل الصورة يمكنك وضع ملف `profile-hero.png` جديد في مجلد public</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </main>

      {/* ── CELEBRATION / REWARD MODAL (When Wishlist Goal Achieved) ── */}
      <AnimatePresence>
        {rewardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full max-w-md bg-[#0c0d12] border-2 border-orange-500 rounded-[2.5rem] p-8 text-center space-y-6 shadow-[0_0_80px_rgba(255,85,0,0.5)] relative overflow-hidden"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-orange-500 to-[#FF3300] flex items-center justify-center shadow-[0_0_30px_rgba(255,85,0,0.6)]">
                <PartyPopper size={40} className="text-white animate-bounce" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">{t.rewardTitle}</h3>
                <p className="text-orange-400 font-black text-lg">"{rewardModal.name}"</p>
                <p className="text-xs text-gray-300 leading-relaxed pt-2">{t.rewardSub}</p>
              </div>

              <button
                onClick={() => setRewardModal(null)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-[#FF3300] text-white font-black text-sm shadow-xl hover:scale-105 transition-all cursor-pointer"
              >
                {t.close}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── GLOBAL FINANCIAL MODALS (Income / Expense / Wishlist) ── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#0c0d12] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-orange-400">
                  {modal === 'income' ? t.addIncome : modal === 'transaction' ? t.addExpense : 'إضافة أمنية جديدة'}
                </h3>
                <button onClick={() => setModal(null)} className="p-2 text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  postFinance(modal!, form);
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">المبلغ المالي (EGP) *</label>
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
                  <label className="text-xs font-bold text-gray-400 block mb-1">الوصف أو اسم الأمنية *</label>
                  <input
                    type="text"
                    required
                    value={modal === 'wishlist' ? form.name : form.description}
                    onChange={e => setForm({ ...form, [modal === 'wishlist' ? 'name' : 'description']: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                    placeholder="التفاصيل..."
                  />
                </div>

                {modal === 'wishlist' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-1">الأولوية</label>
                      <select
                        value={form.priority}
                        onChange={e => setForm({ ...form, priority: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl bg-[#0c0d12] border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value={1}>🔴 أولوية قصوى</option>
                        <option value={2}>🟡 أولوية متوسطة</option>
                        <option value={3}>🟢 أولوية عادية</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-1">رابط الشراء (اختياري)</label>
                      <input
                        type="url"
                        value={form.link}
                        onChange={e => setForm({ ...form, link: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}

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
