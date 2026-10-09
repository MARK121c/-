'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, Plus, Trash2, CheckCircle2, Circle, Clock, AlertCircle, Filter, Calendar, Edit2, X } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  status: 'pending' | 'done';
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number;
  dayOfWeek: number | null;
  position: number;
  isSubTask: boolean;
  date: string;
  completedAt: string | null;
}

export default function TaskClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form, setForm] = useState({
    title: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    type: 'today',
    estimatedTime: 30,
  });

  const [editForm, setEditForm] = useState({
    id: 0,
    title: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    type: 'today',
    estimatedTime: 30,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks?type=all');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ title: '', priority: 'medium', type: 'today', estimatedTime: 30 });
        setShowForm(false);
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpdateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.id || !editForm.title.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingTask(null);
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Instant UI Toggle Status
  async function toggleTaskStatus(task: Task) {
    const nextStatus = task.status === 'done' ? 'pending' : 'done';
    
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus, completedAt: nextStatus === 'done' ? new Date().toISOString() : null } : t));

    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
    } catch (e) {
      console.error(e);
      fetchTasks(); // Revert on failure
    }
  }

  async function deleteTask(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
      fetchTasks();
    }
  }

  const priorityMeta = {
    critical: { label: '🔴 حرج', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
    high: { label: '🔥 عالي', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
    medium: { label: '🟡 متوسط', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
    low: { label: '🟢 منخفض', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  };

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = tasks.filter(t => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus === 'pending' && t.status !== 'pending') return false;
    if (filterStatus === 'done' && t.status !== 'done') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <ListTodo size={26} className="text-orange-400" />
            <span>إدارة المهام والأولويات</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">تتبع وإنجاز وتعديل مهامك اليومية مع تحديث فوري للحالة</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-[#FF3300] text-white font-black text-sm shadow-[0_0_20px_rgba(255,85,0,0.3)] hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Plus size={18} />
          <span>+ مهمة جديدة</span>
        </button>
      </div>

      {/* Progress Bar & Stats Strip */}
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-gray-400">نسبة إنجاز المهام الإجمالية</span>
          <span className="text-orange-400 font-mono text-base font-black">{progressPct}% ({completedCount}/{totalCount})</span>
        </div>
        <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-[#FF3300] shadow-[0_0_12px_rgba(255,85,0,0.6)]"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status Filters */}
        <div className="flex bg-white/[0.03] p-1 rounded-2xl border border-white/10">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'pending', label: '⏳ قيد التنفيذ' },
            { id: 'done', label: '✅ المكتملة' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${filterStatus === f.id ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Priority Filters */}
        <div className="flex bg-white/[0.03] p-1 rounded-2xl border border-white/10">
          {[
            { id: 'all', label: 'كل الأولويات' },
            { id: 'critical', label: '🔴 حرج' },
            { id: 'high', label: '🔥 عالي' },
            { id: 'medium', label: '🟡 متوسط' },
            { id: 'low', label: '🟢 منخفض' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterPriority(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${filterPriority === f.id ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Task Form Modal */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="p-6 rounded-3xl bg-white/[0.04] border border-orange-500/30 space-y-4 shadow-xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="عنوان المهمة..."
              className="sm:col-span-6 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            <select
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value as any })}
              className="sm:col-span-3 px-4 py-3 rounded-2xl bg-[#0c0d12] border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
            >
              <option value="critical">🔴 أولوية حرجة</option>
              <option value="high">🔥 أولوية عالية</option>
              <option value="medium">🟡 أولوية متوسطة</option>
              <option value="low">🟢 أولوية منخفضة</option>
            </select>
            <input
              type="number"
              value={form.estimatedTime}
              onChange={e => setForm({ ...form, estimatedTime: parseInt(e.target.value) || 15 })}
              placeholder="المدة (دقيقة)"
              className="sm:col-span-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-gray-400 border border-white/10 hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-orange-500 text-white font-black text-xs shadow-lg hover:bg-orange-400"
            >
              حفظ المهمة
            </button>
          </div>
        </motion.form>
      )}

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d0e12] p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Edit2 size={18} className="text-orange-400" />
                  <span>تعديل المهمة</span>
                </h3>
                <button onClick={() => setEditingTask(null)} className="p-2 text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateTask} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">عنوان المهمة</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">الأولوية</label>
                    <select
                      value={editForm.priority}
                      onChange={e => setEditForm({ ...editForm, priority: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-2xl bg-[#14161f] border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="critical">🔴 أولوية حرجة</option>
                      <option value="high">🔥 أولوية عالية</option>
                      <option value="medium">🟡 أولوية متوسطة</option>
                      <option value="low">🟢 أولوية منخفضة</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">المدة (دقيقة)</label>
                    <input
                      type="number"
                      value={editForm.estimatedTime}
                      onChange={e => setEditForm({ ...editForm, estimatedTime: parseInt(e.target.value) || 15 })}
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-gray-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-black text-xs hover:bg-orange-400 shadow-lg"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map(task => {
          const isDone = task.status === 'done';
          const meta = priorityMeta[task.priority] || priorityMeta.medium;

          return (
            <motion.div
              key={task.id}
              layout
              className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all ${
                isDone 
                  ? 'bg-emerald-500/5 border-emerald-500/20 opacity-75' 
                  : 'bg-white/[0.02] border-white/5 hover:border-orange-500/30'
              }`}
            >
              {/* Checkbox + Title */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleTaskStatus(task)}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isDone 
                      ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                      : 'border-2 border-orange-500/40 hover:border-orange-500 bg-orange-500/10 text-transparent'
                  }`}
                  title={isDone ? 'إعادة إلى قيد التنفيذ' : 'تعليم كمكتملة'}
                >
                  <CheckCircle2 size={18} className={isDone ? 'text-white' : 'opacity-0'} />
                </button>

                <div className="flex-1 min-w-0">
                  <span className={`text-sm sm:text-base font-bold block truncate transition-all ${isDone ? 'line-through text-gray-400' : 'text-white'}`}>
                    {task.title}
                  </span>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-gray-500">
                    <span className={`px-2 py-0.5 rounded-md font-bold border ${meta.bg} ${meta.color}`}>
                      {meta.label}
                    </span>
                    {task.estimatedTime > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {task.estimatedTime} د
                      </span>
                    )}
                    {task.date && <span>📅 {task.date}</span>}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit & Delete */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(task);
                    setEditForm({
                      id: task.id,
                      title: task.title,
                      priority: task.priority,
                      type: task.type,
                      estimatedTime: task.estimatedTime || 30,
                    });
                  }}
                  className="p-2 text-gray-500 hover:text-orange-400 transition-colors"
                  title="تعديل المهمة"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-gray-600 hover:text-rose-400 transition-colors"
                  title="حذف المهمة"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}

        {filteredTasks.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <ListTodo size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">لا توجد مهام تطابق هذا الفلتر</p>
          </div>
        )}
      </div>
    </div>
  );
}
