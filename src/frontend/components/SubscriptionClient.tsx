'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Trash2, Calendar, AlertCircle, Clock, ShieldCheck, Check } from 'lucide-react';

interface Subscription {
  id: number;
  name: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: string;
  billingInterval: number;
  startDate: string;
  nextPaymentDate: string;
  status: string;
  isEssential: boolean;
  linkedAccount: string;
}

export default function SubscriptionClient() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  const [form, setForm] = useState({
    name: '',
    category: 'business',
    amount: '',
    currency: 'EGP',
    billingCycle: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    isEssential: true,
    linkedAccount: 'cash',
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    try {
      const res = await fetch('/api/subscriptions');
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.amount) return;

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          amount: parseFloat(form.amount),
          currency: form.currency,
          billingCycle: form.billingCycle,
          startDate: form.startDate,
          isEssential: form.isEssential,
          linkedAccount: form.linkedAccount,
        }),
      });

      if (res.ok) {
        setForm({
          name: '',
          category: 'business',
          amount: '',
          currency: 'EGP',
          billingCycle: 'monthly',
          startDate: new Date().toISOString().split('T')[0],
          isEssential: true,
          linkedAccount: 'cash',
        });
        setShowForm(false);
        fetchSubscriptions();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteSubscription(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) return;
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    try {
      await fetch(`/api/subscriptions?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
      fetchSubscriptions();
    }
  }

  // Cost calculations
  const totalMonthly = subscriptions.reduce((sum, s) => {
    if (s.billingCycle === 'yearly') return sum + (s.amount / 12);
    if (s.billingCycle === 'weekly') return sum + (s.amount * 4.33);
    return sum + (s.amount || 0);
  }, 0);

  const totalAnnual = totalMonthly * 12;

  const getDaysLeft = (targetDate: string) => {
    if (!targetDate) return 999;
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const categories = ['all', ...Array.from(new Set(subscriptions.map(s => s.category).filter(Boolean)))];

  const filtered = filterCategory === 'all'
    ? subscriptions
    : subscriptions.filter(s => s.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <CreditCard size={26} className="text-orange-400" />
            <span>الاشتراكات والخدمات الدورية</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">تتبع كلفة وتواريخ تجديد اشتراكاتك الشهرية والسنوية</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-[#FF3300] text-white font-black text-sm shadow-[0_0_20px_rgba(255,85,0,0.3)] hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Plus size={18} />
          <span>+ اشتراك جديد</span>
        </button>
      </div>

      {/* 3 Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-1">
          <span className="text-xs text-gray-400 font-bold block">إجمالي الاشتراكات النشطة</span>
          <strong className="text-2xl font-black text-white font-mono">{subscriptions.length}</strong>
        </div>
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-1">
          <span className="text-xs text-gray-400 font-bold block">التكلفة الشهرية التقديرية</span>
          <strong className="text-2xl font-black text-orange-400 font-mono">
            {Math.round(totalMonthly).toLocaleString('en-US')} <span className="text-xs text-gray-500">EGP</span>
          </strong>
        </div>
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-1">
          <span className="text-xs text-gray-400 font-bold block">التكلفة السنوية الإجمالية</span>
          <strong className="text-2xl font-black text-emerald-400 font-mono">
            {Math.round(totalAnnual).toLocaleString('en-US')} <span className="text-xs text-gray-500">EGP</span>
          </strong>
        </div>
      </div>

      {/* Add Subscription Form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 rounded-3xl bg-white/[0.04] border border-orange-500/30 space-y-4 shadow-2xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">اسم الاشتراك *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="مثلاً: ChatGPT Plus / Netflix"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">المبلغ *</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">دورة الدفع</label>
              <select
                value={form.billingCycle}
                onChange={e => setForm({ ...form, billingCycle: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#0c0d12] border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
              >
                <option value="monthly">شهري (Monthly)</option>
                <option value="yearly">سنوي (Yearly)</option>
                <option value="weekly">أسبوعي (Weekly)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">تاريخ التجديد / البداية</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#0c0d12] border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 border border-white/10 hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-black text-xs shadow-lg hover:bg-orange-400"
            >
              حفظ الاشتراك
            </button>
          </div>
        </motion.form>
      )}

      {/* Category Pills */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                filterCategory === cat ? 'bg-orange-500 text-white shadow-lg' : 'bg-white/[0.03] text-gray-400 border border-white/5 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'جميع الاشتراكات' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Subscriptions Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(sub => {
          const daysLeft = getDaysLeft(sub.nextPaymentDate);
          const isSoon = daysLeft >= 0 && daysLeft <= 7;
          const isCritical = daysLeft >= 0 && daysLeft <= 3;

          return (
            <motion.div
              key={sub.id}
              whileHover={{ y: -3 }}
              className={`p-6 rounded-3xl bg-white/[0.02] border transition-all space-y-4 group ${
                isCritical 
                  ? 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.2)]' 
                  : isSoon 
                  ? 'border-orange-500/40 shadow-[0_0_20px_rgba(255,85,0,0.15)]' 
                  : 'border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-white">{sub.name}</h3>
                  <span className="text-[11px] text-gray-500 font-mono uppercase">{sub.category} • {sub.billingCycle}</span>
                </div>
                <button
                  onClick={() => deleteSubscription(sub.id)}
                  className="p-1.5 text-gray-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="حذف الاشتراك"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Amount & Renewal Alert */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div>
                  <span className="text-xs text-gray-400 block font-bold">التكلفة</span>
                  <strong className="text-2xl font-black text-orange-400 font-mono">
                    {sub.amount} <span className="text-xs text-gray-500">{sub.currency || 'EGP'}</span>
                  </strong>
                </div>

                <div className="text-end">
                  <span className="text-xs text-gray-400 block font-bold">التجديد القادم</span>
                  <span className={`text-xs font-mono font-bold block ${isCritical ? 'text-rose-400' : isSoon ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {sub.nextPaymentDate || sub.startDate}
                  </span>
                  {daysLeft >= 0 && daysLeft <= 30 && (
                    <span className={`text-[10px] font-bold block mt-0.5 ${isCritical ? 'text-rose-400 animate-pulse' : isSoon ? 'text-orange-400' : 'text-gray-500'}`}>
                      {daysLeft === 0 ? '⚠️ اليوم التجديد' : `متبقي ${daysLeft} يوم`}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-500">
          <CreditCard size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-base font-bold">لا توجد اشتراكات مضافة بعد</p>
          <p className="text-xs mt-1">أضف اشتراكاتك لتتبع المواعيد والتكاليف تلقائياً</p>
        </div>
      )}
    </div>
  );
}
