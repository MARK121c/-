"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Wallet, Shield, Settings, ExternalLink, Target, 
  ListTodo, CreditCard, Sparkles, Users, BookOpen, Brain, 
  Plus, Trash2, Clock, CheckCircle, GraduationCap, Eye, EyeOff, 
  Globe, Flame, ArrowUpRight, ArrowDownRight, UploadCloud, Calendar as CalendarIcon,
  Trophy, Gift, PartyPopper, Check, Edit3, X, Image as ImageIcon, Link as LinkIcon, LogOut,
  Upload, Camera, Lightbulb
} from 'lucide-react';

import TaskClient from './TaskClient';
import SubscriptionClient from './SubscriptionClient';
import LibraryClient from './LibraryClient';
import AcademicClient from './AcademicClient';
import DeepFocusClient from './DeepFocusClient';
import CoursesClient from './CoursesClient';
import BrainDumpClient from './BrainDumpClient';


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

  // Role-Based Access Control
  const [userRole, setUserRole] = useState<'owner' | 'assistant' | 'viewer'>('owner');
  const [userDisplayName, setUserDisplayName] = useState<string>('Mark Emad');

  // Dynamic Live Stats for Life Goals
  const [academicStats, setAcademicStats] = useState({ total: 0, completed: 0, percentage: 0 });
  const [coursesStats, setCoursesStats] = useState({ totalLessons: 0, completedLessons: 0, percentage: 0 });
  const [tasksStats, setTasksStats] = useState({ total: 0, completed: 0, percentage: 0 });

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

  // Profile Settings State
  const [profileEmail, setProfileEmail] = useState('admin@os.com');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileNotionUrl, setProfileNotionUrl] = useState(settings.notionUrl || '');
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState('https://calendar.google.com');
  const [avatarUrl, setAvatarUrl] = useState('/profile-hero.png');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;

    // 1. Instant preview with Base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target?.result as string;
      if (base64Url) {
        setAvatarUrl(base64Url);
        try { localStorage.setItem('user_avatar', base64Url); } catch {}
      }
    };
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const targetUrl = data.dataUrl || data.url;

      if (res.ok && targetUrl) {
        setAvatarUrl(targetUrl);
        try { localStorage.setItem('user_avatar', targetUrl); } catch {}
        
        // Auto-save in DB
        await fetch('/api/settings/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: targetUrl }),
        }).catch(() => {});
        setProfileSuccessMsg(isRtl ? '✅ تم تحديث صورتك الشخصية في كامل النظام بنجاح!' : '✅ Profile avatar updated across the system!');
      } else {
        setProfileSuccessMsg(data.error || 'فشل رفع الصورة');
      }
    } catch {
      setProfileSuccessMsg('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Backup & Restore State
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');

  // Persistent Tab & Auth Check
  useEffect(() => {
    // Check saved avatar from localStorage
    try {
      const savedAvatar = localStorage.getItem('user_avatar');
      if (savedAvatar) setAvatarUrl(savedAvatar);
    } catch {}

    // Check if logged in as Assistant or Viewer
    try {
      const storedUser = localStorage.getItem('academic_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u.role === 'assistant') {
          setUserRole('assistant');
          setUserDisplayName(u.displayName || u.username || 'مساعد الكلية');
          setMainTab('academic');
          return;
        } else if (u.role === 'viewer') {
          setUserRole('viewer');
          setUserDisplayName(u.displayName || u.username || 'حساب عرض فقط');
          setMainTab('academic');
          return;
        } else {
          setUserRole('owner');
          if (u.displayName) setUserDisplayName(u.displayName);
        }
      }
    } catch {}

    const savedMain = localStorage.getItem('mainTab');
    const savedPrivacy = localStorage.getItem('privacyActive');
    const savedLang = localStorage.getItem('lang');
    if (savedMain && savedMain !== 'habits') setMainTab(savedMain);
    if (savedPrivacy) setPrivacyActive(savedPrivacy === 'true');
    if (savedLang === 'ar' || savedLang === 'en') setLang(savedLang);

    // Fetch initial profile settings
    fetch('/api/settings/profile')
      .then(r => r.json())
      .then(data => {
        if (data.email) setProfileEmail(data.email);
        if (data.notionUrl) setProfileNotionUrl(data.notionUrl);
        if (data.googleCalendarUrl) setGoogleCalendarUrl(data.googleCalendarUrl);
        if (data.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
          try { localStorage.setItem('user_avatar', data.avatarUrl); } catch {}
        }
      })
      .catch(() => {});

    // Fetch dynamic stats for Overview Goals
    fetchDynamicGoalStats();
  }, []);

  async function fetchDynamicGoalStats() {
    try {
      // Academic stats
      const acRes = await fetch('/api/academic/progress');
      const acData = await acRes.json();
      if (acData.success && acData.overview) {
        setAcademicStats({
          total: acData.overview.totalItems || 0,
          completed: acData.overview.completedItems || 0,
          percentage: acData.overview.progressPercentage || 0,
        });
      }

      // Courses stats
      const cRes = await fetch('/api/courses');
      const cData = await cRes.json();
      if (cData.courses) {
        let total = 0;
        let completed = 0;
        cData.courses.forEach((c: any) => {
          total += c.stats?.totalLessons || 0;
          completed += c.stats?.completedLessons || 0;
        });
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        setCoursesStats({ totalLessons: total, completedLessons: completed, percentage: pct });
      }

      // Tasks stats
      const tRes = await fetch('/api/tasks?type=all');
      const tData = await tRes.json();
      if (tData.tasks) {
        const total = tData.tasks.length;
        const done = tData.tasks.filter((t: any) => t.status === 'done').length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        setTasksStats({ total, completed: done, percentage: pct });
      }
    } catch {}
  }

  // 2-Device Limit Heartbeat: kicks out oldest device if 3rd device logs in
  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        const token = localStorage.getItem('academic_token');
        if (!token) return;
        const res = await fetch('/api/auth/session', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          if (data.kickedOut) {
            localStorage.removeItem('academic_token');
            localStorage.removeItem('academic_user');
            alert('⚠️ تم تسجيل الخروج تلقائياً: تم تسجيل الدخول من جهاز آخر. الحد الأقصى للجلسات النشطة هو جهازين فقط.');
            window.location.href = '/login?kicked=true';
          }
        }
      } catch {}
    };

    const interval = setInterval(checkSessionStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (userRole === 'owner') {
      localStorage.setItem('mainTab', mainTab);
    }
    localStorage.setItem('privacyActive', String(privacyActive));
    localStorage.setItem('lang', lang);
  }, [mainTab, privacyActive, lang, userRole]);

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
          googleCalendarUrl: googleCalendarUrl,
          avatarUrl: avatarUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileSuccessMsg(isRtl ? '✅ تم حفظ التعديلات وتحديث بيانات الحساب بنجاح!' : '✅ Profile and settings updated successfully!');
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
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('academic_token');
    localStorage.removeItem('academic_user');
    window.location.href = '/login';
  };

  const t = {
    ar: {
      systemTitle: 'MARK OS',
      systemSub: 'نظام إدارة المهام والإنتاجية والكورسات المتكامل',
      blurOn: 'إخفاء الأرقام (مفعل)',
      blurOff: 'إظهار الأرقام',
      tabGoals: 'الأهداف والداشبورد',
      tabCourses: 'الكورسات والتعلم',
      tabFocus: 'التركيز (DEEP FOCUS)',
      tabNotes: 'تفريغ الأفكار (NOTES)',
      tabTasks: 'المهام (TASKS)',
      tabFinance: 'الإدارة المالية',
      tabAcademic: 'الدراسة والكلية',
      tabSubscriptions: 'الاشتراكات',
      tabWishlist: 'قائمة الأمنيات',
      tabLibrary: 'مكتبة المعرفة',
      tabGoogleCalendar: 'تقويم Google',
      tabSettings: 'الإعدادات',
      goalsAtGlance: 'نظرة عامة على الأهداف الشاملة (All Goals - Dynamic Live Tracking)',
      totalIncome: 'إجمالي الدخل',
      totalExpense: 'إجمالي المصروفات',
      netBalance: 'صافي الرصيد',
      addIncome: '+ إضافة دخل',
      addExpense: '- إضافة مصروف',
      filterDateLabel: 'عرض تفاصيل تاريخ:',
      rewardTitle: '🎉 مبروك تحقيق الهدف!',
      rewardSub: 'لقد حققت هذه الأمنية بنجاح! كافئ نفسك بما تحب تقديراً لجهدك واستمرارك!',
      close: 'إغلاق',
      assistantModeBadge: 'حساب مساعد: قسم الكلية فقط',
    },
    en: {
      systemTitle: 'MARK OS',
      systemSub: 'Personal Operating System & Learning Platform',
      blurOn: 'Blur On (Protected)',
      blurOff: 'Blur Off (Visible)',
      tabGoals: 'GOALS & OVERVIEW',
      tabCourses: 'COURSES & SKOOL HUB',
      tabFocus: 'DEEP FOCUS',
      tabNotes: 'BRAIN DUMP',
      tabTasks: 'TASKS',
      tabFinance: 'FINANCE',
      tabAcademic: 'ACADEMIC HUB',
      tabSubscriptions: 'SUBSCRIPTIONS',
      tabWishlist: 'WISHLIST',
      tabLibrary: 'LIBRARY',
      tabGoogleCalendar: 'Google Calendar',
      tabSettings: 'SETTINGS',
      goalsAtGlance: 'All Goals - Dynamic Live Tracking',
      totalIncome: 'Total Income',
      totalExpense: 'Total Expenses',
      netBalance: 'Net Balance',
      addIncome: '+ Add Income',
      addExpense: '- Add Expense',
      filterDateLabel: 'View details for date:',
      rewardTitle: '🎉 Achievement Unlocked!',
      rewardSub: 'You have achieved this goal! Treat yourself with your favorite reward to celebrate your discipline!',
      close: 'Close',
      assistantModeBadge: 'Assistant Mode: College Hub Only',
    }
  }[lang];

  // Top Nav Items (RBAC Aware)
  const allNavItems = [
    { id: 'overview', icon: <Target size={15} />, label: t.tabGoals },
    { id: 'courses', icon: <GraduationCap size={15} />, label: t.tabCourses, badge: 'SKOOL' },
    { id: 'focus', icon: <Brain size={15} />, label: t.tabFocus, badge: 'PRO' },
    { id: 'notes', icon: <Lightbulb size={15} />, label: t.tabNotes, badge: 'NEW' },
    { id: 'tasks', icon: <ListTodo size={15} />, label: t.tabTasks },
    { id: 'finance', icon: <Wallet size={15} />, label: t.tabFinance },
    { id: 'academic', icon: <BookOpen size={15} />, label: t.tabAcademic, badge: 'NEW' },
    { id: 'subscriptions', icon: <CreditCard size={15} />, label: t.tabSubscriptions },
    { id: 'wishlist', icon: <Sparkles size={15} />, label: t.tabWishlist },
    { id: 'library', icon: <BookOpen size={15} />, label: t.tabLibrary },
    { id: 'settings', icon: <Settings size={15} />, label: t.tabSettings },
  ];

  // If Assistant or Viewer role: strictly restrict navigation to Academic tab only
  const isRestrictedRole = userRole === 'assistant' || userRole === 'viewer';
  const navItems = isRestrictedRole
    ? [{ id: 'academic', icon: <BookOpen size={15} />, label: t.tabAcademic, badge: userRole === 'viewer' ? 'عرض فقط' : 'PORTAL' }]
    : allNavItems;

  // Dynamic Live Life Goals
  const lifeGoals = [
    { 
      title: 'Academic Excellence (Engineering)', 
      category: 'College', 
      progress: academicStats.percentage, 
      target: `${academicStats.completed}/${academicStats.total} محتوى منجز بالكلية`, 
      icon: '🎓' 
    },
    { 
      title: 'Skool Mastery & High-Income Skills', 
      category: 'Courses', 
      progress: coursesStats.percentage, 
      target: `${coursesStats.completedLessons}/${coursesStats.totalLessons} درس مكتمل في منصة الكورسات`, 
      icon: '🚀' 
    },
    { 
      title: 'Daily Execution & Tasks Discipline', 
      category: 'Productivity', 
      progress: tasksStats.percentage, 
      target: `${tasksStats.completed}/${tasksStats.total} مهمة منجزة`, 
      icon: '⚡' 
    },
    { 
      title: 'Financial Health & Wealth Building', 
      category: 'Wealth', 
      progress: Math.min(100, Math.max(0, Math.round((netBalance / 500000) * 100))), 
      target: `${Number(netBalance || 0).toLocaleString()} EGP رصيد صافي`, 
      icon: '💎' 
    },
    { 
      title: 'Deep Learning & AI System Building', 
      category: 'Engineering', 
      progress: 88, 
      target: 'Full Autonomous Agent Architecture', 
      icon: '🧠' 
    },
    { 
      title: 'Physical Health & Gym Discipline', 
      category: 'Lifestyle', 
      progress: 85, 
      target: '5 Workouts Weekly & Clean Fuel', 
      icon: '🔥' 
    },
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-white selection:bg-orange-500/30 selection:text-orange-200" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ── GLOBAL HIDDEN AVATAR FILE PICKER (Available in all tabs) ── */}
      <input
        type="file"
        ref={avatarFileInputRef}
        accept="image/png, image/jpeg, image/webp, image/gif"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleAvatarUpload(e.target.files[0]);
            e.target.value = '';
          }
        }}
        className="hidden"
      />
      
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
                {userRole === 'assistant' && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] border border-blue-500/30">
                    {t.assistantModeBadge}
                  </span>
                )}
                {userRole === 'viewer' && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/30">
                    حساب عرض فقط (مشاهدة فقط)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Google Calendar Direct Link Button (Opens custom or standard link) */}
            {userRole === 'owner' && (
              <a
                href={googleCalendarUrl || 'https://calendar.google.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-xs font-black text-blue-300 transition-all cursor-pointer shadow-sm"
                title="فتح تقويم Google في تبويب جديد"
              >
                <CalendarIcon size={14} className="text-blue-400" />
                <span>{t.tabGoogleCalendar}</span>
                <ExternalLink size={11} className="opacity-70" />
              </a>
            )}

            {/* Full Privacy Blur Toggle */}
            {userRole === 'owner' && (
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
            )}

            {/* Language Switcher */}
            <button
              onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-black text-gray-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              <Globe size={13} className="text-orange-400" />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Profile Avatar & Logout Pill */}
            <div className="flex items-center gap-2 p-1 pr-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div 
                onClick={() => avatarFileInputRef.current?.click()}
                className="w-7 h-7 overflow-hidden border border-orange-500/40 bg-orange-500/20 flex items-center justify-center cursor-pointer hover:border-orange-500 transition-colors shadow-[0_0_15px_rgba(255,85,0,0.5)]"
                title="اضغط لتغيير الصورة الشخصية من جهازك"
              >
                <img src={avatarUrl || "/profile-hero.png"} alt="User" className="w-full h-full object-cover" onError={(e:any)=>{e.target.src='/profile-hero.png';}} />
              </div>
              <span className="text-xs font-black text-gray-200 hidden lg:inline">{userDisplayName}</span>
              <button
                onClick={handleLogout}
                className="p-1 text-gray-400 hover:text-rose-400 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── ALL SECTION TABS NEXT TO EACH OTHER (ONE ROW, NO SCROLL ARROWS) ── */}
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
        {mainTab === 'overview' && userRole === 'owner' && (
          <div className="space-y-8">
            {/* Top Central Hero Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-orange-500/30 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(255,85,0,0.12)]">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5500]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <div 
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden border-2 border-orange-500/50 shadow-[0_0_15px_rgba(255,85,0,0.5)] bg-cover bg-center cursor-pointer p-0.5 group"
                      title="اضغط لتغيير الصورة الشخصية من جهازك"
                    >
                      <img
                        src={avatarUrl || "/profile-hero.png"}
                        alt="Mark Emad"
                        className="w-full h-full object-cover"
                        onError={(e: any) => { e.target.src = '/profile-hero.png'; }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-[1.4rem] backdrop-blur-xs">
                        <Camera size={18} className="text-orange-400" />
                        <span className="text-[9px] font-black">
                          {uploadingAvatar ? 'جاري الرفع...' : 'تغيير الصورة'}
                        </span>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-black" title="Active" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono text-xs font-black">
                      <Sparkles size={13} />
                      <span>CENTRAL OVERVIEW • MARK OS</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase">
                      GOAL TRACKER & LIFE OS
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 max-w-xl leading-relaxed">
                      تتبع أهدافك الكبرى، العادات اليومية، وساعات التركيز في واجهة موحدة.
                    </p>
                  </div>
                </div>

                {/* Date Picker Filter */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <CalendarIcon size={16} className="text-orange-400" />
                    <span>{t.filterDateLabel}</span>
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Financial Quick Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
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

            {/* ── ALL GOALS - AT A GLANCE (DYNAMIC TRACKING) ── */}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <button
                onClick={() => setMainTab('courses')}
                className="p-5 rounded-3xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 transition-all text-center group cursor-pointer"
              >
                <GraduationCap size={28} className="mx-auto text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <strong className="text-sm font-black text-white block">الكورسات والتعلم</strong>
                <span className="text-[11px] text-gray-500">Skool Learning Hub</span>
              </button>

              <button
                onClick={() => setMainTab('notes')}
                className="p-5 rounded-3xl bg-white/[0.03] hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/40 transition-all text-center group cursor-pointer"
              >
                <Lightbulb size={28} className="mx-auto text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
                <strong className="text-sm font-black text-white block">تفريغ الأفكار</strong>
                <span className="text-[11px] text-gray-500">Notion Brain Dump</span>
              </button>

              <button
                onClick={() => setMainTab('academic')}
                className="p-5 rounded-3xl bg-white/[0.03] hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/40 transition-all text-center group cursor-pointer"
              >
                <BookOpen size={28} className="mx-auto text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <strong className="text-sm font-black text-white block">الدراسة والكلية</strong>
                <span className="text-[11px] text-gray-500">المواد والمحاضرات</span>
              </button>

              <button
                onClick={() => setMainTab('finance')}
                className="p-5 rounded-3xl bg-white/[0.03] hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/40 transition-all text-center group cursor-pointer"
              >
                <Wallet size={28} className="mx-auto text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
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

        {/* ===================== 2. COURSES & LEARNING HUB (SKOOL STYLE) ===================== */}
        {mainTab === 'courses' && userRole === 'owner' && (
          <CoursesClient lang={lang} />
        )}

        {/* ===================== 3. DEEP FOCUS ===================== */}
        {mainTab === 'focus' && userRole === 'owner' && (
          <DeepFocusClient workTracking={workTracking} privacyActive={privacyActive} />
        )}


        {/* ===================== 4. BRAIN DUMP & QUICK NOTES ===================== */}
        {mainTab === 'notes' && userRole === 'owner' && (
          <BrainDumpClient lang={lang} />
        )}

        {/* ===================== 5. TASKS ===================== */}
        {mainTab === 'tasks' && userRole === 'owner' && (
          <TaskClient />
        )}


        {/* ===================== 5. FINANCE ===================== */}
        {mainTab === 'finance' && userRole === 'owner' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  <Wallet size={26} className="text-emerald-400" />
                  <span>الإدارة المالية والميزانية</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">سجل الدخل والمصروفات، متابعة التدفق النقدي وصافي الثروة</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setForm({ amount:'', currency:'EGP', description:'', date: new Date().toISOString().split('T')[0] }); setModal('income'); }}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg transition-all cursor-pointer"
                >
                  {t.addIncome}
                </button>
                <button
                  onClick={() => { setForm({ amount:'', currency:'EGP', description:'', date: new Date().toISOString().split('T')[0] }); setModal('transaction'); }}
                  className="px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs shadow-lg transition-all cursor-pointer"
                >
                  {t.addExpense}
                </button>
              </div>
            </div>

            {/* Income & Expenses List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Incomes */}
              <div className="grand-card p-6 space-y-4">
                <h3 className="text-lg font-black text-emerald-400 flex items-center gap-2">
                  <ArrowDownRight size={20} />
                  <span>مصادر الدخل</span>
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {incomes?.map((inc: any) => (
                    <div key={inc.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div>
                        <strong className="text-sm font-bold text-white block">{inc.source || inc.description}</strong>
                        <span className="text-[11px] text-gray-500 font-mono">{inc.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-black text-emerald-400">+{fmt(inc.amount)} EGP</span>
                        <button onClick={() => removeFinance('incomes', inc.id)} className="text-gray-600 hover:text-rose-400 p-1"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {(!incomes || incomes.length === 0) && <p className="text-xs text-gray-500 text-center py-6">لا توجد مصادر دخل مسجلة</p>}
                </div>
              </div>

              {/* Expenses */}
              <div className="grand-card p-6 space-y-4">
                <h3 className="text-lg font-black text-rose-400 flex items-center gap-2">
                  <ArrowUpRight size={20} />
                  <span>المصروفات الأخيرة</span>
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {transactions?.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div>
                        <strong className="text-sm font-bold text-white block">{tx.description}</strong>
                        <span className="text-[11px] text-gray-500 font-mono">{tx.category} • {tx.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-black text-rose-400">-{fmt(tx.amount)} EGP</span>
                        <button onClick={() => removeFinance('transactions', tx.id)} className="text-gray-600 hover:text-rose-400 p-1"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {(!transactions || transactions.length === 0) && <p className="text-xs text-gray-500 text-center py-6">لا توجد مصروفات مسجلة</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== 6. ACADEMIC & COLLEGE HUB ===================== */}
        {mainTab === 'academic' && (
          <AcademicClient userRole={userRole} />
        )}

        {/* ===================== 7. SUBSCRIPTIONS ===================== */}
        {mainTab === 'subscriptions' && userRole === 'owner' && (
          <SubscriptionClient />
        )}

        {/* ===================== 8. WISHLIST ===================== */}
        {mainTab === 'wishlist' && userRole === 'owner' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  <Sparkles size={26} className="text-amber-400" />
                  <span>قائمة الأمنيات والأهداف (Wishlist & Rewards)</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">حدد ما تتمنى شراءه أو تحقيقه مع نظام الاحتفال بالمكافآت الفورية</p>
              </div>

              <button
                onClick={() => { setForm({ name:'', price:'', priority:1, link:'' }); setModal('wishlist'); }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-sm shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                + إضافة أمنية جديدة
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item: any) => {
                const isAchieved = !!item.isPurchased;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    whileHover={{ y: -4 }}
                    className={`p-6 rounded-[2rem] border transition-all ${
                      isAchieved 
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
                        : 'bg-white/[0.02] border-white/5 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className={`text-lg font-black ${isAchieved ? 'text-emerald-400 line-through' : 'text-white'}`}>
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeFinance('wishlist', item.id)}
                        className="text-gray-600 hover:text-rose-400 p-1"
                        title="حذف"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between my-4 pt-3 border-t border-white/5">
                      <span className="text-xs text-gray-400">السعر التقديري:</span>
                      <strong className="text-lg font-mono font-black text-amber-400">
                        {fmt(item.price)} EGP
                      </strong>
                    </div>

                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline mb-4"
                      >
                        <ExternalLink size={12} />
                        <span>رابط المعاينة / الشراء</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleWishlistAchieved(item)}
                      className={`w-full py-3 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isAchieved 
                          ? 'bg-emerald-500 text-black shadow-lg hover:bg-emerald-400' 
                          : 'bg-white/5 hover:bg-amber-500 hover:text-black text-gray-300 border border-white/10'
                      }`}
                    >
                      <Check size={16} />
                      <span>{isAchieved ? 'تم تحقيق الهدف بنجاح ✓' : 'تعليم كمكتمل وتحقيق الأمنية 🎁'}</span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== 9. KNOWLEDGE LIBRARY ===================== */}
        {mainTab === 'library' && userRole === 'owner' && (
          <LibraryClient />
        )}

        {/* ===================== 10. SETTINGS ===================== */}
        {mainTab === 'settings' && userRole === 'owner' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 p-6 sm:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center">
                <Settings size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">إعدادات النظام والملف الشخصي</h2>
                <p className="text-xs text-gray-400">تخصيص الروابط، بيانات الحساب، الصورة الشخصية والنسخ الاحتياطي الكامل</p>
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                {profileSuccessMsg}
              </div>
            )}

            {/* 1. Profile, Notion, Google Calendar & Image Settings Form */}
            <div className="grand-card p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-black text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-orange-400" />
                <span>تحديث الروابط والبيانات الشخصية</span>
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">البريد الإلكتروني / اسم المستخدم</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">رابط تقويم Google Calendar المخصص</label>
                    <input
                      type="url"
                      value={googleCalendarUrl}
                      onChange={e => setGoogleCalendarUrl(e.target.value)}
                      placeholder="https://calendar.google.com/calendar/u/0/r"
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">رابط صفحة Notion الشخصية</label>
                    <input
                      type="url"
                      value={profileNotionUrl}
                      onChange={e => setProfileNotionUrl(e.target.value)}
                      placeholder="https://notion.so/..."
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 block">الصورة الشخصية (Avatar Photo)</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {uploadingAvatar ? (
                        <span>جاري الرفع...</span>
                      ) : (
                        <>
                          <Upload size={14} />
                          <span>📤 رفع صورة من جهازك</span>
                        </>
                      )}
                    </button>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                      placeholder="/profile-hero.png أو رابط صورة خارجي"
                      className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <span className="text-[11px] text-gray-500 block">
                    يمكنك رفع صورة من جهازك مباشرة أو وضع رابط صورة خارجي لتغيير صورتك الشخصية في كامل النظام.
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-[#FF3300] text-white font-black text-sm shadow-[0_0_25px_rgba(255,85,0,0.4)] hover:scale-105 transition-all cursor-pointer"
                  >
                    {profileSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Complete Database Backup & Restore */}
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
                    <p className="text-xs text-gray-400 mt-1">تنزيل ملف JSON يحتوي على كافة الجداول: الكورسات، المهام، المالية، المعرفة، والدراسة.</p>
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

            {/* 3. Profile Avatar Preview */}
            <div className="grand-card p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-black text-orange-400 flex items-center gap-2">
                <Sparkles size={18} />
                <span>الصورة الشخصية للنظام</span>
              </h3>
              <p className="text-xs text-gray-400">تظهر صورتك في شاشة تسجيل الدخول والشريط العلوي والبطاقات</p>

              <div className="flex items-center gap-6 pt-2">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-500 shadow-lg bg-black/60 shrink-0">
                  <img src={avatarUrl || "/profile-hero.png"} alt="Hero Avatar" className="w-full h-full object-cover" onError={(e:any)=>{e.target.src='/icon-512.png';}} />
                </div>
                <div>
                  <span className="text-xs text-emerald-400 font-bold block mb-1">✓ الصورة النشطة متوافقة ومحمية</span>
                  <span className="text-[11px] text-gray-500">يمكنك تعديل الرابط بالأعلى لتغيير الصورة في كامل أرجاء النظام.</span>
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
