"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Shield, Eye, EyeOff, Globe, LogIn, Smartphone, Laptop, Apple, X, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/profile-hero.png');
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    // Check if kicked out due to 2-device session limit
    if (typeof window !== 'undefined' && window.location.search.includes('kicked=true')) {
      setError('⚠️ تم تسجيل خروج هذا الجهاز تلقائياً بسبب تسجيل الدخول من جهاز جديد (الحد الأقصى المسموح به هو جهازين فقط في نفس الوقت).');
    }

    // Load avatar set from inside the system (localStorage or profile API)
    try {
      const saved = localStorage.getItem('user_avatar');
      if (saved) setAvatarUrl(saved);
    } catch {}

    fetch('/api/settings/profile')
      .then(r => r.json())
      .then(data => {
        if (data.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
          try { localStorage.setItem('user_avatar', data.avatarUrl); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const isRtl = lang === 'ar';

  const t = {
    ar: {
      badge: 'MARK OS V4.0',
      title: 'GOAL TRACKER & LIFE OS',
      subtitle: 'نظام إدارة المهام والإنتاجية والكورسات المتكامل',
      emailLabel: 'البريد الإلكتروني أو اسم المستخدم',
      emailPlaceholder: 'name@domain.com أو admin',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      signInBtn: 'تسجيل الدخول للنظام',
      loadingBtn: 'جاري التحقق...',
      serverError: 'بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى',
      footer: 'MARK EMAD OS • LIFE PLATFORM',
    },
    en: {
      badge: 'MARK OS V4.0',
      title: 'GOAL TRACKER & LIFE OS',
      subtitle: 'Integrated Personal Operating System & Learning Hub',
      emailLabel: 'Email or Username',
      emailPlaceholder: 'name@domain.com or admin',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      signInBtn: 'Sign In to System',
      loadingBtn: 'Authenticating...',
      serverError: 'Invalid credentials, please try again.',
      footer: 'MARK EMAD OS • LIFE PLATFORM',
    }
  }[lang];

  // Handle Standard Email/Username + Password Login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await response.json();
      if (response.ok && (data.success || data.token)) {
        if (data.token) localStorage.setItem('academic_token', data.token);
        if (data.user) {
          localStorage.setItem('academic_user', JSON.stringify(data.user));
          if (data.user.role === 'assistant' || data.user.role === 'viewer') {
            localStorage.setItem('mainTab', 'academic');
          }
        }
        window.location.href = '/';
      } else {
        setError(data.error || t.serverError);
      }
    } catch {
      setError(t.serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-[#050608] text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden selection:bg-orange-500/30 selection:text-orange-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#FF5500]/12 rounded-full blur-[140px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-[#FF3300]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Controls */}
      <header className="w-full flex items-center justify-between z-20 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-[#FF3300] flex items-center justify-center text-white shadow-[0_0_25px_rgba(255,85,0,0.5)]">
            <Shield size={20} />
          </div>
          <span className="font-black text-sm tracking-widest text-orange-400 uppercase font-mono">MARK OS</span>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-xs font-bold text-orange-300 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(255,85,0,0.15)]"
          >
            <Smartphone size={15} className="text-orange-400" />
            <span>{lang === 'ar' ? '📱 تنزيل التطبيق (آيفون • كمبيوتر)' : '📱 Install App'}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 bg-white/[0.03] text-xs font-bold text-gray-300 hover:text-white hover:border-orange-500/40 transition-all cursor-pointer"
          >
            <Globe size={15} className="text-orange-400" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </header>

      {/* Main Full-Page Stage */}
      <main className="w-full max-w-6xl mx-auto my-auto py-8 z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left/Hero Image Side: Photo on Radiant Solid Orange Background (Without Circular Frame) */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <div className="relative flex items-center justify-center">
            {/* Ambient Orange Glow Behind */}
            <div className="absolute -inset-6 bg-gradient-to-tr from-[#FF5500] to-[#FF3300] rounded-[3rem] blur-3xl opacity-45 pointer-events-none animate-pulse" />

            {/* Glowing Orange Backdrop Frame (No Circle) */}
            <div className="relative w-64 h-84 sm:w-80 sm:h-[420px] rounded-[2.5rem] p-1 bg-gradient-to-tr from-[#FF6600] via-[#FF3300] to-[#FFAA00] shadow-[0_0_60px_rgba(255,85,0,0.55)] overflow-hidden">
              {/* Inner Orange Gradient Canvas */}
              <div className="w-full h-full rounded-[2.3rem] overflow-hidden bg-gradient-to-b from-[#FF5500] via-[#c03900] to-[#120703] flex items-end justify-center relative">
                <img
                  src={avatarUrl}
                  alt="Mark Emad"
                  className="w-full h-full object-cover object-top"
                  onError={(e: any) => { e.target.src = '/profile-hero.png'; }}
                />
                
                {/* Sleek bottom shadow gradient for depth */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Right/Form Side */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8 text-center lg:text-start">
          
          {/* Header Texts */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono text-xs font-black">
              <Shield size={13} />
              <span>{t.badge}</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase">
              {t.title}
            </h1>
            
            <p className="text-gray-400 text-sm sm:text-base font-medium max-w-lg mx-auto lg:mx-0">
              {t.subtitle}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold max-w-md mx-auto lg:mx-0"
            >
              {error}
            </motion.div>
          )}

          {/* Login Form */}
          <div className="max-w-md mx-auto lg:mx-0 w-full space-y-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Email / Username Field */}
              <div className="space-y-1.5 text-start">
                <label className="text-xs font-bold text-gray-300 block">{t.emailLabel}</label>
                <div className="relative">
                  <Mail className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-500`} size={18} />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className={`w-full py-3.5 ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} rounded-2xl bg-white/[0.04] border border-white/10 text-sm font-bold text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 text-start">
                <label className="text-xs font-bold text-gray-300 block">{t.passwordLabel}</label>
                <div className="relative">
                  <Lock className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-500`} size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className={`w-full py-3.5 ${isRtl ? 'pr-12 pl-12' : 'pl-12 pr-12'} rounded-2xl bg-white/[0.04] border border-white/10 text-sm font-bold text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Sign In Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-[#FF3300] text-white font-black text-sm shadow-[0_0_30px_rgba(255,85,0,0.4)] hover:shadow-[0_0_45px_rgba(255,85,0,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                <span>{loading ? t.loadingBtn : t.signInBtn}</span>
              </button>
            </form>
          </div>

        </div>
      </main>

      {/* Clean Footer */}
      <footer className="w-full text-center text-[11px] font-mono text-gray-600 z-20">
        {t.footer} • {new Date().getFullYear()}
      </footer>

      {/* App Installation Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-[2.5rem] border border-orange-500/30 bg-[#0c0d12] p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center">
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">تثبيت MARK OS كتطبيق مستقل</h3>
                  <p className="text-xs text-gray-400">يعمل بدون متصفح وبكامل الشاشة على جميع الأجهزة</p>
                </div>
              </div>
              <button onClick={() => setShowInstallModal(false)} className="p-2 text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-start">
              {/* iOS / iPhone */}
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <Apple size={18} className="text-white" />
                  <span>آيفون وآيباد (iPhone / iPad - Safari):</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-gray-300 space-y-1.5 leading-relaxed">
                  <li>افتح هذا الرابط في متصفح <strong>Safari</strong> على الآيفون.</li>
                  <li>اضغط على زر المشاركة <strong>Share (مربع بسهم لأعلى ⎋)</strong> في أسفل الشاشة.</li>
                  <li>انزل بالقائمة واختر <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen ➕)</strong>.</li>
                  <li>اضغط <strong>"إضافة" (Add)</strong> في أعلى الزاوية. سيظهر التطبيق فوراً بأيقونته الرسمية على شاشة هاتفك ويعمل كتطبيق كامل!</li>
                </ol>
              </div>

              {/* Android */}
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <Smartphone size={18} />
                  <span>أندرويد (Android - Chrome):</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-gray-300 space-y-1.5 leading-relaxed">
                  <li>افتح الموقع في متصفح <strong>Chrome</strong>.</li>
                  <li>اضغط على أيقونة الثلاث نقاط (⋮) في أعلى المتصفح.</li>
                  <li>اختر <strong>"تثبيت التطبيق" (Install App)</strong> أو "إضافة إلى الشاشة الرئيسية".</li>
                </ol>
              </div>

              {/* Mac & Windows */}
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-black text-sm">
                  <Laptop size={18} />
                  <span>الكمبيوتر واللابتوب (Mac & Windows):</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  في متصفح Chrome أو Edge، اضغط على أيقونة التثبيت <strong>(Install ⊕)</strong> الموجودة مباشرة في شريط عنوان الموقع بالأعلى لتشغيله في نافذة مستقلة سريعة وخفيفة.
                </p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs transition-all"
              >
                فهمت، إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
