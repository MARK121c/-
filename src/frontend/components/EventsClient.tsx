'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Users, Plus, Trash2, Clock, MapPin, Search, Copy, Check, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  type: string;
  date: string;
  time?: string | null;
  endTime?: string | null;
  repeat?: string;
  priority?: string;
  status?: string;
  personId?: number | null;
  notes?: string;
}

interface Person {
  id: number;
  name: string;
  relationship: string;
  notes: string;
  importanceLevel: number;
  lastInteraction?: string | null;
  createdAt: string;
}

export default function EventsClient() {
  const [tab, setTab] = useState<'events' | 'people'>('events');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // Event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    type: 'meeting',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    notes: '',
    priority: 'medium',
  });

  // Person form
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [personForm, setPersonForm] = useState({
    name: '',
    relationship: 'friend',
    notes: '',
    importanceLevel: 3,
  });

  const [searchPerson, setSearchPerson] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Calendar navigation
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<EventItem[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [eventsRes, peopleRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/people')
      ]);
      const eventsData = await eventsRes.json();
      const peopleData = await peopleRes.json();
      setEvents(eventsData.events || []);
      setPeople(peopleData.people || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventForm.title.trim()) return;

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm),
      });
      if (res.ok) {
        setShowEventForm(false);
        setEventForm({
          title: '',
          type: 'meeting',
          date: new Date().toISOString().split('T')[0],
          time: '12:00',
          notes: '',
          priority: 'medium',
        });
        fetchAll();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteEvent(id: number) {
    if (!confirm('حذف هذا الموعد؟')) return;
    setEvents(prev => prev.filter(ev => ev.id !== id));
    try {
      await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
      fetchAll();
    }
  }

  async function handleAddPerson(e: React.FormEvent) {
    e.preventDefault();
    if (!personForm.name.trim()) return;

    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personForm),
      });
      if (res.ok) {
        setShowPersonForm(false);
        setPersonForm({
          name: '',
          relationship: 'friend',
          notes: '',
          importanceLevel: 3,
        });
        fetchAll();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeletePerson(id: number) {
    if (!confirm('حذف جهة الاتصال؟')) return;
    setPeople(prev => prev.filter(p => p.id !== id));
    try {
      await fetch(`/api/people?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
      fetchAll();
    }
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Calendar calculations
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const monthNames = [
    'يناير / JAN', 'فبراير / FEB', 'مارس / MAR', 'أبريل / APR', 'مايو / MAY', 'يونيو / JUN',
    'يوليو / JUL', 'أغسطس / AUG', 'سبتمبر / SEP', 'أكتوبر / OCT', 'نوفمبر / NOV', 'ديسمبر / DEC'
  ];
  const dayNames = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const handleDayClick = (dateStr: string) => {
    const dayEvs = events.filter(e => e.date === dateStr);
    setSelectedDateStr(dateStr);
    setSelectedDayEvents(dayEvs);
  };

  const filteredPeople = people.filter(p =>
    !searchPerson.trim() || p.name.toLowerCase().includes(searchPerson.toLowerCase()) || p.notes?.toLowerCase().includes(searchPerson.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <CalendarIcon size={26} className="text-orange-400" />
            <span>المواعيد وشبكة العلاقات</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">تقويم تفاعلي للمواعيد الهامة ودليل بيانات جهات الاتصال</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setTab('events')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              tab === 'events' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <CalendarIcon size={14} />
            <span>المواعيد والتقويم ({events.length})</span>
          </button>
          <button
            onClick={() => setTab('people')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              tab === 'people' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>جهات الاتصال ({people.length})</span>
          </button>
        </div>
      </div>

      {/* ── EVENTS & CALENDAR TAB ── */}
      {tab === 'events' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-white">تقويم المواعيد الشهري</h3>
            <button
              onClick={() => setShowEventForm(!showEventForm)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-[#FF3300] text-white font-black text-xs shadow-lg hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>+ إضافة موعد جديد</span>
            </button>
          </div>

          {/* Add Event Form */}
          {showEventForm && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAddEvent}
              className="p-6 rounded-3xl bg-white/[0.04] border border-orange-500/30 space-y-4 shadow-xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="عنوان الموعد *"
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                />
                <input
                  type="date"
                  required
                  value={eventForm.date}
                  onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-[#0c0d12] border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500 font-mono"
                />
                <input
                  type="time"
                  value={eventForm.time}
                  onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-[#0c0d12] border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500 font-mono"
                />
                <select
                  value={eventForm.type}
                  onChange={e => setEventForm({ ...eventForm, type: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-[#0c0d12] border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="meeting">اجتماع (Meeting)</option>
                  <option value="reminder">تذكير (Reminder)</option>
                  <option value="birthday">عيد ميلاد (Birthday)</option>
                  <option value="holiday">عطلة (Holiday)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-gray-400 border border-white/10"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-orange-500 text-white font-black text-xs shadow-lg hover:bg-orange-400"
                >
                  حفظ الموعد
                </button>
              </div>
            </motion.form>
          )}

          {/* Monthly Calendar View */}
          <div className="p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <button
                onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
              >
                <ChevronRight size={18} />
              </button>
              <h4 className="text-lg font-black text-white font-mono">{monthNames[month]} {year}</h4>
              <button
                onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {dayNames.map((d, idx) => (
                <div key={idx} className="text-xs font-black text-gray-500 py-2">{d}</div>
              ))}

              {/* Empty spaces */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-14 sm:h-20 rounded-2xl bg-white/[0.01]" />
              ))}

              {/* Day Tiles */}
              {Array.from({ length: totalDays }).map((_, i) => {
                const dayNum = i + 1;
                const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = events.filter(e => e.date === dStr);
                const isToday = dStr === todayStr;
                const isSelected = dStr === selectedDateStr;

                return (
                  <button
                    key={dayNum}
                    onClick={() => handleDayClick(dStr)}
                    className={`h-14 sm:h-20 p-2 rounded-2xl border transition-all text-start flex flex-col justify-between cursor-pointer group ${
                      isSelected 
                        ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_15px_rgba(255,85,0,0.3)]' 
                        : isToday 
                        ? 'bg-white/[0.06] border-orange-500/50' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className={`text-xs font-mono font-black ${isToday ? 'text-orange-400' : 'text-gray-400'}`}>
                      {dayNum}
                    </span>

                    {dayEvents.length > 0 && (
                      <div className="flex gap-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map(e => (
                          <div key={e.id} className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_5px_rgba(255,85,0,0.8)]" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Event Drawer */}
            {selectedDateStr && (
              <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-2">
                <span className="text-xs font-mono font-black text-orange-400">مواعيد يوم: {selectedDateStr}</span>
                {selectedDayEvents && selectedDayEvents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDayEvents.map(e => (
                      <div key={e.id} className="flex justify-between items-center p-3 rounded-xl bg-black/40 border border-white/10">
                        <div>
                          <strong className="text-sm text-white block">{e.title}</strong>
                          <span className="text-xs text-gray-400 font-mono">🕒 {e.time || 'طوال اليوم'} • {e.type}</span>
                        </div>
                        <button onClick={() => handleDeleteEvent(e.id)} className="p-1.5 text-gray-500 hover:text-rose-400">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">لا توجد مواعيد مسجلة في هذا اليوم</p>
                )}
              </div>
            )}
          </div>

          {/* Upcoming Events List */}
          <div className="space-y-3">
            <h4 className="text-base font-black text-white">قائمة المواعيد القادمة</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.slice(0, 10).map(e => (
                <div key={e.id} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-orange-500/30 transition-all flex justify-between items-start group">
                  <div className="space-y-1">
                    <strong className="text-base font-bold text-white block">{e.title}</strong>
                    <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                      <span>📅 {e.date}</span>
                      {e.time && <span>🕒 {e.time}</span>}
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-orange-400 border border-white/10">{e.type}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteEvent(e.id)} className="p-1.5 text-gray-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PEOPLE & CONTACTS TAB ── */}
      {tab === 'people' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                value={searchPerson}
                onChange={e => setSearchPerson(e.target.value)}
                placeholder="بحث في جهات الاتصال..."
                className="w-full pr-11 pl-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              onClick={() => setShowPersonForm(!showPersonForm)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-[#FF3300] text-white font-black text-xs shadow-lg hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <UserPlus size={16} />
              <span>+ إضافة جهة اتصال</span>
            </button>
          </div>

          {/* Add Person Form */}
          {showPersonForm && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAddPerson}
              className="p-6 rounded-3xl bg-white/[0.04] border border-orange-500/30 space-y-4 shadow-xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  required
                  value={personForm.name}
                  onChange={e => setPersonForm({ ...personForm, name: e.target.value })}
                  placeholder="الاسم *"
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                />
                <select
                  value={personForm.relationship}
                  onChange={e => setPersonForm({ ...personForm, relationship: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-[#0c0d12] border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="friend">صديق (Friend)</option>
                  <option value="business">عمل وشراكة (Business)</option>
                  <option value="family">عائلة (Family)</option>
                  <option value="other">أخرى (Other)</option>
                </select>
                <input
                  type="text"
                  value={personForm.notes}
                  onChange={e => setPersonForm({ ...personForm, notes: e.target.value })}
                  placeholder="ملاحظات / هاتف / حساب..."
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPersonForm(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-gray-400 border border-white/10"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-orange-500 text-white font-black text-xs shadow-lg hover:bg-orange-400"
                >
                  حفظ
                </button>
              </div>
            </motion.form>
          )}

          {/* People Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeople.map(p => (
              <div key={p.id} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all space-y-3 group">
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-base font-black text-white block">{p.name}</strong>
                    <span className="text-xs text-orange-400 font-mono font-bold uppercase">{p.relationship}</span>
                  </div>
                  <button onClick={() => handleDeletePerson(p.id)} className="p-1.5 text-gray-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                  </button>
                </div>

                {p.notes && (
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-gray-300 flex justify-between items-center">
                    <span className="truncate">{p.notes}</span>
                    <button
                      onClick={() => copyText(p.notes, `p-${p.id}`)}
                      className="p-1 text-gray-500 hover:text-orange-400 shrink-0"
                      title="نسخ"
                    >
                      {copiedId === `p-${p.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredPeople.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-500">
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">لا توجد جهات اتصال مطابقة</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
