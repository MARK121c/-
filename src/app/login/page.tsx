"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Shield, Eye, EyeOff, Globe, LogIn, Camera, Upload, Check } from 'lucide-react';

export default function LoginPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/profile-hero.png');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check saved avatar from localStorage or backend
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

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setAvatarUrl(data.url);
        try { localStorage.setItem('user_avatar', data.url); } catch {}
        // Also sync profile in backend
        await fetch('/api/settings/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: data.url }),
        }).catch(() => {});
      }
    } catch {
      // Keep local preview if offline
    } finally {
      setUploadingAvatar(false);
    }
  };

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
        if (data.user) localStorage.setItem('academic_user', JSON.stringify(data.user));
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
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#FF5500]/10 rounded-full blur-[140px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-[#FF3300]/8 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Controls */}
      <header className="w-full flex items-center justify-between z-20 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-[#FF3300] flex items-center justify-center text-white shadow-[0_0_25px_rgba(255,85,0,0.5)]">
            <Shield size={20} />
          </div>
          <span className="font-black text-sm tracking-widest text-orange-400 uppercase font-mono">MARK OS</span>
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 bg-white/[0.03] text-xs font-bold text-gray-300 hover:text-white hover:border-orange-500/40 transition-all cursor-pointer"
        >
          <Globe size={15} className="text-orange-400" />
          <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </header>

      {/* Main Full-Page Stage (Direct on page, no boxed card container) */}
      <main className="w-full max-w-6xl mx-auto my-auto py-8 z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left/Hero Image Side: Large Circular Avatar with Fire Orange Radial Glow & Interactive Upload */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center gap-4">
          <div className="relative flex items-center justify-center">
            {/* Outer neon rings */}
            <div className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full border border-orange-500/20 animate-pulse pointer-events-none" />
            <div className="absolute w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full border border-dashed border-orange-500/15 pointer-events-none" />
            
            {/* Ambient Radial Glow */}
            <div className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full bg-gradient-to-b from-[#FF5500]/30 to-[#FF3300]/5 blur-2xl pointer-events-none" />

            {/* Hidden File Input */}
            <input
              type="file"
              ref={avatarFileRef}
              accept="image/*"
              onChange={handleAvatarFile}
              className="hidden"
            />

            {/* Giant Circular Avatar with Clickable Edit Overlay */}
            <div 
              onClick={() => avatarFileRef.current?.click()}
              className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-2 border-orange-500 shadow-[0_0_50px_rgba(255,85,0,0.45)] bg-[#0c0d12] flex items-center justify-center group cursor-pointer"
              title="اضغط لتغيير الصورة من جهازك"
            >
              <img
                src={avatarUrl}
                alt="Mark Emad"
                className="w-full h-full object-cover object-top scale-105 group-hover:scale-110 transition-transform duration-700"
                onError={(e: any) => { e.target.src = '/profile-hero.png'; }}
              />

              {/* Hover Edit Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-xs text-white">
                <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                  <Camera size={22} />
                </div>
                <span className="text-xs font-black">
                  {uploadingAvatar ? 'جاري التحديث...' : 'تغيير الصورة من جهازك'}
                </span>
                <span className="text-[10px] text-gray-300">اضغط لاختيار صورة</span>
              </div>
            </div>

            {/* Quick Upload Badge Button */}
            <button
              type="button"
              onClick={() => avatarFileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 sm:bottom-0 right-4 sm:right-6 z-20 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-[#FF3300] hover:scale-105 text-white text-xs font-black shadow-[0_0_20px_rgba(255,85,0,0.6)] cursor-pointer"
            >
              <Camera size={14} />
              <span>{uploadingAvatar ? 'جاري الرفع...' : 'تعديل الصورة'}</span>
            </button>
          </div>

          <span className="text-[11px] text-gray-400 font-bold">
            💡 يمكنك الضغط على الدائرة لتغيير الصورة الشخصية من جهازك مباشرة
          </span>
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
    </div>
  );
}
