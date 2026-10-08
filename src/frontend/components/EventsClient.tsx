'use client';
import { useState, useEffect } from 'react';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  category: string;
  location: string;
  reminder: number;
  is_recurring: number;
  recurrence_pattern: string;
}

interface Friend {
  id: number;
  name: string;
  phone: string;
  email: string;
  category: string;
  notes: string;
  birthday: string;
}

export default function EventsClient() {
  const [tab, setTab] = useState<'events' | 'friends'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showFriendForm, setShowFriendForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', event_date: '', event_time: '', category: '', location: '', reminder: 0 });
  const [friendForm, setFriendForm] = useState({ name: '', phone: '', email: '', category: '', notes: '', birthday: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [eRes, fRes] = await Promise.all([fetch('/api/events'), fetch('/api/friends')]);
      const eData = await eRes.json();
      const fData = await fRes.json();
      setEvents(eData.events || []);
      setFriends(fData.friends || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventForm) });
    setShowEventForm(false);
    setEventForm({ title: '', description: '', event_date: '', event_time: '', category: '', location: '', reminder: 0 });
    fetchAll();
  }

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(friendForm) });
    setShowFriendForm(false);
    setFriendForm({ name: '', phone: '', email: '', category: '', notes: '', birthday: '' });
    fetchAll();
  }

  async function deleteEvent(id: number) {
    if (!confirm('حذف الموعد؟')) return;
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    fetchAll();
  }

  async function deleteFriend(id: number) {
    if (!confirm('حذف جهة الاتصال؟')) return;
    await fetch(`/api/friends/${id}`, { method: 'DELETE' });
    fetchAll();
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Calendar helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const dayNames = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const eventsByDate: Record<string, Event[]> = {};
  events.forEach(e => {
    if (!eventsByDate[e.event_date]) eventsByDate[e.event_date] = [];
    eventsByDate[e.event_date].push(e);
  });

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= new Date(todayStr))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  const filteredFriends = friends.filter(f => 
    !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryColors: Record<string, string> = {
    'عمل': '#3B82F6', 'شخصي': '#10B981', 'دراسة': '#8B5CF6', 'صحة': '#EF4444',
    'اجتماعي': '#F59E0B', 'سفر': '#06B6D4',
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,85,0,0.2)', borderTop: '3px solid #FF5500', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '20px', direction: 'rtl' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setTab('events')} style={{
          padding: '12px 24px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 900,
          background: tab === 'events' ? 'linear-gradient(135deg, #FF5500, #FF3300)' : 'rgba(255,255,255,0.04)',
          color: tab === 'events' ? '#fff' : '#888',
          boxShadow: tab === 'events' ? '0 0 15px rgba(255,85,0,0.3)' : 'none'
        }}>
          📅 المواعيد والتقويم
        </button>
        <button onClick={() => setTab('friends')} style={{
          padding: '12px 24px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 900,
          background: tab === 'friends' ? 'linear-gradient(135deg, #FF5500, #FF3300)' : 'rgba(255,255,255,0.04)',
          color: tab === 'friends' ? '#fff' : '#888',
          boxShadow: tab === 'friends' ? '0 0 15px rgba(255,85,0,0.3)' : 'none'
        }}>
          👥 جهات الاتصال ({friends.length})
        </button>
      </div>

      {/* ── EVENTS TAB ── */}
      {tab === 'events' && (
        <div>
          {/* Calendar */}
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 24, marginBottom: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Calendar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>◀</button>
              <h3 style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: 18 }}>
                {monthNames[month]} {year}
              </h3>
              <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>▶</button>
            </div>

            {/* Day Names */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {dayNames.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#888', fontWeight: 700, padding: 4 }}>{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {/* Empty cells for days before 1st */}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} style={{ padding: 8 }} />
              ))}
              
              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEvents = eventsByDate[dateStr]?.length > 0;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;

                return (
                  <button 
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    style={{
                      padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: isSelected ? '#FF5500' : isToday ? 'rgba(255,85,0,0.15)' : hasEvents ? 'rgba(255,85,0,0.06)' : 'transparent',
                      color: isSelected ? '#fff' : isToday ? '#FF5500' : '#ccc',
                      fontWeight: isToday || hasEvents ? 900 : 400,
                      fontSize: 13,
                      position: 'relative',
                      outline: isToday && !isSelected ? '2px solid rgba(255,85,0,0.4)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {day}
                    {hasEvents && !isSelected && (
                      <div style={{ 
                        position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                        width: 5, height: 5, borderRadius: '50%', background: '#FF5500' 
                      }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Events */}
            {selectedDate && eventsByDate[selectedDate] && (
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(255,85,0,0.06)', borderRadius: 12, border: '1px solid rgba(255,85,0,0.15)' }}>
                <h4 style={{ margin: '0 0 8px', color: '#FF5500', fontSize: 13, fontWeight: 900 }}>
                  أحداث {selectedDate}:
                </h4>
                {eventsByDate[selectedDate].map(ev => (
                  <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{ev.title}</span>
                      {ev.event_time && <span style={{ color: '#888', fontSize: 11, marginRight: 8 }}>🕐 {ev.event_time}</span>}
                    </div>
                    {ev.location && <span style={{ color: '#888', fontSize: 11 }}>📍 {ev.location}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Event Button + Form */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: 18 }}>📋 المواعيد القادمة ({upcomingEvents.length})</h3>
            <button onClick={() => setShowEventForm(!showEventForm)} style={{ background: 'linear-gradient(135deg, #FF5500, #FF3300)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 900, fontSize: 13, boxShadow: '0 0 12px rgba(255,85,0,0.2)' }}>+ موعد جديد</button>
          </div>

          {showEventForm && (
            <form onSubmit={addEvent} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, marginBottom: 20, border: '1px solid rgba(255,85,0,0.15)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <input placeholder="عنوان الموعد *" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14 }} />
                <input placeholder="المكان" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14 }} />
                <input type="date" value={eventForm.event_date} onChange={e => setEventForm({...eventForm, event_date: e.target.value})} required style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14 }} />
                <input type="time" value={eventForm.event_time} onChange={e => setEventForm({...eventForm, event_time: e.target.value})} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14 }} />
                <input placeholder="التصنيف" value={eventForm.category} onChange={e => setEventForm({...eventForm, category: e.target.value})} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14 }} />
              </div>
              <textarea placeholder="الوصف" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, minHeight: 50, marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #FF5500, #FF3300)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 12, cursor: 'pointer', fontWeight: 900, boxShadow: '0 0 10px rgba(255,85,0,0.2)' }}>إضافة</button>
                <button type="button" onClick={() => setShowEventForm(false)} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>إلغاء</button>
              </div>
            </form>
          )}

          {/* Upcoming Events List */}
          {upcomingEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>📅</span>
              <p style={{ fontSize: 16, fontWeight: 700 }}>لا توجد مواعيد قادمة</p>
            </div>
          ) : upcomingEvents.map(event => {
            const catColor = categoryColors[event.category] || '#FF5500';
            const isEventToday = event.event_date === todayStr;
            return (
              <div key={event.id} style={{ 
                background: isEventToday ? 'rgba(255,85,0,0.06)' : 'rgba(255,255,255,0.02)', 
                borderRadius: 16, padding: '14px 18px', marginBottom: 8, 
                border: `1px solid ${isEventToday ? 'rgba(255,85,0,0.2)' : 'rgba(255,255,255,0.06)'}`, 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderRight: `3px solid ${catColor}`
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{event.title}</span>
                    {isEventToday && (
                      <span style={{ background: '#FF5500', color: '#fff', padding: '1px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>اليوم</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#FF5500', fontWeight: 700 }}>📅 {event.event_date}</span>
                    {event.event_time && <span style={{ fontSize: 11, color: '#888' }}>🕐 {event.event_time}</span>}
                    {event.location && <span style={{ fontSize: 11, color: '#888' }}>📍 {event.location}</span>}
                    {event.category && <span style={{ fontSize: 11, color: catColor, fontWeight: 700 }}>{event.category}</span>}
                  </div>
                </div>
                <button onClick={() => deleteEvent(event.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, padding: 4 }}>🗑️</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FRIENDS TAB ── */}
      {tab === 'friends' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: 18 }}>👥 جهات الاتصال</h3>
            <button onClick={() => setShowFriendForm(!showFriendForm)} style={{ background: 'linear-gradient(135deg, #FF5500, #FF3300)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 900, fontSize: 13, boxShadow: '0 0 12px rgba(255,85,0,0.2)' }}>+ إضافة</button>
          </div>

          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <input 
              placeholder="🔍 بحث بالاسم..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '12px 18px', color: '#fff', fontSize: 14, fontWeight: 700 }} 
            />
          </div>

          {showFriendForm && (
            <form onSubmit={addFriend} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, marginBottom: 20, border: '1px solid rgba(255,85,0,0.15)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <input placeholder="الاسم *" value={friendForm.name} onChange={e => setFriendForm({...friendForm, name: e.target.value})} required style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14 }} />
                <input placeholder="رقم الهاتف" value={friendForm.phone} onChange={e => setFriendForm({...friendForm, phone: e.target.value})} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14 }} />
                <input placeholder="البريد" value={friendForm.email} onChange={e => setFriendForm({...friendForm, email: e.target.value})} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14 }} />
                <input placeholder="التصنيف" value={friendForm.category} onChange={e => setFriendForm({...friendForm, category: e.target.value})} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14 }} />
                <input type="date" placeholder="تاريخ الميلاد" value={friendForm.birthday} onChange={e => setFriendForm({...friendForm, birthday: e.target.value})} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14 }} />
              </div>
              <textarea placeholder="ملاحظات" value={friendForm.notes} onChange={e => setFriendForm({...friendForm, notes: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, minHeight: 50, marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #FF5500, #FF3300)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 12, cursor: 'pointer', fontWeight: 900, boxShadow: '0 0 10px rgba(255,85,0,0.2)' }}>إضافة</button>
                <button type="button" onClick={() => setShowFriendForm(false)} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>إلغاء</button>
              </div>
            </form>
          )}

          {/* Friends Table */}
          {filteredFriends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>👥</span>
              <p style={{ fontSize: 16, fontWeight: 700 }}>لا توجد جهات اتصال</p>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              {/* Table Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 50px', gap: 8, padding: '12px 18px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 900 }}>الاسم</span>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 900 }}>الهاتف</span>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 900 }}>البريد</span>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 900 }}>التصنيف</span>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 900 }}>الميلاد</span>
                <span></span>
              </div>
              {/* Table Rows */}
              {filteredFriends.map(friend => (
                <div key={friend.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 50px', gap: 8, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', transition: 'background 0.2s' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{friend.name}</span>
                  <span 
                    onClick={() => friend.phone && copyToClipboard(friend.phone, `phone-${friend.id}`)} 
                    style={{ color: '#888', fontSize: 12, cursor: friend.phone ? 'pointer' : 'default' }}
                  >
                    {copiedId === `phone-${friend.id}` ? '✅ تم النسخ' : (friend.phone || '—')}
                  </span>
                  <span 
                    onClick={() => friend.email && copyToClipboard(friend.email, `email-${friend.id}`)} 
                    style={{ color: '#888', fontSize: 12, cursor: friend.email ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {copiedId === `email-${friend.id}` ? '✅ تم النسخ' : (friend.email || '—')}
                  </span>
                  <span style={{ color: '#FF5500', fontSize: 11, fontWeight: 700 }}>{friend.category || '—'}</span>
                  <span style={{ color: '#888', fontSize: 11 }}>{friend.birthday ? `🎂 ${friend.birthday}` : '—'}</span>
                  <button onClick={() => deleteFriend(friend.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, padding: 2 }}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
