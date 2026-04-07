'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Cake, 
  Video, 
  Bell, 
  Plus, 
  Trash2, 
  Search, 
  Star, 
  MessageSquare, 
  History,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  UserPlus
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
  getEvents: () => fetch('/api/events/today').then(r => r.json()), // Custom endpoint for today + upcoming
  addEvent: (data: any) => fetch('/api/events', { method: 'POST', body: JSON.stringify(data) }),
  deleteEvent: (id: number) => fetch(`/api/events?id=${id}`, { method: 'DELETE' }),
};

export default function EventsClient() {
  const [people, setPeople] = useState<Person[]>([]);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'people' | 'events'>('events');
  const [search, setSearch] = useState('');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const [personForm, setPersonForm] = useState({ name: '', relationship: 'friend', notes: '', importanceLevel: 3 });
  const [eventForm, setEventForm] = useState({ title: '', type: 'reminder', date: new Date().toISOString().split('T')[0], repeat: 'none', personId: '' as any, reminderBeforeDays: 1, notes: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const pData = await api.getPeople();
      const eData = await api.getEvents();
      setPeople(pData.people || []);
      setTodayEvents(eData.todayEvents || []);
      setUpcomingEvents(eData.upcomingEvents || []);
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
    setEventForm({ title: '', type: 'reminder', date: new Date().toISOString().split('T')[0], repeat: 'none', personId: '', reminderBeforeDays: 1, notes: '' });
    loadData();
  };

  const filteredPeople = people.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="text-gray-100 min-h-screen pb-20">
      {/* Header Overlay Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
         {/* Today's Focus Card */}
         <div className="lg:col-span-2 grand-card p-10 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-indigo-500/20 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full" />
            <h2 className="text-4xl font-black mb-10 flex items-center gap-4">
               أجندة اليوم <CalendarIcon className="text-purple-400" size={32} />
            </h2>
            <div className="space-y-6">
               {todayEvents.length > 0 ? todayEvents.map(e => (
                 <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={e.id} className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all">
                    <div className={`p-4 rounded-2xl ${e.type === 'birthday' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                       {e.type === 'birthday' ? <Cake size={28} /> : <Video size={28} />}
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-white">{e.title}</h3>
                       <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{e.personName || 'مناسبة عامة'}</p>
                    </div>
                 </motion.div>
               )) : (
                 <p className="text-gray-600 italic py-10 text-xl font-bold">لا يوجد أحداث مسجلة اليوم...</p>
               )}
            </div>
         </div>

         {/* Upcoming Summary Card */}
         <div className="lg:col-span-2 grand-card p-10 bg-white/2 border-white/10 flex flex-col justify-between">
            <div>
               <h3 className="text-xl font-black text-emerald-400 flex items-center gap-3 mb-8">
                  <Bell size={24} /> أحداث قادمة (الأسبوع)
               </h3>
               <div className="space-y-4 max-h-[250px] overflow-y-auto pr-4 scrollbar-hide">
                  {upcomingEvents.filter(e => (e.daysUntil ?? 100) <= 7).map(e => (
                    <div key={e.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-white/5">
                       <span className="font-black text-white">{e.title}</span>
                       <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-lg">بعد {e.daysUntil ?? 0} أيام</span>
                    </div>
                  ))}
                  {upcomingEvents.filter(e => (e.daysUntil ?? 100) <= 7).length === 0 && <p className="text-gray-700 italic text-center py-10">هدوء تام...</p>}
               </div>
            </div>
            <button onClick={() => setShowAddEvent(true)} className="mega-action-btn bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 w-full py-4 mt-8">+ إضافة مناسبة</button>
         </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between mb-8 px-4">
         <div className="flex gap-4 p-2 bg-gray-900/50 rounded-3xl border border-white/5">
            <button onClick={() => setActiveTab('events')} className={`px-10 py-3 rounded-2xl font-black transition-all ${activeTab === 'events' ? 'bg-purple-500 text-white shadow-xl shadow-purple-500/20' : 'text-gray-500 hover:text-white'}`}>المخطط الزمني</button>
            <button onClick={() => setActiveTab('people')} className={`px-10 py-3 rounded-2xl font-black transition-all ${activeTab === 'people' ? 'bg-purple-500 text-white shadow-xl shadow-purple-500/20' : 'text-gray-500 hover:text-white'}`}>دليل الناس</button>
         </div>
         {activeTab === 'people' && (
           <div className="relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-purple-400 transition-colors" size={20} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن شخص..." className="bg-gray-900 border border-white/5 rounded-2xl pr-12 pl-6 py-3 w-64 outline-none focus:border-purple-500/50 transition-all font-black" />
           </div>
         )}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'events' ? (
          <motion.div key="ev" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {upcomingEvents.map(e => (
               <div key={e.id} className="grand-card p-8 bg-gray-950/50 border-white/5 group hover:border-purple-500/40 transition-all hover:translate-y-[-5px]">
                  <div className="flex justify-between items-start mb-6">
                     <div className={`p-4 rounded-2xl ${e.type === 'birthday' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {e.type === 'birthday' ? <Cake size={24} /> : <CalendarIcon size={24} />}
                     </div>
                     <button onClick={() => { if(confirm('حذف؟')) api.deleteEvent(e.id).then(loadData) }} className="text-gray-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                  </div>
                  <h4 className="text-2xl font-black text-white mb-2 leading-tight">{e.title}</h4>
                  <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-6">{e.personName || 'حدث عام'}</p>
                  
                  <div className="flex items-center justify-between border-t border-white/5 pt-6">
                     <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase">
                        <History size={14} /> {e.repeat === 'yearly' ? 'سنوي' : 'مرة واحدة'}
                     </div>
                     <span className="text-purple-400 font-black eng-num">{e.date}</span>
                  </div>
               </div>
             ))}
             {upcomingEvents.length === 0 && <div className="col-span-full py-40 text-center text-gray-700 text-3xl font-black italic">الأيام القادمة هادئة جداً...</div>}
          </motion.div>
        ) : (
          <motion.div key="pe" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             {/* Add Person Card */}
             <div onClick={() => setShowAddPerson(true)} className="grand-card p-10 border-dashed border-white/10 hover:border-purple-500/40 flex flex-col items-center justify-center gap-6 cursor-pointer group transition-all">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <UserPlus size={32} />
                </div>
                <span className="text-xl font-black text-gray-500 group-hover:text-white transition-colors">إضافة بطل جديد</span>
             </div>

             {filteredPeople.map(p => (
               <div key={p.id} className="grand-card p-10 bg-gray-950/50 border-white/5 group relative overflow-hidden">
                  <button onClick={() => { if(confirm('حذف؟')) api.deletePerson(p.id).then(loadData) }} className="absolute left-6 top-6 text-gray-800 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl mb-8 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-purple-500/20">
                     {p.name.charAt(0)}
                  </div>
                  <h4 className="text-3xl font-black text-white mb-2">{p.name}</h4>
                  <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-6">{p.relationship === 'friend' ? 'صديق' : p.relationship === 'family' ? 'عائلة' : 'عمل'}</p>
                  
                  <div className="space-y-4">
                     <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                           <Star key={i} size={16} className={`${i < p.importanceLevel ? 'text-amber-400 fill-amber-400' : 'text-gray-800'}`} />
                        ))}
                     </div>
                     <div className="flex items-center gap-3 text-gray-500 text-sm font-bold bg-white/2 p-3 rounded-xl border border-white/5">
                        <MessageSquare size={16} /> {p.lastInteraction || 'لا يوجد تاريخ'}
                     </div>
                  </div>
               </div>
             ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Person Modal */}
      {showAddPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
           <motion.form initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onSubmit={handleAddPerson} className="grand-card p-12 bg-gray-900 border-white/10 w-full max-w-lg space-y-8">
              <h3 className="text-3xl font-black text-white">إضافة شخص للدليل</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">الاسم بالكامل</label>
                    <input required value={personForm.name} onChange={e => setPersonForm({...personForm, name: e.target.value})} className="w-full bg-gray-800 border border-white/5 p-4 rounded-2xl text-xl font-black outline-none focus:border-purple-500 transition-all" />
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
                 <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">ملاحظات سريعة</label>
                    <textarea value={personForm.notes} onChange={e => setPersonForm({...personForm, notes: e.target.value})} className="w-full bg-gray-800 border border-white/5 p-4 rounded-2xl font-bold min-h-[100px]" />
                 </div>
              </div>
              <div className="flex gap-4">
                 <button type="submit" className="mega-action-btn flex-1 bg-purple-500 text-white border-purple-400">حفظ الشخص</button>
                 <button type="button" onClick={() => setShowAddPerson(false)} className="mega-action-btn flex-1 bg-white/5 text-gray-500 border-white/10">إلغاء</button>
              </div>
           </motion.form>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
           <motion.form initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onSubmit={handleAddEvent} className="grand-card p-12 bg-gray-900 border-white/10 w-full max-w-lg space-y-8">
              <h3 className="text-3xl font-black text-white">إضافة مناسبة جديدة</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">عنوان المناسبة</label>
                    <input required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full bg-gray-800 border border-white/5 p-4 rounded-2xl text-xl font-black" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">شخص مرتبط (اختياري)</label>
                        <select value={eventForm.personId} onChange={e => setEventForm({...eventForm, personId: e.target.value})} className="w-full bg-gray-800 border border-white/5 p-4 rounded-2xl font-black">
                           <option value="">بدون شخص</option>
                           {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">التاريخ</label>
                        <input type="date" required value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full bg-gray-800 border border-white/5 p-4 rounded-2xl font-black" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">النوع</label>
                        <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value as any})} className="w-full bg-gray-800 border border-white/5 p-4 rounded-2xl font-black">
                           <option value="birthday">عيد ميلاد 🎂</option>
                           <option value="meeting">اجتماع / موعد 📅</option>
                           <option value="reminder">تذكير عام 🔔</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">التكرار</label>
                        <select value={eventForm.repeat} onChange={e => setEventForm({...eventForm, repeat: e.target.value as any})} className="w-full bg-gray-800 border border-white/5 p-4 rounded-2xl font-black">
                           <option value="none">بدون تكرار</option>
                           <option value="yearly">سنوي</option>
                           <option value="monthly">شهري</option>
                        </select>
                    </div>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button type="submit" className="mega-action-btn flex-1 bg-purple-500 text-white border-purple-400">تثبيت المناسبة</button>
                 <button type="button" onClick={() => setShowAddEvent(false)} className="mega-action-btn flex-1 bg-white/5 text-gray-500 border-white/10">إلغاء</button>
              </div>
           </motion.form>
        </div>
      )}
    </div>
  );
}
