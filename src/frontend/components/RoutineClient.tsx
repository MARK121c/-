'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Library, ShoppingCart, CheckCircle, Circle, Play, StopCircle, Plus, Trash2, HeartPulse, Clock, Flame, AlertCircle } from 'lucide-react';

const api = {
  getToday: () => fetch('/api/routines/today', { cache: 'no-store' }).then(r => r.json()),
  toggleStep: (routineId: number, stepId: number, completed: boolean) => fetch('/api/routines/logs', { method: 'POST', body: JSON.stringify({ routineId, stepId, completed }) }),
  getRoutines: () => fetch('/api/routines', { cache: 'no-store' }).then(r => r.json()),
  createRoutine: (data: any) => fetch('/api/routines', { method: 'POST', body: JSON.stringify(data) }),
  deleteRoutine: (id: number) => fetch(`/api/routines?id=${id}`, { method: 'DELETE' }),
  getGrooming: () => fetch('/api/grooming', { cache: 'no-store' }).then(r => r.json()),
  createGrooming: (data: any) => fetch('/api/grooming', { method: 'POST', body: JSON.stringify(data) }),
  deleteGrooming: (id: number) => fetch(`/api/grooming?id=${id}`, { method: 'DELETE' }),
  getGroomingAlerts: () => fetch('/api/grooming/alerts', { cache: 'no-store' }).then(r => r.json())
};

// ── TYPES ───────────────────────────────────────────
type Tab = 'today' | 'library' | 'grooming';

export default function RoutineClient() {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [loading, setLoading] = useState(true);

  // Today State
  const [todayRoutines, setTodayRoutines] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // Library State
  const [library, setLibrary] = useState<any[]>([]);
  
  // Grooming State
  const [grooming, setGrooming] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayData, libData, groomData, alertData] = await Promise.all([
        api.getToday(), api.getRoutines(), api.getGrooming(), api.getGroomingAlerts()
      ]);
      setTodayRoutines(todayData.todayRoutines || []);
      setScore(todayData.score || 0);
      setStreak(todayData.streak || 0);
      setLibrary(libData.routines || []);
      setGrooming(groomData.products || []);
      setAlerts(alertData.alerts || []);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  // -- Routine Mode State --
  const [routineMode, setRoutineMode] = useState<{ active: boolean, routine: any, currentStepIdx: number, timer: number } | null>(null);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (routineMode?.active) {
      interval = setInterval(() => {
        setRoutineMode(prev => prev ? { ...prev, timer: prev.timer + 1 } : null);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [routineMode?.active]);

  const toggleStep = async (rId: number, sId: number, currentState: boolean) => {
    await api.toggleStep(rId, sId, !currentState);
    // Optimistic Update
    setTodayRoutines(prev => prev.map(r => r.id === rId ? {
      ...r, steps: r.steps.map((s: any) => s.id === sId ? { ...s, completed: !currentState } : s)
    } : r));
    // Background refresh to update score natively
    api.getToday().then(d => { setScore(d.score || 0); setStreak(d.streak || 0); });
  };

  const startRoutineMode = (routine: any) => {
    setRoutineMode({ active: true, routine, currentStepIdx: 0, timer: 0 });
  };

  const nextModeStep = async () => {
    if (!routineMode) return;
    const { routine, currentStepIdx } = routineMode;
    const step = routine.steps[currentStepIdx];
    
    // Auto-mark completed if not already
    if (!step.completed) {
      await toggleStep(routine.id, step.id, false);
      step.completed = true;
    }

    if (currentStepIdx + 1 < routine.steps.length) {
      setRoutineMode({ ...routineMode, currentStepIdx: currentStepIdx + 1, timer: 0 });
    } else {
      setRoutineMode(null); // Finish
    }
  };

  return (
    <div className="text-gray-100 min-h-screen relative pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-2 flex items-center gap-2">
            <HeartPulse size={30} className="text-emerald-500" />
            نظام الحياة - Lifestyle OS
          </h1>
          <p className="text-gray-400">إدارة الروتين، العناية الشخصية، والحفاظ على الانضباط.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-gray-800/60 p-4 rounded-xl border border-emerald-500/20 w-32 flex flex-col items-center">
            <Flame size={24} className="text-orange-500 mb-1" />
            <span className="text-2xl font-bold">{streak}</span>
            <span className="text-xs text-gray-400">أيام الانضباط</span>
          </div>
          <div className="bg-gray-800/60 p-4 rounded-xl border border-cyan-500/20 w-32 flex flex-col items-center">
            <Sparkles size={24} className="text-cyan-500 mb-1" />
            <span className="text-2xl font-bold">{score}%</span>
            <span className="text-xs text-gray-400">نقاط اليوم</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-900/50 p-2 rounded-xl w-fit border border-gray-800">
        {[
          { id: 'today', icon: <Sparkles size={18}/>, label: 'روتين اليوم' },
          { id: 'library', icon: <Library size={18}/>, label: 'مكتبة الروتينات' },
          { id: 'grooming', icon: <ShoppingCart size={18}/>, label: 'خزانة العناية' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as Tab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${
              activeTab === t.id ? 'bg-gray-800 text-white shadow-lg border border-gray-700' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"/></div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'today' && (
            <motion.div key="today" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
              {todayRoutines.length === 0 ? (
                <div className="text-center py-20 text-gray-500">لا يوجد روتينات مخصصة لليوم. قم ببنائها من مكتبة الروتينات.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {todayRoutines.map(r => (
                    <div key={r.id} className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gray-700">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500" 
                             style={{width: `${Math.round((r.steps.filter((s:any)=>s.completed).length / r.steps.length)*100)}%`}} />
                      </div>
                      
                      <div className="flex justify-between items-start mb-6 pt-2">
                        <div>
                          <h3 className="text-2xl font-bold mb-1">{r.name}</h3>
                          <span className="text-sm text-gray-400 bg-gray-900 px-3 py-1 rounded-full">{r.steps.length} خطوات</span>
                        </div>
                        <button onClick={() => startRoutineMode(r)} className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all">
                          <Play size={18} fill="currentColor" /> وضع التنفيذ 
                        </button>
                      </div>

                      <div className="space-y-3">
                        {r.steps.map((s: any) => (
                          <div key={s.id} onClick={() => toggleStep(r.id, s.id, s.completed)}
                               className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${
                                s.completed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                               }`}>
                            {s.completed ? <CheckCircle className="text-emerald-500 shrink-0"/> : <Circle className="text-gray-500 shrink-0"/>}
                            <span className={`text-lg font-medium flex-1 ${s.completed ? 'line-through opacity-70' : ''}`}>{s.stepName}</span>
                            <span className="text-sm text-gray-500 flex items-center gap-1"><Clock size={14}/> {s.estimatedTime} د</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div key="library" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
              <LibraryBuilder refresh={refreshData} library={library} />
            </motion.div>
          )}

          {activeTab === 'grooming' && (
            <motion.div key="grooming" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
              <GroomingOS refresh={refreshData} grooming={grooming} alerts={alerts} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Routine Mode Modal (Full Screen Overlay) */}
      <AnimatePresence>
        {routineMode && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} 
            className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center p-6">
            <button onClick={() => setRoutineMode(null)} className="absolute top-8 left-8 text-gray-500 hover:text-white flex items-center gap-2">
              <StopCircle size={24} /> إنهاء
            </button>
            
            <div className="w-full max-w-2xl text-center">
              <h4 className="text-emerald-500 font-bold mb-4">{routineMode.routine.name}</h4>
              <div className="flex gap-2 mb-12 justify-center">
                {routineMode.routine.steps.map((s:any, idx:number) => (
                  <div key={s.id} className={`h-2 flex-1 rounded-full ${idx < routineMode.currentStepIdx ? 'bg-emerald-500' : idx === routineMode.currentStepIdx ? 'bg-cyan-400' : 'bg-gray-800'}`} />
                ))}
              </div>
              
              <motion.div key={routineMode.currentStepIdx} initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="mb-12">
                <h2 className="text-5xl font-black mb-6">{routineMode.routine.steps[routineMode.currentStepIdx]?.stepName}</h2>
                <div className="text-3xl font-mono text-gray-400 flex items-center justify-center gap-3">
                  <Clock size={32} /> 
                  {Math.floor(routineMode.timer / 60).toString().padStart(2, '0')}:{(routineMode.timer % 60).toString().padStart(2, '0')}
                </div>
              </motion.div>

              <button onClick={nextModeStep} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-gray-900 text-2xl font-black px-12 py-6 rounded-3xl hover:scale-105 transition-all shadow-emerald-500/20 shadow-2xl">
                {routineMode.currentStepIdx + 1 === routineMode.routine.steps.length ? 'تم إنهاء الروتين 🎉' : 'Done & Next'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ── SUB-COMPONENT: LIBRARY BUILDER ─────────────────
function LibraryBuilder({ refresh, library }: { refresh: () => void, library: any[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'daily', category: 'health', daysOfWeek: [] as number[], steps: [{ stepName: '', estimatedTime: 5 }] });

  const handleAdd = async () => {
    if (!form.name) return;
    await api.createRoutine(form);
    setShowAdd(false);
    refresh();
  };

  const del = async (id: number) => {
    if (confirm('تأكيد الحذف؟')) {
      await api.deleteRoutine(id);
      refresh();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Library className="text-cyan-500"/> روتيناتي (Library)</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Plus size={18}/> روتين جديد</button>
      </div>

      {showAdd && (
        <div className="bg-gray-800 p-6 rounded-2xl mb-8 border border-gray-700">
          <input className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 mb-4 font-bold text-xl" placeholder="اسم الروتين (مثل: روتين البشرة)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <div className="flex gap-4 mb-6">
            <select className="bg-gray-900 border border-gray-700 rounded-xl p-3" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="daily">يومي</option><option value="weekly">أسبوعي</option>
            </select>
          </div>
          <p className="font-bold mb-2">الخطوات:</p>
          {form.steps.map((s, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-3" placeholder="مهمة في الروتين" value={s.stepName} onChange={e => { const n = [...form.steps]; n[idx].stepName = e.target.value; setForm({...form, steps: n}); }} />
              <input type="number" className="w-24 bg-gray-900 border border-gray-700 rounded-xl p-3" placeholder="دقائق" value={s.estimatedTime} onChange={e => { const n = [...form.steps]; n[idx].estimatedTime = Number(e.target.value); setForm({...form, steps: n}); }} />
            </div>
          ))}
          <button onClick={() => setForm({...form, steps: [...form.steps, { stepName: '', estimatedTime: 5 }]})} className="text-cyan-400 text-sm mb-6 flex items-center gap-1"><Plus size={14}/> إضافة خطوة أخرى</button>
          
          <button onClick={handleAdd} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-black text-lg">حفظ الروتين</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {library.map(r => (
          <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 opacity-90 hover:opacity-100 transition-all">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{r.name}</h3>
              <button onClick={() => del(r.id)} className="text-red-500/50 hover:text-red-400"><Trash2 size={18}/></button>
            </div>
            <div className="space-y-2">
              {r.steps.map((s:any) => (
                <div key={s.id} className="text-gray-400 text-sm bg-gray-800 p-2 rounded-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"/> {s.stepName} ({s.estimatedTime} د)
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SUB-COMPONENT: GROOMING / SMART SHOPPING ────────
function GroomingOS({ refresh, grooming, alerts }: { refresh: () => void, grooming: any[], alerts: any[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Skincare', estimatedDurationDays: 30, usagePerDay: 1 });

  const add = async () => {
    await api.createGrooming(form);
    setShowAdd(false); refresh();
  };

  const del = async (id: number) => {
    if(confirm('متأكد؟')) { await api.deleteGrooming(id); refresh(); }
  }

  return (
    <div>
      {/* Smart Alert Section */}
      {alerts.length > 0 && (
        <div className="mb-8 border border-red-500/30 bg-red-500/10 rounded-2xl p-6">
          <h2 className="text-red-400 font-bold mb-4 flex items-center gap-2 text-xl"><ShoppingCart size={22}/> Smart Shopping List (الاحتياجات الحالية)</h2>
          <div className="grid gap-3">
            {alerts.map((a:any) => (
              <div key={a.id} className="bg-gray-900 border border-red-900/50 px-5 py-3 rounded-xl flex justify-between items-center">
                <span className="font-bold text-lg">{a.name}</span>
                {a.daysLeft <= 0 ? (
                  <span className="text-red-500 flex items-center gap-1 text-sm bg-red-500/10 px-3 py-1 rounded-full"><AlertCircle size={14}/> انتهى تماماً!</span>
                ) : (
                  <span className="text-orange-400 text-sm bg-orange-500/10 px-3 py-1 rounded-full">متبقي {a.daysLeft} أيام</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="text-pink-500"/> العناصر الشخصية (Inventory)</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Plus size={18}/> إضافة عنصر</button>
      </div>

      {showAdd && (
         <div className="bg-gray-800 p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-4">
           <input className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-3" placeholder="اسم المنتج (غسول CeraVe)" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
           <input type="number" className="w-32 bg-gray-900 border border-gray-700 rounded-xl p-3" placeholder="يكفي كم يوم؟" value={form.estimatedDurationDays} onChange={e=>setForm({...form, estimatedDurationDays: Number(e.target.value)})} />
           <button onClick={add} className="bg-pink-600 hover:bg-pink-500 px-8 rounded-xl font-bold">إضافة</button>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {grooming.map(g => {
          // Progress Calculation
          const start = new Date(g.startDate);
          const diff = Math.ceil(Math.abs(new Date().getTime() - start.getTime()) / (1000 * 3600 * 24));
          const daysLeft = g.estimatedDurationDays - diff;
          const percentage = Math.max(0, Math.min(100, Math.round((daysLeft / g.estimatedDurationDays) * 100)));
          
          let color = 'bg-emerald-500'; let txtColor = 'text-emerald-500';
          if (daysLeft <= g.reminderDaysBefore && daysLeft > 0) { color = 'bg-orange-500'; txtColor = 'text-orange-500'; }
          if (daysLeft <= 0) { color = 'bg-red-500'; txtColor = 'text-red-500'; }

          return (
            <div key={g.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 relative overflow-hidden group">
              <button onClick={()=>del(g.id)} className="absolute top-4 left-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg bg-gray-800 ${txtColor} bg-opacity-10`}>
                   <Sparkles size={20}/>
                </div>
                <div>
                  <h4 className="font-bold text-lg leading-tight">{g.name}</h4>
                  <p className="text-xs text-gray-500">منتد: {g.category}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>متبقي {Math.max(0, daysLeft)} يوم</span>
                  <span>{percentage}%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                   <div className={`h-full ${color} transition-all`} style={{width: `${percentage}%`}} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
