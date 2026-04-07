'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar as CalendarIcon, Cake, Video, Bell, Plus, Trash2, Search, Star, MessageSquare, 
  History, ChevronLeft, ChevronRight, MoreVertical, UserPlus, Clock, AlertTriangle, CheckCircle2,
  Lock, ExternalLink, Filter, Grid, List, LayoutGrid, Timer
} from 'lucide-react';

interface Person {
  id: number;
  name: string;
  relationship: string;
  notes: string;
  importanceLevel: number;
  lastInteraction: string | null;
  createdAt: string;
}

interface Event {
  id: number;
  title: string;
  type: 'birthday' | 'meeting' | 'reminder' | 'holiday';
  date: string;
  time?: string | null;
  endTime?: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'upcoming' | 'done' | 'missed';
  repeat: 'none' | 'yearly' | 'monthly';
  personId: number | null;
  personName?: string;
  reminderBeforeDays: number;
  notes: string;
  isToday?: boolean;
  daysUntil?: number;
}

const api = {
  getPeople: () => fetch('/api/people').then(r => r.json()),
  addPerson: (data: any) => fetch('/api/people', { method: 'POST', body: JSON.stringify(data) }),
  deletePerson: (id: number) => fetch(`/api/people?id=${id}`, { method: 'DELETE' }),
  getEvents: () => fetch('/api/events/today').then(r => r.json()),
  addEvent: (data: any) => fetch('/api/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEventStatus: (id: number, status: string) => fetch('/api/events', { method: 'PATCH', body: JSON.stringify({ id, status }) }),
  deleteEvent: (id: number) => fetch(`/api/events?id=${id}`, { method: 'DELETE' }),
};

// --- SUB-COMPONENT: LIVE COUNTDOWN ---
const LiveCountdown = ({ eventDate, eventTime }: { eventDate: string, eventTime?: string | null }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const target = new Date(`${eventDate}T${eventTime || '00:00'}:00`);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('حدث الآن');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);

      if (days > 0) setTimeLeft(`${days} يوم و ${hours} ساعة`);
      else if (hours > 0) setTimeLeft(`${hours} ساعة و ${mins} دقيقة`);
      else setTimeLeft(`${mins} دقيقة`);
    };

    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [eventDate, eventTime]);

  return (
    <span className="flex items-center gap-1">
      <Timer size={14} className="animate-pulse" />
      {timeLeft}
    </span>
  );
};

export default function EventsClient() {
  const [people, setPeople] = useState<Person[]>([]);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'people' | 'timeline' | 'calendar'>('timeline');
  const [calendarView, setCalendarView] = useState<'monthly' | 'weekly'>('monthly');
  const [search, setSearch] = useState('');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const [personForm, setPersonForm] = useState({ name: '', relationship: 'friend', notes: '', importanceLevel: 3 });
  const [eventForm, setEventForm] = useState({ 
    title: '', type: 'reminder', date: new Date().toISOString().split('T')[0], 
    time: '10:00', endTime: '11:00', repeat: 'none', personId: '' as any, 
    reminderBeforeDays: 1, notes: '', priority: 'medium' 
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const pData = await api.getPeople();
      const eData = await api.getEvents();
      setPeople(pData.people || []);
      setTodayEvents(eData.todayEvents || []);
      setUpcomingEvents(eData.upcomingEvents || []);
      setAllEvents(eData.allEvents || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addPerson(personForm);
    setShowAddPerson(false);
    setPersonForm({ name: '', relationship: 'friend', notes: '', importanceLevel: 3 });
    loadData();
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addEvent({ ...eventForm, personId: eventForm.personId ? parseInt(eventForm.personId) : null });
    setShowAddEvent(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف؟')) return;
    await api.deleteEvent(id);
    loadData();
  };

  const handleUpdateStatus = async (id: number, status: string) => {
     await api.updateEventStatus(id, status);
     loadData();
  };

  // Conflict Detection Logic
  const conflicts = useMemo(() => {
     const map: Record<string, number[]> = {};
     allEvents.forEach(e => {
        if (!e.time) return;
        const key = `${e.date}`;
        if (!map[key]) map[key] = [];
        map[key].push(e.id);
     });
     // Simple version: just flag days with >1 event as "Busy"
     return map;
  }, [allEvents]);

  const getPriorityColor = (p: string) => {
     if (p === 'high') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
     if (p === 'medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
     return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const getCountdownColor = (e: Event) => {
     if (!e.isToday) return 'text-emerald-400';
     const now = new Date();
     const eventDate = new Date(`${e.date}T${e.time || '00:00'}:00`);
     const diff = eventDate.getTime() - now.getTime();
     if (diff < 3 * 60 * 60 * 1000) return 'text-rose-500 font-bold'; // 3 hours
     if (diff < 24 * 60 * 60 * 1000) return 'text-amber-500'; // 24 hours
     return 'text-emerald-500';
  };

  return (
    <div className="text-gray-100 min-h-screen pb-20">
      {/* 🚀 PRO HEADER: LIVE TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
         {/* Live Timeline Section */}
         <div className="lg:col-span-3 grand-card p-10 bg-gradient-to-br from-gray-900 via-gray-950 to-indigo-950/30 border-blue-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <Timer size={120} />
            </div>
            
            <div className="relative z-10">
               <h2 className="text-4xl font-black mb-10 flex items-center gap-4">
                  Live Timeline <span className="text-blue-400 eng-num text-xl opacity-60">Today's Pulse</span>
               </h2>
               
               <div className="flex flex-col gap-6">
                  {todayEvents.length > 0 ? todayEvents.map(e => (
                    <motion.div key={e.id} layout initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-blue-500/40 transition-all shadow-xl shadow-black/20">
                       <div className={`p-5 rounded-2xl ${e.type === 'meeting' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {e.type === 'meeting' ? <Video size={32} /> : <Cake size={32} />}
                       </div>
                       
                       <div className="flex-1">
                          <div className="flex items-center gap-3">
                             <h3 className="text-2xl font-black text-white">{e.title}</h3>
                             <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(e.priority)}`}>
                                {e.priority}
                             </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-gray-500 font-bold">
                             <span className="flex items-center gap-1"><Clock size={14}/> {e.time || '--:--'}</span>
                             <span className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
                             <span className={getCountdownColor(e)}>
                                <LiveCountdown eventDate={e.date} eventTime={e.time} />
                             </span>
                          </div>
                       </div>
                       
                       <div className="flex gap-2">
                          <button onClick={() => handleUpdateStatus(e.id, 'done')} className="p-4 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-2xl transition-all"><CheckCircle2 size={24}/></button>
                       </div>
                    </motion.div>
                  )) : (
                    <div className="py-20 text-center">
                       <p className="text-gray-600 text-2xl font-black italic">جدولك اليوم هادئ جداً... استرخِ قليلاً ☕</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Stats / Quick Actions */}
         <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="grand-card p-8 bg-white/2 border-white/10 flex-1 flex flex-col justify-center items-center text-center">
               <div className="text-6xl font-black text-blue-400 mb-2">{todayEvents.length}</div>
               <p className="text-gray-500 font-black uppercase tracking-widest text-sm">مواعيد اليوم</p>
            </div>
            <button onClick={() => setShowAddEvent(true)} className="mega-action-btn bg-blue-500 text-black py-6 text-xl shadow-blue-500/20">
               <Plus size={24} /> إضافة لقاء جديد
            </button>
            <button onClick={() => setActiveTab('people')} className="mega-action-btn bg-white/5 text-white border-white/10 py-6 text-xl">
               <Users size={24} /> دليل الأشخاص
            </button>
         </div>
      </div>

      {/* 🧭 NAVIGATION TABS */}
      <div className="flex items-center justify-between mb-8 px-4">
         <div className="flex gap-2 p-2 bg-gray-900 border border-white/5 rounded-3xl">
            <button onClick={() => setActiveTab('timeline')} className={`px-8 py-3 rounded-2xl font-black transition-all ${activeTab === 'timeline' ? 'bg-blue-500 text-black shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-white'}`}>Timeline</button>
            <button onClick={() => setActiveTab('calendar')} className={`px-8 py-3 rounded-2xl font-black transition-all ${activeTab === 'calendar' ? 'bg-blue-500 text-black shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-white'}`}>Calendar</button>
         </div>
         
         {activeTab === 'timeline' && (
           <div className="flex gap-4 items-center">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest hidden md:block">Filter by type:</span>
              <div className="flex gap-2">
                 {['all', 'meeting', 'personal', 'reminder'].map(f => (
                   <button key={f} className="px-4 py-2 bg-gray-900 border border-white/5 rounded-xl text-xs font-black hover:border-blue-500 transition-all uppercase">{f}</button>
                 ))}
              </div>
           </div>
         )}
      </div>

      {/* 🖼️ CONTENT AREA */}
      <AnimatePresence mode="wait">
        {activeTab === 'timeline' && (
          <motion.div key="tm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-12">
             {/* Dynamic Grouping by Date */}
             {['Next 7 Days', 'Next 30 Days'].map(group => (
               <div key={group} className="space-y-6">
                  <h3 className="text-xl font-black text-gray-500 flex items-center gap-3 px-4">
                    <History size={18}/> {group}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingEvents.filter(e => group === 'Next 7 Days' ? e.daysUntil! <= 7 : e.daysUntil! > 7).map(e => (
                      <div key={e.id} className="grand-card p-8 bg-gray-950/40 border-white/5 hover:border-blue-500/40 group transition-all">
                         <div className="flex justify-between mb-6">
                            <div className="p-3 bg-gray-900 rounded-xl text-blue-400"><CalendarIcon size={20}/></div>
                            <div className="flex items-center gap-2">
                               {conflicts[e.date]?.length > 1 && <span title="تعارض في المواعيد"><AlertTriangle size={16} className="text-amber-500" /></span>}
                               <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black">
                                 {e.daysUntil === 1 ? 'غداً' : `بعد ${e.daysUntil} يوم`}
                               </span>
                            </div>
                         </div>
                         <h4 className="text-2xl font-black text-white mb-2">{e.title}</h4>
                         <div className="flex items-center gap-4 text-xs font-bold text-gray-500 mb-6">
                            <span className="flex items-center gap-1"><Clock size={12}/> {e.time || '--:--'}</span>
                            <span>•</span>
                            <span className="uppercase tracking-widest">{e.type}</span>
                         </div>
                         <div className="flex justify-between items-center bg-black/30 p-4 rounded-2xl border border-white/5">
                            <span className="text-gray-500 text-xs font-black">{e.personName || 'إشعار شخصي'}</span>
                            <button onClick={() => handleDelete(e.id)} className="p-2 text-gray-800 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
             ))}
          </motion.div>
        )}

        {activeTab === 'calendar' && (
           <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grand-card bg-gray-950/50 border-white/10 p-12 overflow-hidden relative">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-3xl font-black">Calendar View</h2>
                 <div className="flex gap-2">
                    <button onClick={() => setCalendarView('monthly')} className={`p-3 rounded-xl transition-all ${calendarView === 'monthly' ? 'bg-blue-500 text-black' : 'bg-gray-900 text-gray-500'}`}><Grid size={20}/></button>
                    <button onClick={() => setCalendarView('weekly')} className={`p-3 rounded-xl transition-all ${calendarView === 'weekly' ? 'bg-blue-500 text-black' : 'bg-gray-900 text-gray-500'}`}><List size={20}/></button>
                 </div>
              </div>
              
              <div className="grid grid-cols-7 gap-4">
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-xs font-black text-gray-600 uppercase mb-4">{d}</div>)}
                 {[...Array(35)].map((_, i) => {
                    const day = i - 4; // Mock logic for simplicity
                    const isToday = day === new Date().getDate();
                    const hasEvents = day > 0 && day < 30 && (day % 4 === 0);
                    return (
                      <div key={i} className={`aspect-square rounded-3xl border ${isToday ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-white/5 bg-white/2'} p-4 flex flex-col justify-between group hover:border-gray-600 transition-all cursor-pointer`}>
                         <span className={`font-black eng-num ${isToday ? 'text-blue-400' : day > 0 ? 'text-gray-400' : 'text-gray-800'}`}>{day > 0 && day <= 31 ? day : ''}</span>
                         {hasEvents && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
                      </div>
                    );
                 })}
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center bg-gray-950/40 backdrop-blur-[2px]">
                 <div className="bg-gray-900 px-8 py-3 rounded-2xl border border-white/10 font-black text-gray-500 shadow-2xl">Calendar Engine Coming Soon...</div>
              </div>
           </motion.div>
        )}

        {activeTab === 'people' && (
           <motion.div key="pe" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div onClick={() => setShowAddPerson(true)} className="grand-card p-10 border-dashed border-white/10 hover:border-blue-500/40 flex flex-col items-center justify-center gap-6 cursor-pointer group transition-all bg-white/1">
                 <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserPlus size={32} />
                 </div>
                 <span className="text-xl font-black text-gray-500 group-hover:text-white transition-colors">إضافة بطل جديد</span>
              </div>

              {people.map(p => (
                <div key={p.id} className="grand-card p-10 bg-gray-950/50 border-white/5 group relative">
                   <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-3xl mb-8 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20">
                      {p.name.charAt(0)}
                   </div>
                   <h4 className="text-3xl font-black text-white mb-2">{p.name}</h4>
                   <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-6">{p.relationship}</p>
                   <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                         <Star key={i} size={16} className={`${i < p.importanceLevel ? 'text-amber-400 fill-amber-400' : 'text-gray-800'}`} />
                      ))}
                   </div>
                </div>
              ))}
           </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 MODAL: ADD EVENT PROFESSIONAL */}
      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
           <motion.form initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onSubmit={handleAddEvent} className="grand-card p-12 bg-gray-950 border-white/10 w-full max-w-2xl space-y-10 shadow-[0_0_100px_rgba(59,130,246,0.1)] overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center">
                 <h3 className="text-4xl font-black text-white flex items-center gap-4"><Plus className="text-blue-500" size={32}/> الموعد القادم</h3>
                 <button type="button" onClick={() => setShowAddEvent(false)} className="p-3 text-gray-600 hover:text-white"><XCircle size={32}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-8">
                    <div>
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">العنوان</label>
                       <input required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder="ماذا يحدث؟" className="w-full bg-white/5 border border-white/5 p-5 rounded-3xl text-2xl font-black focus:border-blue-500 outline-none transition-all" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">النوع</label>
                          <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value as any})} className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl font-black text-lg">
                             <option value="meeting">💼 اجتماع عمل</option>
                             <option value="personal">❤️ شخصي</option>
                             <option value="birthday">🎂 عيد ميلاد</option>
                             <option value="reminder">🔔 تذكير</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">الأهمية</label>
                          <select value={eventForm.priority} onChange={e => setEventForm({...eventForm, priority: e.target.value as any})} className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl font-black text-lg">
                             <option value="low">Low</option>
                             <option value="medium">Medium</option>
                             <option value="high">Critical</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">التاريخ</label>
                          <input type="date" required value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl font-black text-lg" />
                       </div>
                       <div>
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">الوقت</label>
                          <input type="time" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl font-black text-lg" />
                       </div>
                    </div>

                    <div>
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">شخص مرتبط</label>
                       <select value={eventForm.personId} onChange={e => setEventForm({...eventForm, personId: e.target.value})} className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl font-black text-lg">
                          <option value="">بدون شخص محدد</option>
                          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>

                    <div>
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">تكرار</label>
                       <select value={eventForm.repeat} onChange={e => setEventForm({...eventForm, repeat: e.target.value as any})} className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl font-black text-lg uppercase tracking-tight">
                          <option value="none">مرة واحدة فقط</option>
                          <option value="yearly">تكرار سنوي</option>
                          <option value="monthly">تكرار شهري</option>
                       </select>
                    </div>
                 </div>
              </div>

              <div className="flex gap-6 pt-10">
                 <button type="submit" className="mega-action-btn bg-blue-500 text-black py-6 text-2xl flex-1 shadow-blue-500/20">تثبيت المهمة في الأجندة</button>
                 <button type="button" onClick={() => setShowAddEvent(false)} className="mega-action-btn bg-white/5 text-gray-600 border-white/10 py-6 text-xl px-10">إلغاء</button>
              </div>
           </motion.form>
        </div>
      )}

       {/* Add Person Modal */}
       {showAddPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
           <motion.form initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onSubmit={handleAddPerson} className="grand-card p-12 bg-gray-900 border-white/10 w-full max-w-lg space-y-8 shadow-[0_0_100px_rgba(59,130,246,0.1)]">
              <h3 className="text-3xl font-black text-white">إضافة شخص للدليل</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">الاسم بالكامل</label>
                    <input required value={personForm.name} onChange={e => setPersonForm({...personForm, name: e.target.value})} className="w-full bg-gray-800 border border-white/5 p-5 rounded-3xl text-xl font-black outline-none focus:border-blue-500 transition-all" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">العلاقة</label>
                        <select value={personForm.relationship} onChange={e => setPersonForm({...personForm, relationship: e.target.value})} className="w-full bg-gray-800 border border-white/5 p-4 rounded-2xl font-black">
                           <option value="friend">صديق</option>
                           <option value="family">عائلة</option>
                           <option value="business">عمل</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">الأهمية (1-5)</label>
                        <input type="number" min="1" max="5" value={personForm.importanceLevel} onChange={e => setPersonForm({...personForm, importanceLevel: parseInt(e.target.value)})} className="w-full bg-gray-800 border border-white/5 p-4 rounded-2xl font-black text-center" />
                    </div>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button type="submit" className="mega-action-btn flex-1 bg-blue-500 text-black">حفظ الشخص</button>
                 <button type="button" onClick={() => setShowAddPerson(false)} className="mega-action-btn flex-1 bg-white/5 text-gray-500 border-white/10">إلغاء</button>
              </div>
           </motion.form>
        </div>
      )}

    </div>
  );
}

const XCircle = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);
