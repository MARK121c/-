"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox, Target, Calendar, Brain, Trophy, Flame, Timer,
  Plus, Trash2, Check, X, ChevronDown, AlertTriangle,
  Star, Zap, Moon, Sun, Play, Pause, RotateCcw, Bell,
  Crown, Sparkles, Clock, ListTodo, CheckCircle2, Circle
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface Task {
  id: number;
  title: string;
  status: 'pending' | 'done';
  type: 'inbox' | 'today' | 'weekly';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number;
  dayOfWeek: number | null;
  position: number;
  isSubTask: boolean;
  date: string;
  completedAt: string | null;
}

interface TodayStats {
  coreTasks: Task[];
  subTasks: Task[];
  tasks: Task[];
  completedCore: number;
  completedTotal: number;
  totalTasks: number;
  focusScore: number;
}

// ── Constants ───────────────────────────────────────────────────────────────
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const PRIORITY_CONFIG = {
  critical: { label: 'حرج 🔥🔥🔥', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
  high:     { label: 'مرتفع 🔥🔥',  color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30' },
  medium:   { label: 'متوسط 🔥',    color: 'text-amber-400',  bg: 'bg-amber-500/20 border-amber-500/30' },
  low:      { label: 'منخفض',       color: 'text-gray-400',   bg: 'bg-gray-500/20 border-gray-500/30' },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const api = {
  getTasks: (type?: string) => fetch(`/api/tasks${type ? `?type=${type}` : ''}`).then(r => r.json()),
  getToday: () => fetch('/api/tasks/today').then(r => r.json()),
  addTask:  (data: any) => fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateTask: (data: any) => fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteTask: (id: number) => fetch(`/api/tasks?id=${id}`, { method: 'DELETE' }),
  completeDay: () => fetch('/api/tasks/complete-day', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
};

// ── Focus Score Ring ─────────────────────────────────────────────────────────
function FocusRing({ score }: { score: number }) {
  const r = 36; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e';
  return (
    <svg width="90" height="90" className="rotate-[-90deg]">
      <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 8px ${color})` }} />
      <text x="45" y="50" textAnchor="middle" fill={color} fontSize="18" fontWeight="900"
        style={{ transform: 'rotate(90deg)', transformOrigin: '45px 45px', fontFamily: 'monospace' }}>
        {score}
      </text>
    </svg>
  );
}

// ── Deep Work Timer ──────────────────────────────────────────────────────────
function DeepWorkTimer() {
  const [duration, setDuration] = useState(50 * 60); // 50 min default
  const [timeLeft, setTimeLeft] = useState(duration);
  const [running, setRunning] = useState(false);
  const [inputMin, setInputMin] = useState(50);
  const intervalRef = useRef<any>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const playAlarm = useCallback(() => {
    try {
      const ctx = new AudioContext();
      audioRef.current = ctx;
      const playTone = (freq: number, start: number, dur: number, vol = 0.3) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(vol, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      // Melody pattern
      [0, 0.3, 0.6, 0.9, 1.5, 1.8].forEach((t, i) => playTone(523 + i * 80, t, 0.25));
      setTimeout(() => { try { ctx.close(); } catch (_) {} }, 60000);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            playAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, playAlarm]);

  const reset = () => {
    if (running && !confirm('إيقاف جلسة العمل العميق؟')) return;
    clearInterval(intervalRef.current);
    setRunning(false);
    const secs = inputMin * 60;
    setDuration(secs);
    setTimeLeft(secs);
    try { audioRef.current?.close(); } catch (_) {}
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const pct = timeLeft / duration;
  const isAlmostDone = timeLeft > 0 && pct < 0.15;

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
      <Timer size={18} className={isAlmostDone ? 'text-rose-400 animate-pulse' : 'text-purple-400'} />
      <span className={`font-mono font-black text-xl tabular-nums ${isAlmostDone ? 'text-rose-400' : 'text-white'}`}>
        {mins}:{secs}
      </span>
      {!running && (
        <input type="number" min={1} max={180} value={inputMin}
          onChange={e => { const v = +e.target.value; setInputMin(v); setDuration(v*60); setTimeLeft(v*60); }}
          className="w-14 bg-transparent border border-white/10 rounded-lg px-2 py-1 text-sm font-black text-center text-gray-400 focus:outline-none focus:border-white/30"
        />
      )}
      <button onClick={() => setRunning(r => !r)}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${running ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/40' : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/40'}`}>
        {running ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button onClick={reset} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-gray-500">
        <RotateCcw size={14} />
      </button>
    </div>
  );
}

// ── Priority Badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
  return (
    <span className={`px-2 py-0.5 rounded-lg border text-xs font-black ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ── Task Card (reusable) ─────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onDelete, compact = false }: {
  task: Task; onToggle: (t: Task) => void; onDelete: (id: number) => void; compact?: boolean;
}) {
  const done = task.status === 'done';
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-default
        ${done ? 'border-white/5 bg-white/2 opacity-50' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'}`}>
      <button onClick={() => onToggle(task)}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
          ${done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600 hover:border-emerald-400'}`}>
        {done && <Check size={12} className="text-black font-black" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm leading-tight truncate ${done ? 'line-through text-gray-600' : 'text-white'}`}>
          {task.title}
        </p>
        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            <PriorityBadge priority={task.priority} />
            <span className="text-xs text-gray-600 font-bold flex items-center gap-1">
              <Clock size={10} />{task.estimatedTime}د
            </span>
          </div>
        )}
      </div>
      <button onClick={() => onDelete(task.id)}
        className="shrink-0 w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 bg-rose-500/10 text-rose-400 hover:bg-rose-500/30 flex items-center justify-center transition-all">
        <Trash2 size={12} />
      </button>
    </motion.div>
  );
}

// ── Add Task Input ───────────────────────────────────────────────────────────
function AddTaskInput({ onAdd, placeholder = 'اكتب أي فكرة...', autoFocus = false }: {
  onAdd: (title: string) => void; placeholder?: string; autoFocus?: boolean;
}) {
  const [val, setVal] = useState('');
  const submit = () => { if (val.trim()) { onAdd(val.trim()); setVal(''); } };
  return (
    <div className="flex gap-2">
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-gray-700 focus:outline-none focus:border-emerald-500/50 transition-all"
      />
      <button onClick={submit}
        className="w-11 h-11 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 flex items-center justify-center border border-emerald-500/20 transition-all active:scale-95">
        <Plus size={18} />
      </button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function TaskClient() {
  const [activeTab, setActiveTab] = useState<'today' | 'inbox' | 'weekly' | 'analytics'>('today');
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMorningModal, setShowMorningModal] = useState(false);
  const [showNightModal, setShowNightModal] = useState(false);
  const [showGoldenBadge, setShowGoldenBadge] = useState(false);
  const [showPerfectDay, setShowPerfectDay] = useState(false);
  const [overloadWarning, setOverloadWarning] = useState(false);
  const [dayLogs, setDayLogs] = useState<any[]>([]);
  const [morningTime, setMorningTime] = useState(() => localStorage.getItem('morningTime') || '08:00');
  const [nightTime, setNightTime] = useState(() => localStorage.getItem('nightTime') || '22:00');
  const [showAddToday, setShowAddToday] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({ title: '', priority: 'medium', estimatedTime: 30 });
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [dragTaskId, setDragTaskId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, todayRes, logsRes] = await Promise.all([
        api.getTasks(),
        api.getToday(),
        fetch('/api/tasks?type=all').then(r => r.json()),
      ]);
      setAllTasks(tasksRes.tasks || []);
      if (todayRes.todayStats) setTodayStats(todayRes.todayStats);
      if (todayRes.streak !== undefined) setStreak(todayRes.streak);
    } catch (_) {}
    setLoading(false);
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const r = await fetch('/api/tasks/today');
      const data = await r.json();
      if (data.log) setDayLogs(prev => [data.log, ...prev.slice(0, 6)]);
    } catch (_) {}
  }, []);

  useEffect(() => { refresh(); fetchLogs(); }, [refresh, fetchLogs]);

  // Morning / Night notifications
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
      const morningShown = localStorage.getItem(`morning_shown_${now.toDateString()}`);
      const nightShown = localStorage.getItem(`night_shown_${now.toDateString()}`);
      if (hhmm === morningTime && !morningShown) {
        setShowMorningModal(true);
        localStorage.setItem(`morning_shown_${now.toDateString()}`, '1');
      }
      if (hhmm === nightTime && !nightShown) {
        setShowNightModal(true);
        localStorage.setItem(`night_shown_${now.toDateString()}`, '1');
      }
    };
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [morningTime, nightTime]);

  // Watch for perfect day / golden badge
  useEffect(() => {
    if (!todayStats) return;
    const { completedCore, coreTasks, completedTotal, totalTasks } = todayStats;
    if (completedCore >= 3 && coreTasks.length >= 3) setShowPerfectDay(true);
    if (totalTasks > 0 && completedTotal === totalTasks && totalTasks >= 3) setShowGoldenBadge(true);
  }, [todayStats]);

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    await api.updateTask({ id: task.id, status: newStatus });
    refresh();
  };

  const deleteTask = async (id: number) => {
    await api.deleteTask(id);
    refresh();
  };

  const addInboxTask = async (title: string) => {
    await api.addTask({ title, type: 'inbox', priority: 'medium', estimatedTime: 30 });
    refresh();
  };

  const addTodayTask = async () => {
    const coreTasks = allTasks.filter(t => t.type === 'today' && !t.isSubTask);
    const isSubTask = coreTasks.length >= 3;
    if (isSubTask) setOverloadWarning(true);
    await api.addTask({ ...newTaskForm, type: 'today', isSubTask });
    setShowAddToday(false);
    setNewTaskForm({ title: '', priority: 'medium', estimatedTime: 30 });
    refresh();
    setTimeout(() => setOverloadWarning(false), 4000);
  };

  const moveInboxToToday = async (task: Task) => {
    const coreTasks = allTasks.filter(t => t.type === 'today' && !t.isSubTask);
    const isSubTask = coreTasks.length >= 3;
    if (isSubTask) setOverloadWarning(true);
    await api.updateTask({ id: task.id, type: 'today', isSubTask });
    refresh();
    setTimeout(() => setOverloadWarning(false), 4000);
  };

  const moveToWeekly = async (task: Task, dayOfWeek: number) => {
    await api.updateTask({ id: task.id, type: 'weekly', dayOfWeek, isSubTask: false });
    setDragOverDay(null);
    setDragTaskId(null);
    refresh();
  };

  const closeDay = async () => {
    const res = await api.completeDay();
    const data = await res.json();
    refresh();
    setShowNightModal(false);
    if (data.coreDone >= 3) setShowPerfectDay(true);
    if (data.done >= data.total && data.total > 0) setShowGoldenBadge(true);
  };

  // ── Inbox Tasks ──────────────────────────────────────────────────────────
  const inboxTasks = allTasks.filter(t => t.type === 'inbox');
  // ── Today Tasks ──────────────────────────────────────────────────────────
  const coreTasks = allTasks.filter(t => t.type === 'today' && !t.isSubTask).slice(0, 3);
  const subTasks  = allTasks.filter(t => t.type === 'today' && t.isSubTask);
  // ── Weekly Tasks ─────────────────────────────────────────────────────────
  const weeklyTasks = allTasks.filter(t => t.type === 'weekly');
  const focusScore = todayStats?.focusScore ?? 0;

  const tabs = [
    { id: 'today',     icon: <Target size={16} />,    label: 'تركيز اليوم' },
    { id: 'inbox',     icon: <Inbox size={16} />,     label: 'صندوق الأفكار' },
    { id: 'weekly',    icon: <Calendar size={16} />,  label: 'السبرينت الأسبوعي' },
    { id: 'analytics', icon: <Brain size={16} />,     label: 'التحليل الذكي' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">
      {/* ── Header Bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black flex items-center gap-3">
            نظام المهام الذكي <Brain className="text-purple-400" size={32} />
          </h2>
          <p className="text-sm text-gray-500 mt-1">أقل تفكير · أكثر تركيز · أفضل إنجاز</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Streak */}
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-2">
            <Flame size={18} className="text-orange-400" />
            <span className="font-black text-orange-400">{streak}</span>
            <span className="text-xs text-orange-400/60 font-bold">يوم متتالي</span>
          </div>

          {/* Focus Score */}
          <div className="relative">
            <FocusRing score={focusScore} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] text-gray-500 font-black mt-8">FOCUS</span>
            </div>
          </div>

          {/* Deep Work Timer */}
          <DeepWorkTimer />

          {/* Close Day */}
          <button onClick={() => setShowNightModal(true)}
            className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-4 py-2 text-indigo-400 font-black text-sm hover:bg-indigo-500/20 transition-all">
            <Moon size={16} /> إغلاق اليوم
          </button>
        </div>
      </div>

      {/* ── Overload Warning ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {overloadWarning && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-3">
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
            <p className="text-amber-300 font-bold text-sm">التركيز أهم من الكثرة — المهمة أُضيفت كمهمة فرعية للحفاظ على تركيزك.</p>
            <button onClick={() => setOverloadWarning(false)} className="mr-auto text-gray-600 hover:text-white"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide border-b border-white/5 pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black whitespace-nowrap transition-all
              ${activeTab === tab.id ? 'text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            {activeTab === tab.id && (
              <motion.div layoutId="taskTabPill" className="absolute inset-0 bg-purple-400 rounded-full shadow-[0_4px_20px_rgba(168,85,247,0.4)]" />
            )}
            <span className="relative z-10 flex items-center gap-2">{tab.icon}{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ════ TODAY'S FOCUS ════ */}
        {activeTab === 'today' && (
          <motion.div key="today" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6">

            {/* Perfect Day Banner */}
            {showPerfectDay && todayStats && todayStats.completedCore >= 3 && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="grand-card p-6 bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/30 flex items-center gap-4">
                <div className="text-4xl">🎉</div>
                <div>
                  <p className="text-emerald-400 font-black text-xl">يوم مثالي!</p>
                  <p className="text-emerald-400/60 text-sm font-bold">أتممت المهام الأساسية الثلاثة. هذا هو الهدف.</p>
                </div>
              </motion.div>
            )}

            {/* 3 Core Slots */}
            <div className="grand-card p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Target size={20} className="text-purple-400" />
                  المهام الأساسية الثلاث
                  <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full px-2 py-0.5">
                    {coreTasks.filter(t => t.status === 'done').length}/3
                  </span>
                </h3>
                <button onClick={() => setShowAddToday(true)}
                  className="flex items-center gap-1 text-xs font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-xl hover:bg-purple-500/20 transition-all">
                  <Plus size={14} /> إضافة مهمة
                </button>
              </div>

              {[0, 1, 2].map(i => {
                const task = coreTasks[i];
                return task ? (
                  <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                ) : (
                  <div key={`slot-${i}`}
                    className="border-2 border-dashed border-white/5 rounded-2xl p-4 flex items-center gap-3 text-gray-700 cursor-pointer hover:border-purple-500/20 hover:text-gray-500 transition-all"
                    onClick={() => setShowAddToday(true)}>
                    <Circle size={22} className="opacity-30" />
                    <span className="text-sm font-bold">فارغ — اسحب من الـ Inbox أو أضف مهمة</span>
                  </div>
                );
              })}
            </div>

            {/* Sub Tasks */}
            {subTasks.length > 0 && (
              <div className="grand-card p-5 space-y-3">
                <h4 className="text-sm font-black text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                  <ListTodo size={14} /> مهام فرعية ({subTasks.length})
                </h4>
                <AnimatePresence>
                  {subTasks.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} compact />)}
                </AnimatePresence>
              </div>
            )}

            {/* Add Today Modal */}
            <AnimatePresence>
              {showAddToday && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
                    className="w-full max-w-md bg-black border border-white/10 rounded-3xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-purple-400">إضافة مهمة لليوم</h3>
                      <button onClick={() => setShowAddToday(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"><X size={18} /></button>
                    </div>
                    <input autoFocus value={newTaskForm.title}
                      onChange={e => setNewTaskForm(f => ({ ...f, title: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && newTaskForm.title && addTodayTask()}
                      placeholder="عنوان المهمة..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-black text-gray-500 mb-2 block uppercase">الأهمية</label>
                        <select value={newTaskForm.priority}
                          onChange={e => setNewTaskForm(f => ({ ...f, priority: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none appearance-none">
                          <option value="critical">حرج 🔥🔥🔥</option>
                          <option value="high">مرتفع 🔥🔥</option>
                          <option value="medium">متوسط 🔥</option>
                          <option value="low">منخفض</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-black text-gray-500 mb-2 block uppercase">الوقت (دقيقة)</label>
                        <input type="number" min={5} max={480} value={newTaskForm.estimatedTime}
                          onChange={e => setNewTaskForm(f => ({ ...f, estimatedTime: +e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-center focus:outline-none"
                        />
                      </div>
                    </div>
                    {coreTasks.length >= 3 && (
                      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                        <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                        <p className="text-xs text-amber-300 font-bold">ستُضاف كـ مهمة فرعية — التركيز أهم من الكثرة</p>
                      </div>
                    )}
                    <button onClick={addTodayTask} disabled={!newTaskForm.title.trim()}
                      className="w-full py-3 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2">
                      <Check size={18} /> تأكيد الإضافة
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ════ INBOX ════ */}
        {activeTab === 'inbox' && (
          <motion.div key="inbox" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-5">
            <div className="grand-card p-6 space-y-4">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Inbox size={20} className="text-emerald-400" /> صندوق الأفكار
              </h3>
              <AddTaskInput onAdd={addInboxTask} placeholder="اكتب أي فكرة واضغط Enter..." />
              <p className="text-xs text-gray-600 font-bold">💡 الـ Inbox مكان التفريغ — أضف فوراً، رتّب لاحقاً</p>
            </div>

            {inboxTasks.length > 0 ? (
              <div className="grand-card p-6 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-black text-gray-400 text-sm uppercase tracking-widest">{inboxTasks.length} فكرة في الصندوق</h4>
                </div>
                <AnimatePresence>
                  {inboxTasks.map(task => (
                    <motion.div key={task.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
                      className="group flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all">
                      <Inbox size={14} className="text-gray-600 shrink-0" />
                      <span className="flex-1 text-sm font-bold text-white truncate">{task.title}</span>
                      <button onClick={() => moveInboxToToday(task)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/20 px-2 py-1 rounded-lg hover:bg-purple-500/30 transition-all font-black">
                        <Target size={12} /> اليوم
                      </button>
                      <button onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/30 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="grand-card p-16 flex flex-col items-center justify-center text-center border-dashed">
                <Inbox size={40} className="text-gray-700 mb-4" />
                <p className="text-gray-600 font-black text-lg">الصندوق فارغ</p>
                <p className="text-gray-700 text-sm font-bold mt-1">عقلك خالٍ من العبء — هذا رائع.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ════ WEEKLY SPRINT ════ */}
        {activeTab === 'weekly' && (
          <motion.div key="weekly" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-5">
            <div className="grand-card p-6">
              <h3 className="text-xl font-black flex items-center gap-2 mb-6">
                <Calendar size={20} className="text-blue-400" /> السبرينت الأسبوعي
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day, dayIdx) => {
                  const tasks = weeklyTasks.filter(t => t.dayOfWeek === dayIdx);
                  const done = tasks.filter(t => t.status === 'done').length;
                  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
                  const isToday = new Date().getDay() === dayIdx;
                  return (
                    <div key={dayIdx}
                      onDragOver={e => { e.preventDefault(); setDragOverDay(dayIdx); }}
                      onDragLeave={() => setDragOverDay(null)}
                      onDrop={e => { e.preventDefault(); if (dragTaskId) moveToWeekly(allTasks.find(t => t.id === dragTaskId)!, dayIdx); }}
                      className={`min-h-32 rounded-2xl border p-2 flex flex-col gap-1.5 transition-all
                        ${isToday ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/5 bg-white/2'}
                        ${dragOverDay === dayIdx ? 'border-purple-500/50 bg-purple-500/10 scale-[1.02]' : ''}`}>
                      <div className="text-center mb-1">
                        <p className={`text-xs font-black ${isToday ? 'text-blue-400' : 'text-gray-600'}`}>{day}</p>
                        {tasks.length > 0 && <p className="text-[10px] font-bold text-gray-700">{pct}%</p>}
                      </div>
                      {tasks.map(t => (
                        <div key={t.id} draggable
                          onDragStart={() => setDragTaskId(t.id)}
                          className={`p-1.5 rounded-lg text-[10px] font-bold truncate cursor-grab active:cursor-grabbing transition-all
                            ${t.status === 'done' ? 'bg-emerald-500/10 text-emerald-600 line-through' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}>
                          {t.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600 font-bold mt-4 text-center">
                💡 اسحب مهمة من الـ Inbox لأي يوم تريده
              </p>
            </div>

            {/* Inbox tasks draggable source */}
            {inboxTasks.length > 0 && (
              <div className="grand-card p-5 space-y-2">
                <h4 className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3">مهام الـ Inbox — اسحبها للأسبوع</h4>
                <div className="flex flex-wrap gap-2">
                  {inboxTasks.map(t => (
                    <div key={t.id} draggable onDragStart={() => setDragTaskId(t.id)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 cursor-grab active:cursor-grabbing hover:border-white/20 hover:bg-white/10 transition-all flex items-center gap-1">
                      <Inbox size={10} className="text-gray-600" />{t.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ════ ANALYTICS ════ */}
        {activeTab === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-5">
            {/* Focus Score Big */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grand-card p-6 bg-purple-500/5 border-purple-500/10 flex items-center gap-4">
                <FocusRing score={focusScore} />
                <div>
                  <p className="text-purple-400 font-black text-xs uppercase tracking-widest mb-1">نقاط التركيز</p>
                  <p className="text-3xl font-black text-white">{focusScore}<span className="text-sm text-gray-500">/100</span></p>
                  <p className="text-xs text-gray-600 font-bold mt-1">{focusScore>=80?'ممتاز 🏆':focusScore>=50?'جيد 💪':'تحتاج تحسين 📈'}</p>
                </div>
              </div>
              <div className="grand-card p-6 bg-orange-500/5 border-orange-500/10 flex items-center gap-4">
                <Flame size={36} className="text-orange-400" />
                <div>
                  <p className="text-orange-400 font-black text-xs uppercase tracking-widest mb-1">السلسلة الحالية</p>
                  <p className="text-3xl font-black text-white">{streak}<span className="text-sm text-gray-500"> يوم</span></p>
                  <p className="text-xs text-gray-600 font-bold mt-1">لا تكسر السلسلة 🔥</p>
                </div>
              </div>
              <div className="grand-card p-6 bg-emerald-500/5 border-emerald-500/10 flex items-center gap-4">
                <CheckCircle2 size={36} className="text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-1">إنجاز اليوم</p>
                  <p className="text-3xl font-black text-white">
                    {todayStats?.completedTotal ?? 0}<span className="text-sm text-gray-500">/{todayStats?.totalTasks ?? 0}</span>
                  </p>
                  <p className="text-xs text-gray-600 font-bold mt-1">مهمة منجزة اليوم</p>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {inboxTasks.length > 5 && (
              <div className="grand-card p-5 border-amber-500/10 bg-amber-500/5">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle size={18} className="text-amber-400" />
                  <h4 className="font-black text-amber-400">تحذير: أنت محمّل نفسك زيادة</h4>
                </div>
                <p className="text-sm text-amber-400/60 font-bold">
                  عندك {inboxTasks.length} مهمة في الـ Inbox — حدّد 3 الأهم وابدأ بهم.
                </p>
              </div>
            )}

            {/* Suggestions Engine */}
            {inboxTasks.length > 0 && (
              <div className="grand-card p-5 space-y-3">
                <h4 className="font-black flex items-center gap-2 text-sm text-gray-400 uppercase tracking-widest">
                  <Zap size={14} className="text-yellow-400" /> مقترحات النظام
                </h4>
                <p className="text-xs text-gray-600 font-bold mb-3">المهام التالية مرشحة لتكون أولوياتك اليوم:</p>
                <div className="space-y-2">
                  {inboxTasks.slice(0, 3).map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <Zap size={14} className="text-yellow-400 shrink-0" />
                      <span className="flex-1 text-sm font-bold text-white">{t.title}</span>
                      <button onClick={() => moveInboxToToday(t)}
                        className="text-xs font-black bg-purple-500/20 text-purple-400 px-3 py-1 rounded-lg hover:bg-purple-500/30 transition-all">
                        أضفها لليوم
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reminder Settings */}
            <div className="grand-card p-5 space-y-4">
              <h4 className="font-black text-sm text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Bell size={14} className="text-blue-400" /> إعدادات التذكيرات
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-600 mb-2 block flex items-center gap-1"><Sun size={12} /> الصباح</label>
                  <input type="time" value={morningTime}
                    onChange={e => { setMorningTime(e.target.value); localStorage.setItem('morningTime', e.target.value); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white font-black focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-600 mb-2 block flex items-center gap-1"><Moon size={12} /> المساء</label>
                  <input type="time" value={nightTime}
                    onChange={e => { setNightTime(e.target.value); localStorage.setItem('nightTime', e.target.value); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white font-black focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ MORNING MODAL ════ */}
      <AnimatePresence>
        {showMorningModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8 }}
              className="w-full max-w-md bg-gradient-to-br from-amber-500/10 via-black to-black border border-amber-500/20 rounded-[2rem] p-8 text-center space-y-5">
              <div className="text-5xl">☀️</div>
              <h3 className="text-3xl font-black text-amber-400">صباح الخير يا مارك 👑</h3>
              <p className="text-gray-500 font-bold">مهامك الأساسية اليوم:</p>
              <div className="space-y-2 text-right">
                {coreTasks.length > 0 ? coreTasks.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center shrink-0">{i+1}</span>
                    <span className="font-bold text-white">{t.title}</span>
                  </div>
                )) : (
                  <p className="text-gray-700 font-bold italic">لم تحدد مهامك بعد — روح حددهم الأول!</p>
                )}
              </div>
              <p className="text-amber-400/50 text-sm font-bold italic">خلّصهم... والباقي سهل.</p>
              <button onClick={() => setShowMorningModal(false)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black transition-all active:scale-95">
                يلا نبدأ 💪
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ NIGHT MODAL ════ */}
      <AnimatePresence>
        {showNightModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8 }}
              className="w-full max-w-md bg-gradient-to-br from-indigo-500/10 via-black to-black border border-indigo-500/20 rounded-[2rem] p-8 text-center space-y-5">
              <div className="text-5xl">🌙</div>
              <h3 className="text-2xl font-black text-indigo-400">إيه اللي خلص النهاردة؟</h3>
              <div className="space-y-2 text-right max-h-60 overflow-y-auto">
                {allTasks.filter(t => t.type === 'today').map(t => (
                  <div key={t.id} onClick={() => toggleTask(t)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                      ${t.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                    {t.status === 'done' ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <Circle size={18} className="text-gray-600 shrink-0" />}
                    <span className={`font-bold text-sm ${t.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>{t.title}</span>
                    {t.isSubTask && <span className="text-[10px] text-gray-600 font-black mr-auto">فرعية</span>}
                  </div>
                ))}
              </div>
              <button onClick={closeDay}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2">
                <Check size={18} /> تم — إغلاق اليوم
              </button>
              <button onClick={() => setShowNightModal(false)} className="text-sm text-gray-600 hover:text-gray-400 font-bold transition-all">
                لسه شغال...
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ GOLDEN BADGE ════ */}
      <AnimatePresence>
        {showGoldenBadge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4"
            onClick={() => setShowGoldenBadge(false)}>
            <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-center space-y-6">
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}
                className="text-9xl">👑</motion.div>
              <h2 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                MARK
              </h2>
              <p className="text-2xl font-black text-amber-400">يوم استثنائي — ممتاز</p>
              <p className="text-gray-500 font-bold">أتممت كل مهامك اليوم بدون استثناء.</p>
              <div className="flex justify-center gap-2">
                {['🏆','⭐','✨','🔥','💎'].map((e, i) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }} className="text-3xl">{e}</motion.span>
                ))}
              </div>
              <p className="text-gray-700 text-sm font-bold">اضغط في أي مكان للمتابعة</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
