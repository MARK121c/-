'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar as CalendarIcon, Cake, Video, Bell, Plus, Trash2, Search, Star, MessageSquare, 
  History, ChevronLeft, ChevronRight, MoreVertical, UserPlus, Clock, AlertTriangle, CheckCircle2,
  Lock, ExternalLink, Filter, Grid, List, LayoutGrid, Timer, X, Coffee, Phone, Send, Info, HeartPulse
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
  updateLastInteraction: (id: number) => fetch('/api/people', { method: 'PATCH', body: JSON.stringify({ id }) }),
  getEvents: () => fetch('/api/events/today').then(r => r.json()),
  addEvent: (data: any) => fetch('/api/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEventStatus: (id: number, status: string) => fetch('/api/events', { method: 'PATCH', body: JSON.stringify({ id, status }) }),
  deleteEvent: (id: number) => fetch(`/api/events?id=${id}`, { method: 'DELETE' }),
};

// --- SUB-COMPONENT: LIVE COUNTDOWN ---
const LiveCountdown = ({ eventDate, eventTime }: { eventDate: string, eventTime?: string | null }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const target = new Date(`${eventDate}T${eventTime || '00:00'}:00`);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
         setTimeLeft(null);
         return;
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / (1000 * 60)) % 60),
        s: Math.floor((diff / 1000) % 60)
      });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [eventDate, eventTime]);

  if (!timeLeft) return <span className="text-rose-500 font-black animate-pulse">حدث الآن 🚀</span>;

  return (
    <div className="flex gap-4 eng-num" dir="ltr">
       {timeLeft.d > 0 && (
         <div className="flex flex-col items-center">
            <span className="text-3xl font-black">{timeLeft.d}</span>
            <span className="text-[10px] uppercase opacity-40">Days</span>
         </div>
       )}
       <div className="flex flex-col items-center">
          <span className="text-3xl font-black">{timeLeft.h.toString().padStart(2, '0')}</span>
          <span className="text-[10px] uppercase opacity-40">Hrs</span>
       </div>
       <div className="flex flex-col items-center">
          <span className="text-3xl font-black">{timeLeft.m.toString().padStart(2, '0')}</span>
          <span className="text-[10px] uppercase opacity-40">Mins</span>
       </div>
       <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-blue-400">{timeLeft.s.toString().padStart(2, '0')}</span>
          <span className="text-[10px] uppercase opacity-40">Secs</span>
       </div>
    </div>
  );
};

export default function EventsClient() {
  const [people, setPeople] = useState<Person[]>([]);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'agenda' | 'social' | 'calendar'>('overview');
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
      console.error('Error loading data:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addPerson(personForm);
      if (!res.ok) throw new Error('Failed');
      setShowAddPerson(false);
      setPersonForm({ name: '', relationship: 'friend', notes: '', importanceLevel: 3 });
      loadData();
    } catch (err) { alert('خطأ في الإضافة'); }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...eventForm, personId: eventForm.personId ? parseInt(eventForm.personId) : null };
      const res = await api.addEvent(payload);
      if (!res.ok) throw new Error('Failed');
      setShowAddEvent(false);
      loadData();
    } catch (err) { alert('خطأ في الإضافة'); }
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

  const handleLogInteraction = async (id: number) => {
     await api.updateLastInteraction(id);
     loadData();
  };

  const nextEvent = useMemo(() => {
     const combined = [...todayEvents, ...upcomingEvents].filter(e => e.status === 'upcoming');
     return combined.sort((a,b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime())[0];
  }, [todayEvents, upcomingEvents]);

  const socialNeeds = useMemo(() => {
     return people
       .map(p => {
         const lastDate = p.lastInteraction ? new Date(p.lastInteraction) : new Date(p.createdAt);
         const daysSince = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
         return { ...p, daysSince };
       })
       .sort((a,b) => b.daysSince - a.daysSince)
       .slice(0, 4);
  }, [people]);

  return (
    <div className="text-gray-100 min-h-screen pb-40 space-y-12" dir="rtl">
      
      {/* 🌌 PULSE HEADER: THE NEXT BIG THING */}
      <AnimatePresence mode="wait">
        {nextEvent && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative grand-card overflow-hidden p-1 p-[2px] bg-gradient-to-br from-blue-500/40 via-purple-500/20 to-transparent">
             <div className="grand-card bg-gray-950/90 backdrop-blur-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="space-y-4 text-right">
                   <div className="flex items-center gap-3 text-blue-400 font-black uppercase tracking-[0.2em] text-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" /> اللقاء القادم حاسم
                   </div>
                   <h1 className="text-4xl md:text-6xl font-black text-white">{nextEvent.title}</h1>
                   <div className="flex items-center gap-4 text-gray-500 text-lg">
                      <span className="flex items-center gap-2"><Clock size={20}/> <span className="eng-num">{nextEvent.time || '--:--'}</span></span>
                      <span className="w-2 h-2 rounded-full bg-gray-800" />
                      <span className="flex items-center gap-2 font-black text-white border-b-2 border-blue-500/50 pb-1 uppercase tracking-widest">{nextEvent.type}</span>
                   </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 backdrop-blur-md shadow-2xl relative group">
                   <div className="absolute inset-0 bg-blue-500/5 rounded-[3rem] blur-2xl group-hover:bg-blue-500/10 transition-all" />
                   <div className="relative z-10">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 text-center">العد التنازلي للحدث</p>
                      <LiveCountdown eventDate={nextEvent.date} eventTime={nextEvent.time} />
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🧭 NAVIGATION: COMMAND TABS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
         <div className="flex gap-2 p-2 bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: <LayoutGrid size={18}/> },
              { id: 'agenda', label: 'الجدول الزمني', icon: <CalendarIcon size={18}/> },
              { id: 'social', label: 'دليل الأبطال', icon: <Users size={18}/> },
              { id: 'calendar', label: 'التقويم الكامل', icon: <Grid size={18}/> }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black transition-all relative ${activeTab === tab.id ? 'text-black' : 'text-gray-500 hover:text-white'}`}
              >
                 {activeTab === tab.id && <motion.div layoutId="tabActive" className="absolute inset-0 bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] rounded-[2rem]" />}
                 <span className="relative z-10 flex items-center gap-2">{tab.icon} {tab.label}</span>
              </button>
            ))}
         </div>

         <div className="flex gap-4">
            <button onClick={() => setShowAddEvent(true)} className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-3xl font-black hover:bg-blue-400 transition-all shadow-xl active:scale-95">
               <Plus size={20}/> موعد جديد
            </button>
            <button onClick={() => setShowAddPerson(true)} className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-3xl font-black hover:bg-white/10 transition-all active:scale-95">
               <UserPlus size={20}/> إضافة بطل
            </button>
         </div>
      </div>

      {/* 🖼️ CONTENT AREA */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="ov" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             {/* Today's Timeline Column */}
             <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between px-4">
                   <h3 className="text-2xl font-black flex items-center gap-3"><Clock className="text-blue-500"/> أجندة الـ 24 ساعة</h3>
                   <span className="text-xs font-black text-gray-500 bg-white/5 px-4 py-1 rounded-full uppercase tracking-widest eng-num">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>

                <div className="space-y-4">
                   {todayEvents.length > 0 ? todayEvents.map(e => (
                     <div key={e.id} className="grand-card p-6 bg-white/[0.03] border-white/5 hover:border-blue-500/30 group transition-all flex items-center gap-6">
                        <div className={`p-4 rounded-2xl ${e.type === 'meeting' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                           {e.type === 'meeting' ? <Video size={24}/> : e.type === 'birthday' ? <Cake size={24}/> : <Bell size={24}/>}
                        </div>
                        <div className="flex-1">
                           <h4 className="text-xl font-black group-hover:text-blue-400 transition-colors">{e.title}</h4>
                           <p className="text-gray-500 font-bold text-sm">{e.personName || 'تذكير شخصي'} · <span className="eng-num opacity-60">{e.time || '--:--'}</span></p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleUpdateStatus(e.id, 'done')} className="p-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-xl transition-all"><CheckCircle2 size={20}/></button>
                           <button onClick={() => handleDelete(e.id)} className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"><Trash2 size={20}/></button>
                        </div>
                     </div>
                   )) : (
                     <div className="grand-card p-20 text-center border-dashed border-white/10 bg-white/1">
                        <p className="text-2xl font-black text-gray-600 italic">اليوم هادئ جداً.. استمتع بوقتك ☕</p>
                     </div>
                   )}
                </div>

                {upcomingEvents.length > 0 && (
                   <>
                     <h3 className="text-2xl font-black flex items-center gap-3 pt-8 px-4"><History className="text-gray-500"/> الغد وما بعده</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcomingEvents.slice(0, 4).map(e => (
                          <div key={e.id} className="grand-card p-6 bg-black/40 border-white/5 flex flex-col justify-between hover:border-white/20 transition-all">
                             <div className="flex justify-between items-start mb-6">
                                <div className="text-blue-400 font-black flex flex-col">
                                   <span className="text-[10px] uppercase opacity-40">التاريخ</span>
                                   <span className="text-lg eng-num">{new Date(e.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
                                </div>
                                <span className="bg-white/5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter text-gray-400">باقي {e.daysUntil} يوم</span>
                             </div>
                             <h4 className="text-lg font-black text-white line-clamp-1">{e.title}</h4>
                          </div>
                        ))}
                     </div>
                   </>
                )}
             </div>

             {/* Social Health Sidebar */}
             <div className="space-y-8">
                <h3 className="text-2xl font-black flex items-center gap-3 px-4"><HeartPulse className="text-rose-500"/> الصحة الاجتماعية</h3>
                <div className="space-y-4">
                   {socialNeeds.map(p => (
                     <div key={p.id} className="grand-card p-6 bg-gradient-to-br from-rose-500/5 to-transparent border-rose-500/10 flex items-center gap-5 group">
                        <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center text-xl font-black border border-rose-500/20 group-hover:scale-110 transition-transform shadow-xl shadow-rose-500/10">
                           {p.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                           <h4 className="text-lg font-black">{p.name}</h4>
                           <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${p.daysSince > 30 ? 'text-rose-500' : p.daysSince > 14 ? 'text-amber-500' : 'text-gray-500'}`}>
                              تآخرت لـ <span className="eng-num">{p.daysSince}</span> يوم
                           </p>
                        </div>
                        <button onClick={() => handleLogInteraction(p.id)} className="p-4 bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-rose-500/20 rounded-2xl transition-all" title="تحديث التواصل">
                           <Coffee size={20}/>
                        </button>
                     </div>
                   ))}
                   <button onClick={() => setActiveTab('social')} className="w-full py-4 text-xs font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest">عرض الدليل الكامل →</button>
                </div>
             </div>

          </motion.div>
        )}

        {activeTab === 'agenda' && (
           <motion.div key="ag" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {allEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(e => (
                   <div key={e.id} className="grand-card p-8 bg-gray-900/40 border-white/5 hover:border-blue-500/20 transition-all flex flex-col h-full relative group">
                      <div className="absolute top-4 left-4 flex gap-2">
                         <button onClick={() => handleUpdateStatus(e.id, 'done')} className="p-2 text-gray-600 hover:text-emerald-500 transition-colors"><CheckCircle2 size={16}/></button>
                         <button onClick={() => handleDelete(e.id)} className="p-2 text-gray-600 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                      </div>
                      <div className="flex items-center gap-4 mb-6">
                         <div className="bg-blue-500/10 text-blue-400 p-3 rounded-2xl">
                            {e.type === 'meeting' ? <Video size={20}/> : e.type === 'birthday' ? <Cake size={20}/> : <Bell size={20}/>}
                         </div>
                         <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">{e.type}</p>
                            <p className="font-black text-xl text-white group-hover:text-blue-500 transition-colors">{e.title}</p>
                         </div>
                      </div>
                      <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center bg-black/20 p-4 rounded-xl">
                         <div className="flex flex-col">
                            <p className="text-[10px] font-black text-gray-500 uppercase">التوقيت</p>
                            <p className="text-sm font-black text-white eng-num">{new Date(e.date).toLocaleDateString('ar-EG')} · {e.time || '--:--'}</p>
                         </div>
                         <div className="flex -space-x-2 rtl:space-x-reverse">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-[10px] font-black border-2 border-gray-900" title={e.personName || 'شخصي'}>
                               {e.personName ? e.personName.charAt(0) : 'Me'}
                            </div>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </motion.div>
        )}

        {activeTab === 'social' && (
           <motion.div key="soc" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
              {/* Relationship Filters */}
              <div className="flex flex-wrap gap-4 px-4">
                 {['الجميع', 'صديق', 'عائلة', 'عمل', 'أهمية قصوى'].map(f => (
                   <button key={f} className="px-6 py-3 bg-white/5 border border-white/5 rounded-full text-sm font-black hover:border-blue-500 transition-all uppercase">{f}</button>
                 ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {people.map(p => (
                   <div key={p.id} className="grand-card p-10 bg-gray-950/50 border-white/5 hover:border-blue-500/20 group relative flex flex-col items-center text-center">
                      <div className="absolute top-4 left-4">
                         <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-800 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                      </div>
                      
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-[2rem] mb-8 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                         {p.name.charAt(0)}
                      </div>
                      
                      <h4 className="text-3xl font-black text-white mb-2">{p.name}</h4>
                      <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-6 px-4 py-1 bg-white/5 rounded-full">{p.relationship}</p>
                      
                      <div className="flex gap-1 mb-8">
                         {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} className={`${i < p.importanceLevel ? 'text-amber-400 fill-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'text-gray-800'}`} />
                         ))}
                      </div>

                      <div className="w-full flex gap-2">
                         <button onClick={() => handleLogInteraction(p.id)} className="flex-1 py-4 bg-blue-500 text-black rounded-2xl font-black hover:bg-blue-400 transition-all active:scale-95 text-xs">تفاعل سريع</button>
                         <button className="p-4 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-2xl transition-all"><Info size={16}/></button>
                      </div>
                   </div>
                 ))}
              </div>
           </motion.div>
        )}

        {activeTab === 'calendar' && (
           <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grand-card bg-gray-950/80 backdrop-blur-3xl border-white/10 p-12 overflow-hidden relative min-h-[600px]" dir="rtl">
              <div className="flex justify-between items-center mb-12">
                 <div>
                    <h2 className="text-4xl font-black text-white mb-2">أجندة الوقت</h2>
                    <p className="text-gray-500 font-bold">نظرة شمولية على تحركاتك عبر الزمن.</p>
                 </div>
                 <div className="flex gap-4">
                    <button className="p-4 bg-white/5 rounded-2xl text-gray-400"><ChevronRight size={24}/></button>
                    <span className="text-2xl font-black bg-white/5 px-8 py-3 rounded-2xl eng-num">أبريل 2024</span>
                    <button className="p-4 bg-white/5 rounded-2xl text-gray-400"><ChevronLeft size={24}/></button>
                 </div>
              </div>
              
              <div className="grid grid-cols-7 gap-4">
                 {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(d => <div key={d} className="text-center text-xs font-black text-gray-600 uppercase tracking-widest mb-6 opacity-40">{d}</div>)}
                 {[...Array(35)].map((_, i) => {
                    const day = i - 2; // Offset logic for demo
                    const isToday = day === new Date().getDate();
                    const dayEvents = allEvents.filter(e => new Date(e.date).getDate() === day);
                    const isBusy = dayEvents.length > 0;
                    
                    return (
                      <div key={i} className={`aspect-square rounded-3xl border ${isToday ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'border-white/5 bg-white/[0.02]'} p-4 flex flex-col justify-between group hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden`}>
                         <div className="flex justify-between items-start relative z-10">
                            <span className={`text-xl font-black eng-num ${isToday ? 'text-white' : day > 0 && day <= 31 ? 'text-gray-500' : 'text-gray-800 opacity-20'}`}>
                               {day > 0 && day <= 31 ? day : ''}
                            </span>
                            {isToday && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]" />}
                         </div>
                         
                         {isBusy && day > 0 && (
                            <div className="relative z-10 flex flex-col gap-1">
                               {dayEvents.slice(0, 2).map((ev, idx) => (
                                 <div key={idx} className="h-1.5 w-full bg-blue-500/40 rounded-full" title={ev.title} />
                               ))}
                               {dayEvents.length > 2 && <span className="text-[8px] font-black text-blue-400">+{dayEvents.length - 2}</span>}
                            </div>
                         )}

                         {/* Background Accent */}
                         {isBusy && <div className="absolute bottom-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full" />}
                      </div>
                    );
                 })}
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center bg-gray-950/40 backdrop-blur-[2px] pointer-events-none">
                 <div className="bg-gray-900/90 px-10 py-5 rounded-[2rem] border border-white/10 font-black text-gray-500 shadow-2xl flex items-center gap-4">
                    <Timer className="animate-spin text-blue-500" size={24}/> التزامن المباشر مع Google Calendar قيد المعالجة...
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 MODAL: ADD EVENT PROFESSIONAL */}
      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6">
           <motion.form initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onSubmit={handleAddEvent} className="grand-card p-12 bg-gray-950 border-white/10 w-full max-w-2xl space-y-10 shadow-[0_0_100px_rgba(59,130,246,0.15)] overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center border-b border-white/5 pb-8">
                 <h3 className="text-4xl font-black text-white flex items-center gap-6"><Plus className="text-blue-500 p-2 bg-blue-500/10 rounded-2xl" size={48}/> تثبيت موعد حاسم</h3>
                 <button type="button" onClick={() => setShowAddEvent(false)} className="p-4 text-gray-600 hover:text-white hover:bg-white/5 rounded-full transition-all"><X size={32}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-8">
                    <div className="group">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block group-focus-within:text-blue-500 transition-colors">موضوع اللقاء</label>
                       <input required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder="ماذا سيحدث غداً؟" className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] text-2xl font-black focus:border-blue-500 outline-none transition-all placeholder:opacity-20" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="group">
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block group-focus-within:text-blue-500 transition-colors">تصنيف الحدث</label>
                          <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value as any})} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl font-black text-lg appearance-none">
                             <option value="meeting">💼 اجتماع عمل</option>
                             <option value="personal">❤️ شخصي</option>
                             <option value="birthday">🎂 عيد ميلاد</option>
                             <option value="reminder">🔔 تذكير</option>
                          </select>
                       </div>
                       <div className="group">
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block group-focus-within:text-blue-500 transition-colors">الأولوية القصوى</label>
                          <select value={eventForm.priority} onChange={e => setEventForm({...eventForm, priority: e.target.value as any})} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl font-black text-lg appearance-none">
                             <option value="low">منخفضة</option>
                             <option value="medium">متوسطة</option>
                             <option value="high">حرج جداً</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="group">
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block group-focus-within:text-blue-500 transition-colors">التاريخ المختارة</label>
                          <input type="date" required value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl font-black text-lg eng-num" />
                       </div>
                       <div className="group">
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block group-focus-within:text-blue-500 transition-colors">توقيت البدء</label>
                          <input type="time" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl font-black text-lg eng-num" />
                       </div>
                    </div>

                    <div className="group">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block group-focus-within:text-blue-500 transition-colors">البطل المرتبط</label>
                       <select value={eventForm.personId} onChange={e => setEventForm({...eventForm, personId: e.target.value})} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl font-black text-lg appearance-none">
                          <option value="">لا يوجد شخص محدد</option>
                          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>

                    <div className="group">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block group-focus-within:text-blue-500 transition-colors">تكرار الإخطار</label>
                       <select value={eventForm.repeat} onChange={e => setEventForm({...eventForm, repeat: e.target.value as any})} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl font-black text-lg appearance-none">
                          <option value="none">مرة واحدة فقط</option>
                          <option value="yearly">تكرار سنوي</option>
                          <option value="monthly">تكرار شهري</option>
                       </select>
                    </div>
                 </div>
              </div>

              <div className="flex gap-6 pt-10">
                 <button type="submit" className="mega-action-btn bg-blue-500 text-black py-8 text-2xl flex-1 shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-95 transition-all">الآن .. سجل هذا الموعد في الأرشيف</button>
                 <button type="button" onClick={() => setShowAddEvent(false)} className="mega-action-btn bg-white/5 text-gray-600 border-white/10 py-8 text-xl px-12 hover:bg-white/10 transition-all">تراجع</button>
              </div>
           </motion.form>
        </div>
      )}

      {/* 🚀 MODAL: ADD PERSON PROFESSIONAL */}
      {showAddPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6">
           <motion.form initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onSubmit={handleAddPerson} className="grand-card p-12 bg-gray-950 border-white/10 w-full max-w-xl space-y-10 shadow-[0_0_100px_rgba(59,130,246,0.15)]">
              <div className="flex justify-between items-center border-b border-white/5 pb-8">
                 <h3 className="text-4xl font-black text-white flex items-center gap-6"><UserPlus className="text-blue-500 p-2 bg-blue-500/10 rounded-2xl" size={48}/> إضافة بطل جديد</h3>
                 <button type="button" onClick={() => setShowAddPerson(false)} className="p-4 text-gray-600 hover:text-white hover:bg-white/5 rounded-full transition-all"><X size={32}/></button>
              </div>

              <div className="space-y-8">
                 <div className="group">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block group-focus-within:text-blue-500 transition-colors">الاسم الكامل</label>
                    <input required value={personForm.name} onChange={e => setPersonForm({...personForm, name: e.target.value})} placeholder="الاسم الذي تطلقه عليه.." className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] text-2xl font-black focus:border-blue-500 outline-none transition-all placeholder:opacity-20" />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block group-focus-within:text-blue-500 transition-colors">طبيعة العلاقة</label>
                       <select value={personForm.relationship} onChange={e => setPersonForm({...personForm, relationship: e.target.value})} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl font-black text-lg appearance-none">
                          <option value="friend">صديق مقرب</option>
                          <option value="family">عائلة</option>
                          <option value="business">شريك عمل</option>
                       </select>
                    </div>
                    <div className="group">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block group-focus-within:text-blue-500 transition-colors">مستوى التأثير (1-5)</label>
                       <input type="number" min="1" max="5" value={personForm.importanceLevel} onChange={e => setPersonForm({...personForm, importanceLevel: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl font-black text-2xl text-center focus:border-blue-500 outline-none" />
                    </div>
                 </div>

                 <div className="group">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block group-focus-within:text-blue-500 transition-colors">ملاحظات سرية</label>
                    <textarea value={personForm.notes} onChange={e => setPersonForm({...personForm, notes: e.target.value})} placeholder="ما الذي يجب أن تتذكره عنه دائماً؟" className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] h-32 font-bold text-gray-400 focus:border-blue-500 outline-none transition-all resize-none" />
                 </div>
              </div>

              <div className="flex gap-6 pt-10">
                 <button type="submit" className="mega-action-btn bg-blue-500 text-black py-8 text-2xl flex-1 shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-95 transition-all">حفظ البطل في الدليل</button>
                 <button type="button" onClick={() => setShowAddPerson(false)} className="mega-action-btn bg-white/5 text-gray-600 border-white/10 py-8 text-xl px-12 hover:bg-white/10 transition-all">تراجع</button>
              </div>
           </motion.form>
        </div>
      )}

    </div>
  );
}
