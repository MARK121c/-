'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PauseCircle, 
  XCircle, 
  ArrowRight,
  TrendingUp,
  Calendar,
  ShieldCheck,
  ChevronRight,
  DollarSign
} from 'lucide-react';

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
  status: 'active' | 'upcoming' | 'due' | 'paid' | 'paused' | 'canceled';
  isEssential: boolean;
  linkedAccount: string;
}

const api = {
  getSubscriptions: () => fetch('/api/subscriptions', { cache: 'no-store' }).then(r => r.json()),
  createSubscription: (data: any) => fetch('/api/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  deleteSubscription: (id: number) => fetch(`/api/subscriptions?id=${id}`, { method: 'DELETE' }),
  confirmPayment: (id: number) => fetch('/api/subscriptions/confirm', { method: 'POST', body: JSON.stringify({ subscriptionId: id }) }),
};

export default function SubscriptionClient() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'business',
    amount: '',
    currency: 'EGP',
    billingCycle: 'monthly',
    billingInterval: 1,
    startDate: new Date().toISOString().split('T')[0],
    isEssential: true,
    linkedAccount: 'cash'
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSubscriptions();
      setSubscriptions(data.subscriptions || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfirmPaid = async (id: number) => {
    try {
      const res = await api.confirmPayment(id);
      if (res.ok) {
        await loadData(); // Reload to update status and next date
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createSubscription({
        ...form,
        amount: parseFloat(form.amount)
      });
      if (res.ok) {
        setShowAddModal(false);
        setForm({
          name: '',
          category: 'business',
          amount: '',
          currency: 'EGP',
          billingCycle: 'monthly',
          billingInterval: 1,
          startDate: new Date().toISOString().split('T')[0],
          isEssential: true,
          linkedAccount: 'cash'
        });
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) return;
    try {
      await api.deleteSubscription(id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Stats Calculation
  const monthlyTotal = subscriptions
    .filter(s => s.status !== 'canceled' && s.status !== 'paused')
    .reduce((acc, s) => {
      let monthlyAmount = s.amount;
      if (s.billingCycle === 'yearly') {
        monthlyAmount = s.amount / 12;
      } else if (s.billingCycle === 'custom') {
        monthlyAmount = s.amount / s.billingInterval;
      }
      return acc + monthlyAmount;
    }, 0);

  const dueSubscriptions = subscriptions.filter(s => s.status === 'due');
  const upcomingSubscriptions = subscriptions.filter(s => s.status === 'upcoming');

  return (
    <div className="text-gray-100 min-h-screen pb-20">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -mr-20 -mt-20" />
          <div className="relative z-10">
            <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
              <CreditCard className="text-emerald-400" size={32} />
              نظام الاشتراكات الذكي
            </h1>
            <p className="text-gray-400 text-lg">تحكم كامل في مدفوعاتك الدورية واكتشف الهدر المالي.</p>
          </div>
          <div className="flex gap-8 mt-8 border-t border-gray-800 pt-8 relative z-10">
            <div>
              <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">العبء الشهري الحقيقي</p>
              <p className="text-3xl font-black text-white">{monthlyTotal.toLocaleString()} <span className="text-sm opacity-40">EGP</span></p>
            </div>
            <div className="w-px h-12 bg-gray-800" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">الاشتراكات النشطة</p>
              <p className="text-3xl font-black text-emerald-400">{subscriptions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col justify-between">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <TrendingUp className="text-purple-400" size={20} />
             Subscription Score
          </h2>
          <div className="flex items-center gap-4">
             <div className="flex-1 bg-gray-800 h-3 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-3/4 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
             </div>
             <span className="font-black text-xl">75%</span>
          </div>
          <p className="text-xs text-gray-500 mt-4 leading-relaxed">
            النظام يشير إلى أن 25% من اشتراكاتك يمكن تحسينها أو إلغاؤها بناءً على الأولوية.
          </p>
        </div>
      </div>

      {/* Due Alerts Section */}
      {dueSubscriptions.length > 0 && (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
           <h3 className="text-rose-400 font-bold mb-4 flex items-center gap-2 text-xl px-2">
             <AlertCircle size={22}/> مدفوعات مستحقة (Action Required)
           </h3>
           <div className="grid grid-cols-1 gap-4">
              {dueSubscriptions.map(s => (
                <div key={s.id} className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_10px_40px_rgba(244,63,94,0.1)]">
                   <div className="flex items-center gap-6 text-right w-full md:w-auto">
                      <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 border border-rose-500/20">
                         <DollarSign size={28} />
                      </div>
                      <div>
                         <h4 className="text-2xl font-black text-white">{s.name}</h4>
                         <p className="text-rose-400/70 font-bold uppercase tracking-tight text-xs">استحق في: {new Date(s.nextPaymentDate).toLocaleDateString('ar-EG')}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-left md:text-right">
                         <p className="text-2xl font-black text-white">{s.amount.toLocaleString()} <span className="text-sm opacity-40">{s.currency}</span></p>
                         <p className="text-xs text-gray-500">سيتم الخصم من: {s.linkedAccount}</p>
                      </div>
                      <button 
                         onClick={() => handleConfirmPaid(s.id)}
                         className="bg-rose-500 hover:bg-rose-400 text-white font-black px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-[0_10px_30px_rgba(244,63,94,0.3)] flex items-center gap-2"
                      >
                         <CheckCircle2 size={20} />
                         تأكيد الدفع اليدوي
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex justify-between items-center mb-8 px-2">
         <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black">جميع الاشتراكات</h2>
            <div className="bg-gray-800/50 px-3 py-1 rounded-full text-xs font-black text-gray-500 border border-gray-700">دليل السحب</div>
         </div>
         <button 
           onClick={() => setShowAddModal(true)}
           className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-xl"
         >
           <Plus size={20} />
           إضافة اشتراك
         </button>
      </div>

      {/* Grid of Subscriptions */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map(s => (
            <div key={s.id} className="bg-gray-900/50 border border-gray-800 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-gray-600 transition-all relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    s.status === 'upcoming' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    s.status === 'due' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-gray-500/10 text-gray-500 border-gray-500/20'
                  }`}>
                    {s.status}
                  </div>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={18} />
                  </button>
               </div>

               <div className="mb-8">
                  <h3 className="text-3xl font-black text-white mb-2 leading-tight">{s.name}</h3>
                  <p className="text-gray-500 text-sm font-bold flex items-center gap-2">
                    <Calendar size={14} />
                    الدفع القادم: {new Date(s.nextPaymentDate).toLocaleDateString('ar-EG')}
                  </p>
               </div>

               <div className="bg-gray-950/50 rounded-3xl p-6 border border-gray-800 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-600 font-black uppercase mb-1">{s.billingCycle === 'monthly' ? 'شهري' : s.billingCycle === 'yearly' ? 'سنوي' : 'مخصص'}</p>
                    <p className="text-3xl font-black text-white">{s.amount.toLocaleString()} <span className="text-sm opacity-40">{s.currency}</span></p>
                  </div>
                  <div className="flex flex-col items-end">
                    {s.isEssential ? (
                       <ShieldCheck className="text-cyan-500/40" size={24} />
                    ) : (
                       <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] text-gray-600 font-black">?</div>
                    )}
                  </div>
               </div>
            </div>
          ))}
          {subscriptions.length === 0 && (
            <div className="col-span-full bg-gray-900 border border-gray-800 border-dashed rounded-[2.5rem] py-20 text-center">
               <div className="flex flex-col items-center gap-4 text-gray-600">
                  <Clock size={48} />
                  <p className="text-xl font-bold">لا يوجد اشتراكات مسجلة حالياً.</p>
               </div>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black">إضافة اشتراك جديد</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className="text-sm font-black text-gray-500 uppercase mb-2 block">اسم الاشتراك</label>
                  <input required className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-xl font-black outline-none focus:border-emerald-500 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Netflix / Spotify / ..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-black text-gray-500 uppercase mb-2 block">المبلغ</label>
                    <input required type="number" className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-xl font-black outline-none focus:border-emerald-500 transition-all text-center" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-sm font-black text-gray-500 uppercase mb-2 block">دورة الفوترة</label>
                    <select className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-lg font-black outline-none focus:border-emerald-500 transition-all appearance-none" value={form.billingCycle} onChange={e => setForm({...form, billingCycle: e.target.value})}>
                      <option value="monthly">شهري</option>
                      <option value="yearly">سنوي</option>
                      <option value="custom">مخصص (أيام)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-sm font-black text-gray-500 uppercase mb-2 block">تاريخ البدء</label>
                    <input required type="date" className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-lg font-black outline-none focus:border-emerald-500 transition-all" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-black text-gray-500 uppercase mb-2 block">الحساب المرتبط</label>
                    <select className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-lg font-black outline-none focus:border-emerald-500 transition-all" value={form.linkedAccount} onChange={e => setForm({...form, linkedAccount: e.target.value})}>
                      <option value="cash">كاش</option>
                      <option value="visa">فيزا</option>
                      <option value="instapay">إنستا باي</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-800/30 p-4 rounded-2xl border border-gray-800">
                   <input type="checkbox" id="essential" className="w-5 h-5 rounded border-gray-700 bg-gray-800" checked={form.isEssential} onChange={e => setForm({...form, isEssential: e.target.checked})} />
                   <label htmlFor="essential" className="text-sm font-black text-gray-300">هل هذا الاشتراك ضروري (معيشي)؟</label>
                </div>

                <button type="submit" className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black text-xl font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
                  حفظ الاشتراك
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
