"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ChevronRight, Activity, Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        setError('بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 selection:bg-blue-500/30 overflow-hidden" dir="rtl">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/5 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-10 rounded-[3rem] border border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.6)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100" />
          
          <div className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex p-4 rounded-3xl bg-blue-600/10 border border-blue-600/20 mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            >
              <Shield className="w-8 h-8 text-blue-500" />
            </motion.div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tighter">
              MARK <span className="text-blue-500">OS</span>
            </h1>
            <p className="text-sm text-gray-500 font-medium">نظام التحكم المركزي - يرجى إثبات الهوية</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 mr-2 uppercase tracking-[3px]">Identity (Email)</label>
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@os.cloud"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white placeholder:text-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-bold text-sm"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 mr-2 uppercase tracking-[3px]">Security Code</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white placeholder:text-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-bold text-sm"
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-xs font-black text-center bg-red-400/5 py-3 rounded-2xl border border-red-400/10 uppercase tracking-tighter"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-wait shadow-[0_10px_30px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.4)]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-widest text-sm">Initialize Access</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center space-y-2 opacity-30">
            <p className="text-[10px] font-black uppercase tracking-[4px] text-white">Encrypted Terminal v3.0</p>
            <p className="text-[9px] text-gray-500">All access attempts are logged and monitored.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
