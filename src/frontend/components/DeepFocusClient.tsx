'use client';

import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { TimerContext } from '@/frontend/context/TimerContext';
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Flame, Zap, Clock,
  Calendar, CheckCircle2, Award, Sparkles, Plus, Coffee, Brain
} from 'lucide-react';

export interface DeepFocusProps {
  workTracking?: any[];
  privacyActive?: boolean;
}

export default function DeepFocusClient(props: DeepFocusProps) {
  const { workTracking = [], privacyActive = false } = props;

  const timerCtx = useContext(TimerContext);

  const {
    timerMode = 'pomodoro',
    totalSeconds = 1500,
    secondsLeft = 1500,
    timerRunning = false,
    customMinutes = 45,
    soundEnabled = true,
    stopwatchRunning = false,
    stopwatchSeconds = 0,
    toggleTimer,
    selectMode,
    changeCustom,
    toggleSound,
    toggleStopwatch,
    resetStopwatch,
    resetTimer,
  } = timerCtx || {};

  const [workLogs, setWorkLogs] = useState<any[]>(Array.isArray(workTracking) ? workTracking : []);
  const [savingLog, setSavingLog] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (totalSec: number = 0) => {
    const safeSec = Math.max(0, Math.floor(totalSec || 0));
    const hrs = Math.floor(safeSec / 3600);
    const mins = Math.floor((safeSec % 3600) / 60);
    const secs = safeSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const safeTotal = totalSeconds > 0 ? totalSeconds : 1;
  const timerProgress = Math.min(100, Math.max(0, ((safeTotal - secondsLeft) / safeTotal) * 100));

  // Save Stopwatch Session to DB
  const handleSaveStopwatchSession = async () => {
    if (stopwatchSeconds < 60) {
      alert('يجب أن تكون مدة الجلسة دقيقة واحدة على الأقل للحفظ.');
      return;
    }
    setSavingLog(true);
    const hoursWorked = Number((stopwatchSeconds / 3600).toFixed(2));
    const date = new Date().toISOString().split('T')[0];
    const note = noteInput.trim() || 'جلسة عمل وتركيز عميق';

    try {
      await fetch('/api/finance/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hours',
          data: {
            date,
            hours: hoursWorked,
            description: note,
          }
        })
      });

      setWorkLogs(prev => [{ id: Date.now(), date, hoursWorked, note }, ...prev]);
      if (resetStopwatch) resetStopwatch();
      setNoteInput('');
    } catch (e) {
      console.error('Error saving work log:', e);
    } finally {
      setSavingLog(false);
    }
  };

  // Calculations for stats
  const safeLogs = Array.isArray(workLogs) ? workLogs : [];
  const totalHoursLogged = safeLogs.reduce((acc, curr) => acc + (Number(curr?.hoursWorked) || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayHours = safeLogs
    .filter(w => w?.date === todayStr)
    .reduce((acc, curr) => acc + (Number(curr?.hoursWorked) || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-orange-500/30 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(255,85,0,0.12)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5500]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/40 shadow-[0_0_25px_rgba(255,85,0,0.3)] shrink-0">
              <Brain size={34} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">DEEP FOCUS & TIME OS</h1>
                <span className="px-3 py-1 text-xs font-mono font-black rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  PRO
                </span>
              </div>
              <p className="text-sm font-medium text-gray-400 mt-1">
                محطة التركيز الفائق وإدارة ساعات الإنتاجية وجلسات العمل العميقة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleSound && toggleSound()}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                soundEnabled
                  ? 'border-orange-500/40 bg-orange-500/10 text-orange-400'
                  : 'border-white/10 bg-white/5 text-gray-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{soundEnabled ? 'التنبيه الصوتي مفعل' : 'مكتوم'}</span>
            </button>
          </div>
        </div>

        {/* Focus Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-gray-400 block font-bold">ساعات اليوم</span>
            <strong className={`text-2xl font-black text-orange-400 font-mono ${privacyActive ? 'privacy-blurred' : ''}`}>
              {todayHours.toFixed(1)} <span className="text-xs text-gray-500">ساعة</span>
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-gray-400 block font-bold">إجمالي ساعات العمل</span>
            <strong className={`text-2xl font-black text-white font-mono ${privacyActive ? 'privacy-blurred' : ''}`}>
              {totalHoursLogged.toFixed(1)} <span className="text-xs text-gray-500">ساعة</span>
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-gray-400 block font-bold">الجلسات المكتملة</span>
            <strong className={`text-2xl font-black text-emerald-400 font-mono ${privacyActive ? 'privacy-blurred' : ''}`}>
              {safeLogs.length} <span className="text-xs text-gray-500">جلسة</span>
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-gray-400 block font-bold">معدل التركيز</span>
            <strong className="text-2xl font-black text-cyan-400 font-mono">
              94% <span className="text-xs text-gray-500">Ultra</span>
            </strong>
          </div>
        </div>
      </div>

      {/* ── SPLIT MAIN VIEW: POMODORO & STOPWATCH ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 1. POMODORO COUNTDOWN TIMER (7 COLS) */}
        <div className="lg:col-span-7 rounded-[2.2rem] border border-orange-500/30 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 sm:p-8 space-y-6 flex flex-col justify-between backdrop-blur-2xl shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-orange-400 font-black text-lg">
                <Flame size={22} className="animate-pulse" />
                <span>مؤقت البومودورو والتركيز المحدد</span>
              </div>
              <span className="text-xs font-mono font-bold text-gray-400">
                {timerRunning ? '⚡ جاري العمل بنشاط' : '⏸ في الانتظار'}
              </span>
            </div>

            {/* Mode Selector Buttons */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { id: 'pomodoro', label: 'بومودورو (25د)', icon: <Brain size={14} /> },
                { id: 'deep', label: 'تركيز عميق (50د)', icon: <Zap size={14} /> },
                { id: 'shortBreak', label: 'استراحة قصيرة (5د)', icon: <Coffee size={14} /> },
                { id: 'longBreak', label: 'استراحة طويلة (15د)', icon: <Coffee size={14} /> },
                { id: 'custom', label: 'تخصيص', icon: <Clock size={14} /> },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => selectMode && selectMode(m.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    timerMode === m.id
                      ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(255,85,0,0.5)]'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Minutes Slider if custom */}
            {timerMode === 'custom' && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-6 flex items-center gap-4">
                <span className="text-xs text-gray-400 font-bold whitespace-nowrap">المدة (بالدقائق):</span>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={customMinutes}
                  onChange={e => changeCustom && changeCustom(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <span className="text-sm font-black font-mono text-orange-400 w-12 text-center">{customMinutes}د</span>
              </div>
            )}

            {/* Huge Timer Display */}
            <div className="text-center my-6 relative py-4">
              <motion.div
                key={secondsLeft}
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                className="text-6xl sm:text-8xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_35px_rgba(255,85,0,0.3)]"
              >
                {formatTime(secondsLeft)}
              </motion.div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">
                {timerMode === 'pomodoro' ? 'جلسة إنتاجية 25 دقيقة' : timerMode === 'deep' ? 'تركيز فائق 50 دقيقة' : 'استراحة مستحقة'}
              </p>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10 my-4">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 rounded-full shadow-[0_0_15px_rgba(255,85,0,0.6)] transition-all duration-300"
                style={{ width: `${timerProgress}%` }}
              />
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/10">
            <button
              onClick={() => toggleTimer && toggleTimer()}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-[#FF3300] hover:from-orange-400 hover:to-orange-600 text-white font-black text-lg transition-all shadow-[0_0_30px_rgba(255,85,0,0.45)] hover:scale-105 active:scale-95 cursor-pointer"
            >
              {timerRunning ? <Pause size={22} /> : <Play size={22} />}
              <span>{timerRunning ? 'إيقاف مؤقت' : 'بدء التركيز'}</span>
            </button>
            <button
              onClick={() => resetTimer && resetTimer()}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all cursor-pointer"
              title="إعادة تعيين"
            >
              <RotateCcw size={22} />
            </button>
          </div>
        </div>

        {/* 2. OPEN STOPWATCH & WORK LOGGER (5 COLS) */}
        <div className="lg:col-span-5 rounded-[2.2rem] border border-cyan-500/20 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 sm:p-8 space-y-6 flex flex-col justify-between backdrop-blur-2xl shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-black text-lg">
                <Clock size={22} />
                <span>عداد الوقت المفتوح (Stopwatch)</span>
              </div>
              <span className="text-xs font-mono font-bold text-gray-500">Work Tracker</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              تتبع ساعات العمل الطويلة وحفظها مباشرة في سجل الإنتاجية السنوي.
            </p>

            {/* Stopwatch Display */}
            <div className="text-center my-6 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5">
              <div className="text-5xl sm:text-6xl font-black font-mono text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                {formatTime(stopwatchSeconds)}
              </div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 block">
                ساعات : دقائق : ثواني
              </span>
            </div>

            {/* Note Input for the session */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 block">وصف أو مهمة الجلسة:</label>
              <input
                type="text"
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="مثلاً: برمجة الواجهة / دراسة شبكات..."
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-bold"
              />
            </div>
          </div>

          {/* Stopwatch Controls */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleStopwatch && toggleStopwatch()}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg cursor-pointer ${
                  stopwatchRunning
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                }`}
              >
                {stopwatchRunning ? <Pause size={18} /> : <Play size={18} />}
                <span>{stopwatchRunning ? 'إيقاف مؤقت' : 'بدء العداد'}</span>
              </button>
              <button
                onClick={() => resetStopwatch && resetStopwatch()}
                className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 cursor-pointer"
                title="تصفير"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            <button
              onClick={handleSaveStopwatchSession}
              disabled={savingLog || stopwatchSeconds < 60}
              className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-xs hover:bg-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>{savingLog ? 'جاري الحفظ...' : 'حفظ الجلسة في سجل العمل'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── RECENT WORK LOGS TABLE ── */}
      <div className="rounded-[2.2rem] border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Calendar size={18} className="text-orange-400" />
            <span>سجل جلسات العمل والإنتاجية الحديثة</span>
          </h3>
          <span className="text-xs font-mono text-gray-500 font-bold">{safeLogs.length} سجلات</span>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto">
          {safeLogs.length === 0 ? (
            <p className="text-center text-xs text-gray-500 py-8">لا توجد جلسات عمل مسجلة بعد. ابدأ أول جلسة الآن!</p>
          ) : (
            safeLogs.slice(0, 10).map((log, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs">
                    #{i + 1}
                  </div>
                  <div>
                    <strong className="text-sm text-white block">{log?.note || 'جلسة عمل وتركيز'}</strong>
                    <span className="text-[11px] font-mono text-gray-500">{log?.date}</span>
                  </div>
                </div>
                <div className={`text-sm font-black font-mono text-orange-400 ${privacyActive ? 'privacy-blurred' : ''}`}>
                  {log?.hoursWorked} ساعة
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
