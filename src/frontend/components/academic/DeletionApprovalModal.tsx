'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, CheckCircle, XCircle, Trash2, Clock, User, AlertTriangle,
  RefreshCw, Check, X, Shield
} from 'lucide-react';

interface DeletionRequest {
  id: number;
  item_type: string;
  item_id: number;
  item_title: string;
  requested_by: string;
  requested_by_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

interface DeletionApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DeletionApprovalModal({
  isOpen,
  onClose,
  onSuccess
}: DeletionApprovalModalProps) {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all'>('pending');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/academic/deletions');
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
    setProcessingId(requestId);
    try {
      const res = await fetch('/api/academic/deletions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
        if (onSuccess) onSuccess();
      } else {
        alert(data.error || 'حدث خطأ أثناء معالجة الطلب');
      }
    } catch {
      alert('فشل الاتصال بالخادم');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'pending') return r.status === 'pending';
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#0e1217] border border-rose-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-rose-950/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  طلبات الحذف المعلقة لموافقة المالك
                </h3>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                    {pendingCount} طلب
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                أي حذف للمواد أو الجداول أو الملفات لا يتم إلا بعد مراجعتك وتأكيدك المباشر كمالك للنظام
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-b border-white/5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'pending'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              الطلبات المعلقة ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'all'
                  ? 'bg-white text-black font-black'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              سجل الطلبات كاملاً ({requests.length})
            </button>
          </div>

          <button
            type="button"
            onClick={fetchRequests}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
            title="تحديث القائمة"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>تحديث</span>
          </button>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs">جاري فحص طلبات الحذف...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-white/[0.02] border border-white/5">
              <CheckCircle size={36} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-xs font-bold text-gray-300">لا توجد طلبات حذف معلقة حالياً</p>
              <p className="text-[11px] text-gray-500 mt-1">
                جميع بيانات الكلية مؤمنة بالكامل ولن يتم حذف أي عنصر دون إذنك
              </p>
            </div>
          ) : (
            filteredRequests.map(req => {
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border space-y-3 transition-all ${
                    isPending
                      ? 'bg-rose-500/[0.04] border-rose-500/30 shadow-lg'
                      : isApproved
                      ? 'bg-emerald-500/[0.03] border-emerald-500/20 opacity-75'
                      : 'bg-gray-500/[0.03] border-gray-500/20 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/10 text-white">
                        {req.item_type === 'subject'
                          ? 'مادة دراسية'
                          : req.item_type === 'lecture'
                          ? 'محاضرة'
                          : req.item_type === 'assignment'
                          ? 'تكليف'
                          : req.item_type === 'schedule'
                          ? 'موعد بالجدول'
                          : req.item_type === 'folder'
                          ? 'مجلد'
                          : req.item_type}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white">{req.item_title}</h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isApproved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isPending ? 'بانتظار موافقتك' : isApproved ? 'تمت الموافقة والحذف' : 'تم رفض الطلب'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 bg-black/30 p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-amber-400" />
                      <span>طالب الحذف: <strong>{req.requested_by_name || req.requested_by}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-blue-400" />
                      <span>{new Date(req.created_at).toLocaleString('ar-EG')}</span>
                    </div>
                  </div>

                  {req.reason && (
                    <p className="text-xs text-gray-300 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                      💬 <strong>السبب:</strong> {req.reason}
                    </p>
                  )}

                  {/* Actions for Pending Requests */}
                  {isPending && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleAction(req.id, 'reject')}
                        className="px-3.5 py-1.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-xs font-bold hover:bg-white/5 disabled:opacity-50"
                      >
                        رفض الطلب
                      </button>

                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleAction(req.id, 'approve')}
                        className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/20 disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        <span>موافقة وتأكيد الحذف نهائياً</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
