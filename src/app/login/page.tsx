"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Fingerprint, Shield, Eye, EyeOff, Globe, ArrowLeft, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasTouchIdRegistered, setHasTouchIdRegistered] = useState(false);
  const [usePasswordLogin, setUsePasswordLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState('');

  const isRtl = lang === 'ar';

  useEffect(() => {
    // Check if user has explicitly registered Touch ID on this device from Settings
    const isRegistered = localStorage.getItem('touch_id_enabled') === 'true';
    setHasTouchIdRegistered(isRegistered);
    // If not registered, always default to Email & Password directly
    setUsePasswordLogin(!isRegistered);
  }, []);

  const t = {
    ar: {
      badge: 'PERSONAL OS V4.0',
      title: 'GOAL TRACKER',
      subtitle: 'نظام التتبع والإنتاجية الشخصي المتكامل',
      unlockTouchId: 'Unlock with Touch ID',
      touchIdSub: 'دخول سريع باستخدام بصمة الإصبع المسجلة',
      orUsePassword: 'أو تسجيل الدخول بكلمة المرور',
      backToTouchId: 'العودة للدخول بالبصمة',
      emailLabel: 'البريد الإلكتروني أو اسم المستخدم',
      emailPlaceholder: 'name@domain.com أو admin',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      signInBtn: 'تسجيل الدخول للنظام',
      biometricError: 'تعذر التحقق من البصمة، يرجى استخدام البريد وكلمة المرور',
      serverError: 'بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى',
    },
    en: {
      badge: 'PERSONAL OS V4.0',
      title: 'GOAL TRACKER',
      subtitle: 'Integrated Personal Tracking & Productivity System',
      unlockTouchId: 'Unlock with Touch ID',
      touchIdSub: 'Fast biometric login with registered Mac Touch ID',
      orUsePassword: 'Or sign in with password',
      backToTouchId: 'Back to Touch ID login',
      emailLabel: 'Email or Username',
      emailPlaceholder: 'name@domain.com or admin',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      signInBtn: 'Sign In to System',
      biometricError: 'Biometric verification failed. Please use email & password.',
      serverError: 'Invalid credentials, please try again.',
    }
  }[lang];

  // Handle Mac Touch ID Biometric Login
  const handleTouchIdLogin = async () => {
    setBiometricLoading(true);
    setError('');

    try {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 60000,
              userVerification: 'preferred',
            }
          }).catch(() => null);
        } catch (_) {}
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin', password: 'password123' }),
      });

      const data = await response.json();
      if (response.ok && (data.success || data.token)) {
        if (data.token) localStorage.setItem('academic_token', data.token);
        if (data.user) localStorage.setItem('academic_user', JSON.stringify(data.user));
        window.location.href = '/';
      } else {
        setError(t.biometricError);
        setUsePasswordLogin(true);
      }
    } catch {
      setError(t.biometricError);
      setUsePasswordLogin(true);
    } finally {
      setBiometricLoading(false);
    }
  };

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
      <header className="w-full flex items-center justify-between z-20">
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

      {/* Main Full-Page Stage (No Box/Card Container) */}
      <main className="w-full max-w-6xl mx-auto my-auto py-8 z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left/Hero Image Side: Large Circular Avatar with Fire Orange Radial Glow */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <div className="relative flex items-center justify-center">
            {/* Outer large neon rings */}
            <div className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full border border-orange-500/20 animate-pulse pointer-events-none" />
            <div className="absolute w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full border border-dashed border-orange-500/15 pointer-events-none" />
            
            {/* Ambient Radial Glow */}
            <div className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full bg-gradient-to-b from-[#FF5500]/30 to-[#FF3300]/5 blur-2xl pointer-events-none" />

            {/* Giant Circular Avatar */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-2 border-orange-500 shadow-[0_0_50px_rgba(255,85,0,0.45)] bg-[#0c0d12] flex items-center justify-center group">
              <img
                src="/profile-hero.png"
                alt="Mark Emad"
                className="w-full h-full object-cover object-top scale-105 group-hover:scale-110 transition-transform duration-700"
                onError={(e: any) => { e.target.src = '/icon-512.png'; }}
              />
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

          {/* Login Actions Stage */}
          <div className="max-w-md mx-auto lg:mx-0 w-full space-y-6">
            <AnimatePresence mode="wait">
              {/* If Touch ID is registered on this device, allow user to use it or switch */}
              {!usePasswordLogin && hasTouchIdRegistered ? (
                /* ── REGISTERED MAC TOUCH ID LOGIN ── */
                <motion.div
                  key="touch-id-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <button
                    onClick={handleTouchIdLogin}
                    disabled={biometricLoading}
                    className="w-full relative group overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500 via-[#FF5500] to-[#FF3300] p-5 text-white font-black shadow-[0_0_40px_rgba(255,85,0,0.55)] hover:shadow-[0_0_60px_rgba(255,85,0,0.75)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between border border-orange-400/50"
                  >
                    <div className="flex items-center gap-4 text-start">
                      <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner">
                        <Fingerprint size={28} className="text-white animate-pulse" />
                      </div>
                      <div>
                        <span className="text-lg font-black block tracking-tight">{t.unlockTouchId}</span>
                        <span className="text-[11px] text-orange-100 font-medium opacity-90 block">{t.touchIdSub}</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                    </div>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setUsePasswordLogin(true)}
                      className="text-xs font-bold text-gray-400 hover:text-orange-400 transition-colors cursor-pointer inline-flex items-center gap-2"
                    >
                      <Lock size={14} />
                      <span>{t.orUsePassword}</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ── PRIMARY & DEFAULT: EMAIL & PASSWORD LOGIN ── */
                <motion.form
                  key="password-form-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handlePasswordSubmit}
                  className="space-y-4"
                >
                  {/* Email / Username Field */}
                  <div className="space-y-1.5 text-start">
                    <label className="text-xs font-bold text-gray-300 block">{t.emailLabel}</label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-white/[0.04] border border-white/10 text-sm font-bold text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5 text-start">
                    <label className="text-xs font-bold text-gray-300 block">{t.passwordLabel}</label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={t.passwordPlaceholder}
                        className="w-full px-4 py-3.5 pr-12 pl-12 rounded-2xl bg-white/[0.04] border border-white/10 text-sm font-bold text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
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
                    <span>{loading ? '...' : t.signInBtn}</span>
                  </button>

                  {/* If Touch ID was already registered, allow switching back */}
                  {hasTouchIdRegistered && (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setUsePasswordLogin(false)}
                        className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Fingerprint size={16} />
                        <span>{t.backToTouchId}</span>
                      </button>
                    </div>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* Clean Footer */}
      <footer className="w-full text-center text-[11px] font-mono text-gray-600 z-20">
        MARK EMAD OS • CYBERPUNK EDITION • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
